import pg from 'pg';

const { Pool } = pg;

// HARDCODED - Don't use environment variables at all
export const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'vertex',
  password: 'your_vertex_password',  // Replace with your actual password
  database: 'vertex_inventory',  // HARDCODED
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.error('✅ MCP connected to vertex_inventory');
});

pool.on('error', (err) => {
  console.error('❌ MCP database error:', err);
});

export default pool;