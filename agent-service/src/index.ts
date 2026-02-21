import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import alertsRouter from './routes/alerts.js';
import { initializeMCPClient, closeMCPClient } from './mcp/client.js';
import pool from './db/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/alerts', alertsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'vertex-agent-service'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Vertex Agent Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chat: 'POST /api/chat'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Vertex Agent Service...');
    
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');
    
    // Initialize MCP client
    await initializeMCPClient();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeMCPClient();
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeMCPClient();
  await pool.end();
  process.exit(0);
});

startServer();