const supabase = require('./supabase');

// Utility class to handle Supabase queries with a familiar interface
class SupabaseDB {
  /**
   * Execute a SELECT query
   * @param {string} query - SQL query string
   * @param {array} params - Query parameters
   * @returns {Promise<[rows, fields]>} - Returns data in MySQL format for compatibility
   */
  async query(query, params = []) {
    try {
      // Convert MySQL query to Supabase query
      const { sql, values } = this.convertQuery(query, params);
      
      // Use raw SQL for complex queries through Supabase's rpc or direct query
      const { data, error } = await supabase.rpc('execute_sql', {
        query: sql,
        params: values
      }).catch(() => {
        // Fallback: parse and execute query directly
        return this.executeDirectQuery(sql, values);
      });

      if (error) throw error;
      return [data || [], []];
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  }

  /**
   * Convert MySQL query format to PostgreSQL format
   * Handles parameter conversion from ? placeholders to $1, $2, etc.
   */
  convertQuery(query, params) {
    let sql = query;
    let index = 1;
    
    // Replace ? with $1, $2, etc. for PostgreSQL
    sql = sql.replace(/\?/g, () => `$${index++}`);
    
    // Convert MySQL table/column names to snake_case if needed
    sql = this.normalizeTableNames(sql);
    
    return { sql, values: params };
  }

  /**
   * Normalize table and column names from CamelCase to snake_case
   */
  normalizeTableNames(sql) {
    const mappings = {
      'Patient': 'patient',
      'Doctor': 'doctor',
      'Clinic': 'clinic',
      'DoctorClinic': 'doctor_clinic',
      'Staff': 'staff',
      'Slot': 'slot',
      'ClinicDailyAvailability': 'clinic_daily_availability',
      'Appointment': 'appointment',
      'WalkIn': 'walk_in',
      'Consultation': 'consultation',
      'Prescription': 'prescription',
      'PrescriptionItem': 'prescription_item',
      'PatientConditions': 'patient_conditions',
      'Reminder': 'reminder',
      'InventoryCategory': 'inventory_category',
      'InventoryItem': 'inventory_item',
      'InventoryAlert': 'inventory_alert',
      'ReorderSuggestion': 'reorder_suggestion',
      'StockOrder': 'stock_order',
      'otp_verification': 'otp_verification'
    };

    let result = sql;
    for (const [from, to] of Object.entries(mappings)) {
      result = result.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
    }

    return result;
  }

  /**
   * Direct query execution for SELECT, INSERT, UPDATE, DELETE
   */
  async executeDirectQuery(sql, params) {
    try {
      // For SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return await this.selectQuery(sql, params);
      }
      // For INSERT queries
      else if (sql.trim().toUpperCase().startsWith('INSERT')) {
        return await this.insertQuery(sql, params);
      }
      // For UPDATE queries
      else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
        return await this.updateQuery(sql, params);
      }
      // For DELETE queries
      else if (sql.trim().toUpperCase().startsWith('DELETE')) {
        return await this.deleteQuery(sql, params);
      }
    } catch (error) {
      console.error('Direct query execution error:', error);
      throw error;
    }
  }

  /**
   * Parse a SELECT query and execute it
   */
  async selectQuery(query, params) {
    try {
      // Extract table name from query
      const tableMatch = query.match(/FROM\s+(\w+)/i);
      if (!tableMatch) throw new Error('Could not parse table name from query');
      
      const tableName = tableMatch[1];
      let dbQuery = supabase.from(tableName).select('*');

      // Add WHERE clause if present
      const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|GROUP|$)/i);
      if (whereMatch) {
        dbQuery = this.parseWhereClause(dbQuery, whereMatch[1], params);
      }

      // Add ORDER BY if present
      const orderMatch = query.match(/ORDER\s+BY\s+([^]]+?)(?:LIMIT|$)/i);
      if (orderMatch) {
        dbQuery = this.parseOrderBy(dbQuery, orderMatch[1]);
      }

      // Add LIMIT if present
      const limitMatch = query.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        dbQuery = dbQuery.limit(parseInt(limitMatch[1]));
      }

      const { data, error } = await dbQuery;
      if (error) throw error;
      return [data || [], []];
    } catch (error) {
      console.error('SELECT query error:', error);
      throw error;
    }
  }

  /**
   * Parse WHERE clause and add filters
   */
  parseWhereClause(query, whereClause, params) {
    // This is a simplified version - for complex WHERE clauses, 
    // you might need more sophisticated parsing
    const conditions = whereClause.split(/\s+AND\s+/i);
    
    conditions.forEach((condition, index) => {
      if (condition.includes('=')) {
        const [column, operator] = condition.split('=').map(s => s.trim());
        const value = params[index];
        query = query.eq(column, value);
      }
    });

    return query;
  }

  /**
   * Parse ORDER BY clause
   */
  parseOrderBy(query, orderClause) {
    const parts = orderClause.trim().split(',');
    parts.forEach(part => {
      const [column, direction] = part.trim().split(/\s+/);
      const ascending = !direction || direction.toUpperCase() !== 'DESC';
      query = query.order(column, { ascending });
    });
    return query;
  }

  /**
   * Insert data into a table
   */
  async insertQuery(query, params) {
    try {
      const tableMatch = query.match(/INSERT\s+INTO\s+(\w+)/i);
      const columnsMatch = query.match(/\(([^)]+)\)/);
      
      if (!tableMatch || !columnsMatch) throw new Error('Could not parse INSERT query');
      
      const tableName = tableMatch[1];
      const columns = columnsMatch[1].split(',').map(c => c.trim());
      
      const data = {};
      columns.forEach((column, index) => {
        data[column] = params[index];
      });

      const { data: insertedData, error } = await supabase
        .from(tableName)
        .insert([data])
        .select();

      if (error) throw error;
      
      // Return in MySQL format with insertId
      return [{
        insertId: insertedData?.[0]?.id || insertedData?.[0]?.['*_id'] || null
      }, []];
    } catch (error) {
      console.error('INSERT query error:', error);
      throw error;
    }
  }

  /**
   * Update data in a table
   */
  async updateQuery(query, params) {
    try {
      const tableMatch = query.match(/UPDATE\s+(\w+)/i);
      const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
      const whereMatch = query.match(/WHERE\s+(.+?)$/i);
      
      if (!tableMatch || !setMatch) throw new Error('Could not parse UPDATE query');
      
      const tableName = tableMatch[1];
      const updateData = {};
      
      // Parse SET clause
      const setConditions = setMatch[1].split(',');
      let paramIndex = 0;
      
      setConditions.forEach(condition => {
        const [column] = condition.split('=').map(s => s.trim());
        updateData[column] = params[paramIndex++];
      });

      // Parse WHERE clause
      let updateQuery = supabase.from(tableName).update(updateData);
      
      if (whereMatch) {
        const whereColumn = whereMatch[1].split('=')[0].trim();
        updateQuery = updateQuery.eq(whereColumn, params[paramIndex]);
      }

      const { error } = await updateQuery;
      if (error) throw error;

      return [{ affectedRows: 1 }, []];
    } catch (error) {
      console.error('UPDATE query error:', error);
      throw error;
    }
  }

  /**
   * Delete data from a table
   */
  async deleteQuery(query, params) {
    try {
      const tableMatch = query.match(/DELETE\s+FROM\s+(\w+)/i);
      const whereMatch = query.match(/WHERE\s+(.+?)$/i);
      
      if (!tableMatch) throw new Error('Could not parse DELETE query');
      
      const tableName = tableMatch[1];
      let deleteQuery = supabase.from(tableName);

      if (whereMatch) {
        const [column] = whereMatch[1].split('=').map(s => s.trim());
        deleteQuery = deleteQuery.eq(column, params[0]);
      }

      const { error } = await deleteQuery.delete();
      if (error) throw error;

      return [{ affectedRows: 1 }, []];
    } catch (error) {
      console.error('DELETE query error:', error);
      throw error;
    }
  }

  /**
   * Get connection (for compatibility)
   */
  async getConnection() {
    return {
      release: () => {}
    };
  }
}

module.exports = new SupabaseDB();
