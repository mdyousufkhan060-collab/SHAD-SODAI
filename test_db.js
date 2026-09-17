
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
  const database = process.env.DB_DATABASE || process.env.MYSQL_DATABASE;
  const port = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);

  const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port
  });

  try {
    const [rows] = await pool.execute('SELECT * FROM products');
    console.log('Products:', JSON.stringify(rows, null, 2));
    
    const [sections] = await pool.execute('SELECT * FROM homepage_sections');
    console.log('Sections:', JSON.stringify(sections, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

test();
