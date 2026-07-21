require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sumber_jaya_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  
  db.query("DELETE FROM kas_kecil WHERE keterangan LIKE 'Sisa Saldo tanggal%'", (err, result) => {
    if (err) {
      console.error('Error deleting rows:', err);
    } else {
      console.log(`Deleted ${result.affectedRows} Sisa Saldo rows.`);
    }
    process.exit(0);
  });
});
