// Supabase Database Connection
// Replaces the old MySQL connection with Supabase PostgreSQL

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const ws = require('ws');
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { transport: ws }
});
// Database wrapper for compatibility with existing code
const db = {
  async query(sql, params = []) {
    try {
      return await this.executeQuery(sql, params);
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  },

  async executeQuery(sql, params = []) {
    try {
      const upperSql = sql.trim().toUpperCase();

      // Handle different SQL operations
      if (upperSql.startsWith('SELECT')) {
        return await this.handleSelect(sql, params);
      } else if (upperSql.startsWith('INSERT')) {
        return await this.handleInsert(sql, params);
      } else if (upperSql.startsWith('UPDATE')) {
        return await this.handleUpdate(sql, params);
      } else if (upperSql.startsWith('DELETE')) {
        return await this.handleDelete(sql, params);
      } else if (upperSql.startsWith('CALL')) {
        // Stored procedures - convert to RPC calls or handle in code
        console.warn('Stored procedure called:', sql);
        return await this.handleStoredProcedure(sql, params);
      }

      return [[], []];
    } catch (error) {
      throw error;
    }
  },

  normalizeTableName(table) {
    const mapping = {
      'patient': 'patient',
      'doctor': 'doctor',
      'clinic': 'clinic',
      'doctorclinic': 'doctor_clinic',
      'clinics': 'clinic',
      'doctors': 'doctor',
      'patients': 'patient',
      'staff': 'staff',
      'slot': 'slot',
      'slots': 'slot',
      'clinicdiailyavailability': 'clinic_daily_availability',
      'appointment': 'appointment',
      'appointments': 'appointment',
      'walkin': 'walk_in',
      'consultation': 'consultation',
      'prescription': 'prescription',
      'prescriptionitem': 'prescription_item',
      'patientconditions': 'patient_conditions',
      'reminder': 'reminder',
      'inventorycategory': 'inventory_category',
      'inventoryitem': 'inventory_item',
      'inventoryalert': 'inventory_alert',
      'reordersuggestion': 'reorder_suggestion',
      'stockorder': 'stock_order',
      'otp_verification': 'otp_verification'
    };

    return mapping[table.toLowerCase()] || table.toLowerCase();
  },

  normalizeColumnName(column) {
    // Convert camelCase to snake_case
    return column
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  },

 async handleSelect(sql, params) {
  try {
    const upperSql = sql.toUpperCase();
    
    // If query has JOINs, use Supabase foreign key relationships
    if (upperSql.includes('JOIN')) {
      return await this.handleJoinSelect(sql, params);
    }

    const fromMatch = sql.match(/FROM\s+`?([a-zA-Z_]+)`?/i);
    if (!fromMatch) throw new Error('Could not parse table from SELECT query');

    const tableName = this.normalizeTableName(fromMatch[1]);
    let query = supabase.from(tableName).select('*');

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|$)/i);
    if (whereMatch && params.length > 0) {
      query = this.addWhereConditions(query, whereMatch[1], params);
    }

    const orderMatch = sql.match(/ORDER\s+BY\s+([^;]+?)(?:\s+LIMIT|$)/i);
    if (orderMatch) query = this.addOrderBy(query, orderMatch[1]);

    const limitMatch = sql.match(/LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      const offset = limitMatch[2] ? parseInt(limitMatch[2]) : 0;
      query = query.limit(limit);
      if (offset > 0) query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return [data || [], []];
  } catch (error) {
    console.error('SELECT error:', error);
    throw error;
  }
},

async handleJoinSelect(sql, params) {
  try {
    const fromMatch = sql.match(/FROM\s+`?([a-zA-Z_]+)`?\s+(?:AS\s+)?([a-zA-Z])?/i);
    if (!fromMatch) throw new Error('Could not parse table from JOIN query');

    const tableName = this.normalizeTableName(fromMatch[1]);

    // Build select string from JOIN tables
    // Extract all joined tables and build Supabase nested select
    const joinMatches = [...sql.matchAll(/JOIN\s+`?([a-zA-Z_]+)`?\s+(?:ON\s+[^\s]+\s*=\s*[^\s]+)?/gi)];
    const joinedTables = joinMatches.map(m => this.normalizeTableName(m[1]));

    // Use wildcard with joined tables as nested selects
    const selectStr = ['*', ...joinedTables.map(t => `${t}(*)`)].join(', ');

    let query = supabase.from(tableName).select(selectStr);

    // Apply WHERE
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|$)/i);
    if (whereMatch && params.length > 0) {
      query = this.addWhereConditions(query, whereMatch[1], params);
    }

    // Apply ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+([^;]+?)(?:\s+LIMIT|$)/i);
    if (orderMatch) query = this.addOrderBy(query, orderMatch[1]);

    // Apply LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) query = query.limit(parseInt(limitMatch[1]));

    const { data, error } = await query;
    if (error) {
      // Fallback: if nested select fails (no FK relationship), just select from main table
      console.warn('JOIN select failed, falling back to main table only:', error.message);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(tableName)
        .select('*');
      if (fallbackError) throw fallbackError;
      return [fallbackData || [], []];
    }

    // Flatten joined data into each row (mimic MySQL JOIN behaviour)
    const flattened = (data || []).map(row => {
      const flat = { ...row };
      joinedTables.forEach(t => {
        if (flat[t] && typeof flat[t] === 'object' && !Array.isArray(flat[t])) {
          Object.assign(flat, flat[t]);
          delete flat[t];
        }
      });
      return flat;
    });

    return [flattened, []];
  } catch (error) {
    console.error('JOIN SELECT error:', error);
    throw error;
  }
},
  addWhereConditions(query, whereClause, params) {
    try {
      let paramIndex = 0;
      
      // Split by AND, but be careful with nested conditions
      const conditions = whereClause.split(/\s+AND\s+/i);

      conditions.forEach(condition => {
        condition = condition.trim();
        
        if (condition.includes('=')) {
          const [colPart, opPart] = condition.split('=');
          const column = this.normalizeColumnName(colPart.trim());
          
          // Handle parameterized query (?)
          if (opPart.trim() === '?') {
            if (paramIndex < params.length) {
              query = query.eq(column, params[paramIndex++]);
            }
          }
          // Handle literal values
          else {
            const value = opPart.trim().replace(/['"]/g, '');
            if (value !== '?') {
              query = query.eq(column, value);
            }
          }
        } else if (condition.includes('>')) {
          const [colPart, valPart] = condition.split('>');
          const column = this.normalizeColumnName(colPart.trim());
          if (valPart.trim() === '?') {
            query = query.gt(column, params[paramIndex++]);
          }
        } else if (condition.includes('<')) {
          const [colPart, valPart] = condition.split('<');
          const column = this.normalizeColumnName(colPart.trim());
          if (valPart.trim() === '?') {
            query = query.lt(column, params[paramIndex++]);
          }
        }
      });

      return query;
    } catch (error) {
      console.error('WHERE clause parsing error:', error);
      return query;
    }
  },

  addOrderBy(query, orderClause) {
    try {
      const parts = orderClause.split(',');
      parts.forEach(part => {
        let raw = part.trim();

        // Handle dot-suffixed direction, e.g. "r.scheduled_for.asc"
        let direction = null;
        const dotParts = raw.split('.');
        const lastDot = dotParts[dotParts.length - 1].toLowerCase();
        if (['asc', 'desc', 'nullsfirst', 'nullslast'].includes(lastDot)) {
          direction = lastDot;
          raw = dotParts.slice(0, dotParts.length - 1).join('.');
        }

        // Handle whitespace separated direction, e.g. "r.scheduled_for ASC"
        const wsParts = raw.split(/\s+/);
        const columnPart = wsParts[0];
        if (!direction && wsParts[1]) direction = wsParts[1].toLowerCase();

        // Strip any table alias before the column name (e.g. "r.scheduled_for" -> "scheduled_for")
        const columnOnly = columnPart.includes('.') ? columnPart.split('.').pop() : columnPart;

        const ascending = !direction || direction.toUpperCase() !== 'DESC';
        query = query.order(this.normalizeColumnName(columnOnly), { ascending });
      });
      return query;
    } catch (error) {
      console.error('ORDER BY parsing error:', error);
      return query;
    }
  },

  async handleInsert(sql, params) {
    try {
      const tableMatch = sql.match(/INSERT(?:\s+IGNORE)?\s+INTO\s+`?([a-zA-Z_]+)`?/i);
      const columnsMatch = sql.match(/\(([^)]+)\)/);

      if (!tableMatch || !columnsMatch) {
        throw new Error('Could not parse INSERT query');
      }

      const tableName = this.normalizeTableName(tableMatch[1]);
      const columns = columnsMatch[1]
        .split(',')
        .map(c => this.normalizeColumnName(c.trim()));

      const data = {};
      columns.forEach((col, idx) => {
        if (idx < params.length) {
          data[col] = params[idx];
        }
      });

      const { data: result, error } = await supabase
        .from(tableName)
        .insert([data])
        .select();

      if (error) throw error;

      // Return insertId in MySQL format
      const insertedRecord = result?.[0];
      const idColumn = Object.keys(insertedRecord || {}).find(k => k.endsWith('_id')) || 'id';
      
      return [{
        insertId: insertedRecord?.[idColumn] || null,
        affectedRows: 1
      }, []];
    } catch (error) {
      console.error('INSERT error:', error);
      throw error;
    }
  },

  async handleUpdate(sql, params) {
    try {
      const tableMatch = sql.match(/UPDATE\s+`?([a-zA-Z_]+)`?/i);
      const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
      const whereMatch = sql.match(/WHERE\s+(.+?)$/i);

      if (!tableMatch || !setMatch) {
        throw new Error('Could not parse UPDATE query');
      }

      const tableName = this.normalizeTableName(tableMatch[1]);
      const data = {};
      
      const sets = setMatch[1].split(',');
      let paramIndex = 0;

      sets.forEach(set => {
        const [col, val] = set.split('=');
        const column = this.normalizeColumnName(col.trim());
        
        if (val.trim() === '?' && paramIndex < params.length) {
          data[column] = params[paramIndex++];
        }
      });

      let updateQuery = supabase.from(tableName).update(data);

      // Apply WHERE clause
      if (whereMatch && paramIndex < params.length) {
        const whereCol = whereMatch[1].split('=')[0].trim();
        const column = this.normalizeColumnName(whereCol);
        updateQuery = updateQuery.eq(column, params[paramIndex]);
      }

      const { error } = await updateQuery;
      if (error) throw error;

      return [{ affectedRows: 1 }, []];
    } catch (error) {
      console.error('UPDATE error:', error);
      throw error;
    }
  },

  async handleDelete(sql, params) {
    try {
      const tableMatch = sql.match(/DELETE\s+FROM\s+`?([a-zA-Z_]+)`?/i);
      const whereMatch = sql.match(/WHERE\s+(.+?)$/i);

      if (!tableMatch) {
        throw new Error('Could not parse DELETE query');
      }

      const tableName = this.normalizeTableName(tableMatch[1]);
      let deleteQuery = supabase.from(tableName).delete();

      if (whereMatch && params.length > 0) {
        const [col, val] = whereMatch[1].split('=');
        const column = this.normalizeColumnName(col.trim());
        deleteQuery = deleteQuery.eq(column, params[0]);
      }

      const { error } = await deleteQuery;
      if (error) throw error;

      return [{ affectedRows: 1 }, []];
    } catch (error) {
      console.error('DELETE error:', error);
      throw error;
    }
  },

  async handleStoredProcedure(sql, params) {
    // Convert stored procedures to RPC calls
    const callMatch = sql.match(/CALL\s+([a-zA-Z_]+)\s*\((.*)\)/i);
    
    if (!callMatch) {
      console.error('Could not parse stored procedure:', sql);
      return [[], []];
    }

    const procName = callMatch[1];
    
    // Map stored procedures to actual implementations
    if (procName === 'generate_slots') {
      return await this.generateSlots(params);
    } else if (procName === 'book_appointment') {
      return await this.bookAppointment(params);
    }

    console.warn(`Stored procedure '${procName}' not implemented`);
    return [[], []];
  },

async generateSlots(params) {
    const { clinic_id, date, morning_start, morning_end, evening_start, evening_end, booked_duration = 20, walkin_duration = 15, walkin_to_booked_ratio = 3 } = params[0] || {};
    
    if (!clinic_id || !date) return [[{ message: 'clinic_id and date required' }], []];

    try {
      // Get clinic times
      const { data: clinic } = await supabase.from('clinic').select('morning_start, morning_end, evening_start, evening_end').eq('clinic_id', clinic_id).single();
      if (!clinic) return [[{ error: 'Clinic not found' }], []];

      // Build pattern
      const pattern = [];
      for (let i = 0; i < walkin_to_booked_ratio; i++) pattern.push('BOOKED');
      pattern.push('BUFFER');

      // Simple slot generation (20min slots)
      let token = 1;
      const slots = [];
      
      // Morning
      let currentTime = parseTime(morning_start || clinic.morning_start || '09:00');
      const morningEnd = parseTime(morning_end || clinic.morning_end || '13:00');
      while (currentTime < morningEnd) {
        const slotType = pattern[token % pattern.length];
        slots.push({
          clinic_id,
          slot_date: date,
          slot_start_time: formatTime(currentTime),
          slot_type: slotType,
          status: 'OPEN',
          token_number: token++
        });
        currentTime += slotType === 'BUFFER' ? walkin_duration : booked_duration;
      }

      // Evening if defined
      if (evening_start && evening_end) {
        currentTime = parseTime(evening_start);
        const eveningEnd = parseTime(evening_end);
        while (currentTime < eveningEnd) {
          const slotType = pattern[token % pattern.length];
          slots.push({
            clinic_id,
            slot_date: date,
            slot_start_time: formatTime(currentTime),
            slot_type: slotType,
            status: 'OPEN',
            token_number: token++
          });
          currentTime += slotType === 'BUFFER' ? walkin_duration : booked_duration;
        }
      }

      // Delete old slots
      await supabase.from('slot').delete().eq('clinic_id', clinic_id).eq('slot_date', date);
      
      // Insert new
      await supabase.from('slot').insert(slots);

      // Update availability
      await supabase.from('clinic_daily_availability').upsert({ clinic_id, available_date: date, is_available: true });

      return [slots, []];
    } catch (err) {
      return [[{ error: err.message }], []];
    }
  },

  async bookAppointment(params) {
    const [slot_id, patient_id, doctor_id, clinic_id] = params;
    if (!slot_id || !patient_id || !doctor_id || !clinic_id) return [[{ message: 'All params required' }], []];

    try {
      // Check slot available
      const { data: slot } = await supabase.from('slot').select('*').eq('slot_id', slot_id).eq('clinic_id', clinic_id).single();
      if (!slot || slot.status !== 'OPEN') return [[{ message: 'Slot not available' }], []];

      // Insert appointment
      const { data: appt } = await supabase.from('appointment').insert({
        slot_id,
        patient_id,
        doctor_id,
        clinic_id,
        status: 'SCHEDULED'
      }).select().single();

      // Update slot to BOOKED
      await supabase.from('slot').update({ status: 'BOOKED' }).eq('slot_id', slot_id);

      return [{ appointment_id: appt.appointment_id, message: 'SUCCESS' }, []];
    } catch (err) {
      return [[{ message: err.message }], []];
    }
  },

  // Helper functions
  parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },

  formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  },

  promise() {
    return this;
  },

  async getConnection() {
    return {
      release: () => {
        // No-op for compatibility
      }
    };
  }
};

// Test connection on startup
(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'Auth session missing') {
      console.error('Supabase connection error:', error.message);
    } else {
      console.log('✓ Supabase connected successfully');
    }
  } catch (err) {
    console.error('✗ Supabase connection failed:', err.message);
  }
})();

module.exports = db;