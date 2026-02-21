import express from 'express';
import pool from '../db/client.js';

const router = express.Router();

/**
 * GET /api/alerts
 * Get all alerts (active and acknowledged)
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM alerts 
       ORDER BY 
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('❌ Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE alerts 
       SET acknowledged = true, 
           acknowledged_at = CURRENT_TIMESTAMP,
           acknowledged_by = $1
       WHERE id = $2
       RETURNING *`,
      ['system', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('❌ Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;