// Seed database with initial data
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database Connection
const dbConfig = process.env.MYSQLHOST 
  ? {
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE || 'railway'
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sumber_jaya_db'
    };

const db = mysql.createConnection(dbConfig);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    await db.promise().connect();
    console.log('✅ Connected to database');
    
    // Insert PT List
    console.log('📝 Inserting PT list...');
    await db.promise().query(`
      INSERT INTO pt_list (code, name) VALUES
      ('KSS', 'PT KHALISA SALMA SEJAHTERA'),
      ('SJE', 'PT SUMBER JAYA ELPIJI'),
      ('FAB', 'PT FADILLAH AMANAH BERSAMA'),
      ('KBS', 'PT KHABITSA INDOGAS'),
      ('SJS', 'PT SUMBER JAYA SEJAHTERA')
      ON DUPLICATE KEY UPDATE code=code
    `);
    console.log('✅ PT list inserted');
    
    // Insert Master User
    console.log('👤 Inserting master user...');
    const hashedPassword = await bcrypt.hash('hengky123', 10);
    await db.promise().query(`
      INSERT INTO users (username, password, name, role, status) 
      VALUES ('hengky', ?, 'Hengky Master User', 'Master User', 'aktif')
      ON DUPLICATE KEY UPDATE username=username
    `, [hashedPassword]);
    console.log('✅ Master user inserted');
    
    // Insert PT Access
    console.log('🔐 Inserting PT access...');
    await db.promise().query(`
      INSERT INTO pt_access (user_id, pt_code) 
      SELECT 1, code FROM pt_list
      ON DUPLICATE KEY UPDATE user_id=user_id
    `);
    console.log('✅ PT access inserted');
    
    // Insert Pangkalan
    console.log('🏪 Inserting pangkalan...');
    await db.promise().query(`
      INSERT INTO pangkalan (pt, nama) VALUES
      ('KSS', 'Pangkalan A'), ('KSS', 'Pangkalan B'),
      ('SJE', 'Pangkalan C'), ('FAB', 'Pangkalan D'),
      ('KBS', 'Pangkalan E'), ('SJS', 'Pangkalan F')
      ON DUPLICATE KEY UPDATE pt=pt
    `);
    console.log('✅ Pangkalan inserted');
    
    // Verify
    const [users] = await db.promise().query('SELECT id, username, name, role, status FROM users WHERE username = "hengky"');
    console.log('\n📊 Verification:');
    console.log(users);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Username: hengky');
    console.log('   Password: hengky123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    db.end();
    process.exit(0);
  }
}

seedDatabase();

