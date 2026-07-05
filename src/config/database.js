import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,
});

// mysql2 pools emit background 'error' events for idle-connection failures
// (independent of any in-flight query promise). Without a listener, Node
// treats this as an uncaught exception and crashes the whole process.
pool.on('error', (err) => {
  console.error('MySQL pool error:', err.message);
});

export default pool;
