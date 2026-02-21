import pool from '../db/client.js';
import { Part, LowStockItem, ConsumptionSummary } from '../types/index.js';

export const inventoryTools = {
  /**
   * Get inventory levels for all parts or a specific part
   */
  get_inventory_levels: async (args: { part_number?: string }) => {
    try {
      let query = `
        SELECT 
          part_number,
          description,
          category,
          current_stock,
          reorder_point,
          unit_of_measure,
          location,
          is_critical,
          ROUND((current_stock / NULLIF(reorder_point, 0) * 100), 2) as stock_percentage,
          CASE 
            WHEN current_stock = 0 THEN 'OUT_OF_STOCK'
            WHEN current_stock <= (reorder_point * 0.5) THEN 'CRITICAL'
            WHEN current_stock <= reorder_point THEN 'LOW'
            ELSE 'ADEQUATE'
          END as stock_status
        FROM parts
      `;
      
      const params: any[] = [];
      
      if (args.part_number) {
        query += ' WHERE part_number = $1';
        params.push(args.part_number);
      }
      
      query += ' ORDER BY part_number';
      
      const result = await pool.query(query, params);
      
      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get detailed information about a specific part
   */
  get_part_details: async (args: { part_number: string }) => {
    try {
      const result = await pool.query(
        `SELECT * FROM parts WHERE part_number = $1`,
        [args.part_number]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: `Part ${args.part_number} not found`
        };
      }
      
      // Get recent transactions
      const transactions = await pool.query(
        `SELECT 
          transaction_type,
          quantity,
          balance_after,
          reference_number,
          created_at
        FROM inventory_transactions
        WHERE part_id = $1
        ORDER BY created_at DESC
        LIMIT 10`,
        [result.rows[0].id]
      );
      
      return {
        success: true,
        data: {
          part: result.rows[0],
          recent_transactions: transactions.rows
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Search parts by description or part number
   */
  search_parts: async (args: { query: string; category?: string }) => {
    try {
      let sql = `
        SELECT 
          part_number,
          description,
          category,
          current_stock,
          reorder_point,
          unit_of_measure,
          location
        FROM parts
        WHERE (
          part_number ILIKE $1 
          OR description ILIKE $1
        )
      `;
      
      const params: any[] = [`%${args.query}%`];
      
      if (args.category) {
        sql += ' AND category = $2';
        params.push(args.category);
      }
      
      sql += ' ORDER BY part_number LIMIT 20';
      
      const result = await pool.query(sql, params);
      
      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get all parts with stock below reorder point
   */
  get_low_stock_items: async (args: { threshold_percentage?: number }) => {
    try {
      const threshold = args.threshold_percentage || 100; // Default: at or below reorder point
      
      const result = await pool.query<LowStockItem>(
        `SELECT * FROM low_stock_items 
         WHERE stock_percentage <= $1
         ORDER BY stock_percentage ASC`,
        [threshold]
      );
      
      return {
        success: true,
        data: result.rows,
        count: result.rows.length,
        summary: {
          out_of_stock: result.rows.filter(r => r.stock_status === 'OUT_OF_STOCK').length,
          critical: result.rows.filter(r => r.stock_status === 'CRITICAL').length,
          low: result.rows.filter(r => r.stock_status === 'LOW').length,
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get consumption history and trends for a part
   */
  get_consumption_history: async (args: { part_number: string; days?: number }) => {
    try {
      const days = args.days || 90; // Default: last 90 days
      
      // Get part info
      const partResult = await pool.query(
        'SELECT * FROM parts WHERE part_number = $1',
        [args.part_number]
      );
      
      if (partResult.rows.length === 0) {
        return {
          success: false,
          error: `Part ${args.part_number} not found`
        };
      }
      
      const part = partResult.rows[0];
      
      // Get consumption data
      const consumptionResult = await pool.query(
        `SELECT 
          consumed_quantity,
          consumption_date,
          work_order,
          machine_id
        FROM consumption_history
        WHERE part_id = $1
          AND consumption_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY consumption_date DESC`,
        [part.id]
      );
      
      // Calculate statistics
      const totalConsumed = consumptionResult.rows.reduce(
        (sum, row) => sum + parseFloat(row.consumed_quantity), 
        0
      );
      
      const avgDailyConsumption = consumptionResult.rows.length > 0 
        ? totalConsumed / days 
        : 0;
      
      const avgWeeklyConsumption = avgDailyConsumption * 7;
      const avgMonthlyConsumption = avgDailyConsumption * 30;
      
      // Estimate days until stockout
      let estimatedDaysUntilStockout: number | undefined;
      if (avgDailyConsumption > 0) {
        estimatedDaysUntilStockout = Math.floor(part.current_stock / avgDailyConsumption);
      }
      
      const summary: ConsumptionSummary = {
        part_number: part.part_number,
        part_description: part.description,
        total_consumed: Math.round(totalConsumed * 100) / 100,
        avg_daily_consumption: Math.round(avgDailyConsumption * 100) / 100,
        avg_weekly_consumption: Math.round(avgWeeklyConsumption * 100) / 100,
        avg_monthly_consumption: Math.round(avgMonthlyConsumption * 100) / 100,
        days_analyzed: days,
        estimated_days_until_stockout: estimatedDaysUntilStockout
      };
      
      return {
        success: true,
        data: {
          part_info: {
            part_number: part.part_number,
            description: part.description,
            current_stock: part.current_stock,
            reorder_point: part.reorder_point,
            unit_of_measure: part.unit_of_measure
          },
          summary,
          consumption_records: consumptionResult.rows.slice(0, 30) // Return last 30 records
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update reorder point for a part
   */
  update_reorder_point: async (args: { part_number: string; new_reorder_point: number }) => {
    try {
      if (args.new_reorder_point < 0) {
        return {
          success: false,
          error: 'Reorder point must be a positive number'
        };
      }
      
      const result = await pool.query(
        `UPDATE parts 
         SET reorder_point = $1, updated_at = CURRENT_TIMESTAMP
         WHERE part_number = $2
         RETURNING *`,
        [args.new_reorder_point, args.part_number]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: `Part ${args.part_number} not found`
        };
      }
      
      return {
        success: true,
        data: result.rows[0],
        message: `Reorder point for ${args.part_number} updated to ${args.new_reorder_point}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};