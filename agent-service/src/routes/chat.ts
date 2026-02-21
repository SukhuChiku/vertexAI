import express from 'express';
import { agentService } from '../services/agent.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/chat
 * Send a message to the agent
 */
router.post('/', async (req, res) => {
  try {
    const { session_id, message, user_id } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    // Generate session_id if not provided
    const sessionId = session_id || uuidv4();
    
    console.log(`💬 Chat request - Session: ${sessionId.substring(0, 8)}...`);
    console.log(`   Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    
    // Process message with agent
    const reply = await agentService.processMessage(sessionId, message, user_id);
    
    console.log(`   ✅ Response generated (${reply.length} chars)`);
    
    res.json({
      success: true,
      data: {
        session_id: sessionId,
        message: reply
      }
    });
    
  } catch (error: any) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message'
    });
  }
});

export default router;