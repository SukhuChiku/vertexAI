import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  user: 'vertex',
  password: 'your_vertex_password',
  database: 'vertex_agent', //or inventory
});

async function test() {
  try {
    console.log('Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected!');
    
    const result = await client.query('SELECT current_user, current_database()');
    console.log('User:', result.rows[0].current_user);
    console.log('Database:', result.rows[0].current_database);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
  }
}

test();