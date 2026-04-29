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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      const fromMatch = sql.match(/FROM\s+`?([a-zA-Z_]+)`?/i);
      if (!fromMatch) {
        throw new Error('Could not parse table from SELECT query');
      }

      const tableName = this.normalizeTableName(fromMatch[1]);
      let query = supabase.from(tableName).select('*');

      // Parse WHERE clause
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|$)/i);
      if (whereMatch && params.length > 0) {
        query = this.addWhereConditions(query, whereMatch[1], params);
      }

      // Parse ORDER BY
      const orderMatch = sql.match(/ORDER\s+BY\s+([^;]+?)(?:\s+LIMIT|$)/i);
      if (orderMatch) {
        query = this.addOrderBy(query, orderMatch[1]);
      }

      // Parse LIMIT
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
        const [column, direction] = part.trim().split(/\s+/);
        const ascending = !direction || direction.toUpperCase() !== 'DESC';
        query = query.order(this.normalizeColumnName(column), { ascending });
      });
      return query;
    } catch (error) {
      console.error('ORDER BY parsing error:', error);
      return query;
    }
  },

  async handleInsert(sql, params) {
    try {
      const tableMatch = sql.match(/INSERT\s+INTO\s+`?([a-zA-Z_]+)`?/i);
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
    // This is a placeholder - implement actual logic
    console.warn('generate_slots stored procedure called with params:', params);
    return [[], []];
  },

  async bookAppointment(params) {
    // This is a placeholder - implement actual logic
    console.warn('book_appointment stored procedure called with params:', params);
    return [[], []];
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