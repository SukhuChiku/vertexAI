import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  host: '127.0.0.1',  // Changed from localhost
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'vertex',
  password: process.env.DB_PASSWORD || 'your_vertex_password',
  database: process.env.DB_NAME || 'vertex_agent',
});
async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running agent database migration...');
    
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSQL);
    
    console.log(' Agent database schema created successfully!');
  } catch (error) {
    console.error(' Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();