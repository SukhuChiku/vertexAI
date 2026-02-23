import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'vertex',
  password: process.env.DB_PASSWORD || 'your_vertex_password',
  database: process.env.DB_NAME || 'vertex_agent',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Agent Service: Connected to vertex_agent');
});

pool.on('error', (err) => {
  console.error('❌ Agent Service database error:', err);
});

export default pool;