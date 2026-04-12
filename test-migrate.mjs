import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);
try {
  const [rows] = await conn.query('SHOW TABLES');
  console.log('Tables:', rows.map(r => Object.values(r)[0]));
} finally {
  await conn.end();
}
