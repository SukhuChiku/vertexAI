import pool from '../db/client';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from '../types/index.js';

export class MemoryService {
  /**
   * Get or create a conversation
   */
  async getOrCreateConversation(sessionId?: string, userId?: string): Promise<Conversation> {
    const client = await pool.connect();
    
    try {
      if (sessionId) {
        // Try to find existing conversation
        const result = await client.query<Conversation>(
          'SELECT * FROM conversations WHERE session_id = $1',
          [sessionId]
        );
        
        if (result.rows.length > 0) {
          // Update last activity
          await client.query(
            'UPDATE conversations SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
            [sessionId]
          );
          return result.rows[0];
        }
      }
      
      // Create new conversation
      const newSessionId = sessionId || uuidv4();
      const result = await client.query<Conversation>(
        `INSERT INTO conversations (session_id, user_id, is_active)
         VALUES ($1, $2, true)
         RETURNING *`,
        [newSessionId, userId]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Store a message in the conversation
   */
  async storeMessage(
    conversationId: number,
    role: 'user' | 'assistant' | 'system',
    content: string,
    toolCalls?: any
  ): Promise<Message> {
    const result = await pool.query<Message>(
      `INSERT INTO messages (conversation_id, role, content, tool_calls)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, role, content, toolCalls ? JSON.stringify(toolCalls) : null]
    );
    
    return result.rows[0];
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: number, limit: number = 20): Promise<Message[]> {
    const result = await pool.query<Message>(
      `SELECT * FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, limit]
    );
    
    // Return in chronological order (oldest first)
    return result.rows.reverse();
  }

  /**
   * Build context for Claude from conversation history
   */
  async buildClaudeContext(conversationId: number, maxMessages: number = 10): Promise<any[]> {
    const messages = await this.getConversationHistory(conversationId, maxMessages);
    
    return messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, // Claude doesn't support 'system' role in messages array
      content: msg.content
    }));
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(sessionId: string) {
    const result = await pool.query(
      `SELECT 
        c.*,
        COUNT(m.id) as message_count
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
       WHERE c.session_id = $1
       GROUP BY c.id`,
      [sessionId]
    );
    
    return result.rows[0];
  }
}

export const memoryService = new MemoryService();