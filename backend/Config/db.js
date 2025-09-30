const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false } // Render / Neon ต้องใช้ SSL
    : false,                        // Local ไม่ต้องใช้ SSL
});

const handleDbError = (err, res) => {
  console.error('Database error', err.stack);
  if (res) {
    res.status(500).send('Database operation failed');
  }
};

const ConnectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL database', err);
  }
};

module.exports = {
  handleDbError,
  ConnectDB,
  pool,
};