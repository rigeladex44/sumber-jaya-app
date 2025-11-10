const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  // Production frontend URLs
  'https://sumber-jaya-app.vercel.app',
  'https://sje-grup.rigeel.id'
];

// If FRONTEND_URL environment variable is set, add it to allowed origins
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection Pool - Support Railway with Keep-Alive and Auto-Reconnect
let dbConfig;

// Parse DATABASE_URL or MYSQL_URL if provided (Railway format)
const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (connectionUrl) {
  try {
    // Handle both mysql:// and mysql2:// protocols
    const urlString = connectionUrl.replace('mysql://', 'mysql2://');
    const url = new URL(urlString);
    console.log('📡 Using connection URL for database');
    dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.substring(1), // Remove leading '/'
      charset: 'utf8mb4',
      timezone: '+07:00', // WIB (Western Indonesian Time)
      // Connection Pool Settings - Optimized for Railway
      connectionLimit: 5,            // Reduced for Railway free tier
      waitForConnections: true,      // Queue requests when all connections busy
      queueLimit: 0,                 // Unlimited queue
      // Timeout Settings - More aggressive for Railway
      connectTimeout: 30000,         // 30 seconds to establish connection
      acquireTimeout: 30000,         // 30 seconds to get connection from pool
      timeout: 60000,                // 60 seconds for query execution
      // Keep-Alive Settings (prevent idle disconnection)
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,      // Start keep-alive immediately
      // SSL/TLS Settings for Railway
      ssl: {
        rejectUnauthorized: false    // Required for Railway MySQL
      },
      // Multi-statement support
      multipleStatements: false,
      // Debugging
      debug: false
    };
  } catch (error) {
    console.error('❌ Error parsing connection URL:', error);
    console.log('⚠️ Falling back to individual environment variables');
  }
}

// Fall back to individual variables (Railway old format or local dev)
if (!dbConfig) {
  dbConfig = process.env.MYSQLHOST
    ? {
        host: process.env.MYSQLHOST,
        port: parseInt(process.env.MYSQLPORT) || 3306,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE || 'railway',
        charset: 'utf8mb4',
        timezone: '+07:00',
        connectionLimit: 5,
        waitForConnections: true,
        queueLimit: 0,
        connectTimeout: 30000,
        acquireTimeout: 30000,
        timeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        ssl: {
          rejectUnauthorized: false
        },
        multipleStatements: false,
        debug: false
      }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sumber_jaya_db',
        charset: 'utf8mb4',
        timezone: '+07:00',
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        multipleStatements: false
      };
}

// Log connection configuration (without sensitive data)
console.log('🔧 Database Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  ssl: !!dbConfig.ssl,
  connectionLimit: dbConfig.connectionLimit
});

// Create connection pool with promise wrapper
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();
const db = pool; // Keep pool for callback-style queries (backward compatibility)
db.promise = () => promisePool; // Add promise() method for async/await queries

// Wrapper function for safe query execution with retry logic
const safeQuery = async (sql, params) => {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError;

  while (retryCount <= maxRetries) {
    try {
      const [results] = await promisePool.query(sql, params);
      return results;
    } catch (error) {
      lastError = error;

      // Check if error is connection-related
      const isConnectionError =
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
        error.code === 'PROTOCOL_ENQUEUE_AFTER_QUIT' ||
        error.code === 'ER_QUERY_INTERRUPTED' ||
        error.fatal === true;

      // Retry connection errors
      if (isConnectionError && retryCount < maxRetries) {
        retryCount++;
        const delayMs = 1000 * retryCount; // Exponential backoff
        console.log(`⚠️ Connection error, retry ${retryCount}/${maxRetries} in ${delayMs}ms:`, error.code);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // Non-connection error or max retries reached
      throw error;
    }
  }

  throw lastError;
};

// Export safeQuery for use in routes
db.safeQuery = safeQuery;

// Pool event handlers for monitoring and auto-reconnect
// Note: Events are on the pool, not the promise wrapper
pool.on('connection', (connection) => {
  console.log('✅ New database connection established (ID:', connection.threadId, ')');

  // Set up connection-level error handling
  connection.on('error', (err) => {
    console.error('❌ Connection error on thread', connection.threadId, ':', err.code);
  });
});

pool.on('acquire', (connection) => {
  console.log('🔄 Connection %d acquired from pool', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('🔓 Connection %d released back to pool', connection.threadId);
});

pool.on('enqueue', () => {
  console.log('⏳ Waiting for available connection slot...');
});

// Test pool connectivity and initialize database
(async () => {
  let connection;
  try {
    connection = await promisePool.getConnection();
    console.log('✅ Database connection pool initialized successfully');
    console.log('📊 Pool config: Max connections =', dbConfig.connectionLimit);
    connection.release();

    // Auto-create feature_access table if not exists
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS feature_access (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        feature_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_feature (user_id, feature_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    try {
      await promisePool.query(createTableSQL);
      console.log('✅ feature_access table ready');

      // Insert default feature access for Master User (ID=1)
      const insertSQL = `
        INSERT IGNORE INTO feature_access (user_id, feature_id) VALUES
        (1, 'dashboard'),
        (1, 'beranda'),
        (1, 'kas-kecil'),
        (1, 'arus-kas'),
        (1, 'detail-kas'),
        (1, 'penjualan'),
        (1, 'laporan'),
        (1, 'master-admin');
      `;

      await promisePool.query(insertSQL);
      console.log('✅ Master User feature access configured');
    } catch (err) {
      console.error('⚠️ Error with feature_access table:', err.message);
    }

    // Auto-migration: Add kategori column to kas_kecil if not exists
    try {
      const checkKategoriColumn = `
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'kas_kecil'
        AND COLUMN_NAME = 'kategori'
      `;

      const [results] = await promisePool.query(checkKategoriColumn, [dbConfig.database]);

      if (results[0].count === 0) {
        console.log('🔄 Adding kategori column to kas_kecil table...');
        const addKategoriColumn = 'ALTER TABLE kas_kecil ADD COLUMN kategori VARCHAR(100) AFTER keterangan';
        await promisePool.query(addKategoriColumn);
        console.log('✅ Kategori column added to kas_kecil table');

        // Add index
        try {
          const addIndex = 'CREATE INDEX idx_kas_kecil_kategori ON kas_kecil(kategori)';
          await promisePool.query(addIndex);
          console.log('✅ Index added for kategori column');
        } catch (err) {
          console.log('⚠️ Index might already exist or error adding index');
        }
      } else {
        console.log('✅ Kategori column already exists in kas_kecil table');
      }
    } catch (err) {
      console.error('❌ Error checking kategori column:', err);
    }

    // Auto-migration: Create arus_kas table if not exists
    try {
      const createArusKasTable = `
        CREATE TABLE IF NOT EXISTS arus_kas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tanggal DATE NOT NULL,
          pt_code VARCHAR(10) NOT NULL,
          jenis ENUM('masuk', 'keluar') NOT NULL,
          jumlah DECIMAL(15,2) NOT NULL,
          keterangan TEXT,
          kategori VARCHAR(100),
          metode_bayar ENUM('cash', 'cashless') DEFAULT 'cashless',
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (pt_code) REFERENCES pt_list(code)
        )
      `;

      await promisePool.query(createArusKasTable);
      console.log('✅ Arus Kas table ready');
    } catch (err) {
      console.error('⚠️ Error creating arus_kas table:', err.message);
    }

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database pool connection failed:', err);
    console.error('⚠️ Will retry connections on demand...');
  }
})();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'sumber_jaya_secret_key_2025';

// Middleware: Verify Token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'Token tidak ditemukan' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Helper function to get local date in YYYY-MM-DD format (timezone-aware)
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to convert Date object to local YYYY-MM-DD (no timezone conversion)
const formatLocalDate = (date) => {
  if (!date) return null;

  // If already a string, just extract the date part
  if (typeof date === 'string') return date.split('T')[0];

  // If Date object, use UTC methods to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to process tanggal (remove timezone info)
const processTanggal = (tanggal) => {
  if (!tanggal) return null;
  return tanggal.split('T')[0]; // Remove any timezone info
};

// Helper function to auto-sync Sisa Saldo from a specific date (SMART UPDATE)
// This function UPDATE existing Sisa Saldo instead of DELETE+INSERT
// to preserve manual edits and prevent data loss
const autoRecalculateSisaSaldoFromDate = (startDate, userId, callback) => {
  console.log(`🔄 Smart auto-sync Sisa Saldo from: ${startDate}`);

  // Get all dates from startDate+1 to today that need syncing
  const nextDay = new Date(startDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = formatLocalDate(nextDay);

  const today = getLocalDate();
  const dates = [];
  let currentDate = new Date(nextDayStr);
  const todayDate = new Date(today);

  while (currentDate <= todayDate) {
    dates.push(formatLocalDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (dates.length === 0) {
    console.log('✅ No dates to process');
    return callback(null, { message: 'No dates to process', datesProcessed: 0 });
  }

  console.log(`📅 Processing ${dates.length} dates from ${nextDayStr} to ${today}`);

  let updatedCount = 0;
  let insertedCount = 0;

  // Process each date sequentially
  const processDate = (dateIndex) => {
    if (dateIndex >= dates.length) {
      console.log(`✅ Smart sync complete! Updated: ${updatedCount}, Inserted: ${insertedCount}`);
      return callback(null, {
        message: 'Smart sync complete',
        datesProcessed: dates.length,
        updated: updatedCount,
        inserted: insertedCount
      });
    }

    const currentDateStr = dates[dateIndex];
    const yesterday = new Date(currentDateStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);

    // Calculate closing balance for yesterday per PT (ONLY yesterday's transactions)
    const saldoQuery = `
      SELECT pt_code,
        SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) -
        SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as saldo_akhir
      FROM kas_kecil
      WHERE tanggal = ?
      GROUP BY pt_code
      HAVING saldo_akhir > 0
    `;

    db.query(saldoQuery, [yesterdayStr], (err, saldoResults) => {
      if (err) {
        console.error(`❌ Error calculating saldo for ${yesterdayStr}:`, err);
        return callback(err);
      }

      if (saldoResults.length === 0) {
        // No saldo to transfer, continue to next date
        processDate(dateIndex + 1);
        return;
      }

      // For each PT, UPDATE existing or INSERT new "Sisa Saldo"
      const upsertPromises = saldoResults.map(pt => {
        return new Promise((resolve, reject) => {
          const keterangan = `Sisa Saldo tanggal ${yesterdayStr}`;

          // Check if Sisa Saldo already exists for this date & PT
          const checkQuery = `
            SELECT id, jumlah
            FROM kas_kecil
            WHERE tanggal = ?
            AND pt_code = ?
            AND keterangan = ?
          `;

          db.query(checkQuery, [currentDateStr, pt.pt_code, keterangan], (err, existing) => {
            if (err) return reject(err);

            if (existing.length > 0) {
              // ALREADY EXISTS - UPDATE jumlah only
              const oldJumlah = existing[0].jumlah;

              if (parseFloat(oldJumlah) !== parseFloat(pt.saldo_akhir)) {
                const updateQuery = `
                  UPDATE kas_kecil
                  SET jumlah = ?, updated_at = NOW()
                  WHERE id = ?
                `;

                db.query(updateQuery, [pt.saldo_akhir, existing[0].id], (err) => {
                  if (err) return reject(err);
                  console.log(`  📝 Updated: ${currentDateStr} ${pt.pt_code} from ${oldJumlah} to ${pt.saldo_akhir}`);
                  updatedCount++;
                  resolve({ action: 'updated', pt: pt.pt_code, date: currentDateStr });
                });
              } else {
                // Already correct, skip
                resolve({ action: 'skipped', pt: pt.pt_code, date: currentDateStr });
              }
            } else {
              // DOESN'T EXIST - INSERT new
              const insertQuery = `
                INSERT INTO kas_kecil
                (tanggal, pt_code, jenis, jumlah, keterangan, status, created_by, approved_by)
                VALUES (?, ?, 'masuk', ?, ?, 'approved', ?, ?)
              `;

              db.query(
                insertQuery,
                [currentDateStr, pt.pt_code, pt.saldo_akhir, keterangan, userId, userId],
                (err, result) => {
                  if (err) return reject(err);
                  console.log(`  ➕ Inserted: ${currentDateStr} ${pt.pt_code} = ${pt.saldo_akhir}`);
                  insertedCount++;
                  resolve({ action: 'inserted', pt: pt.pt_code, date: currentDateStr });
                }
              );
            }
          });
        });
      });

      Promise.all(upsertPromises)
        .then(() => {
          // Continue to next date
          processDate(dateIndex + 1);
        })
        .catch(err => {
          console.error(`❌ Error syncing Sisa Saldo for ${currentDateStr}:`, err);
          callback(err);
        });
    });
  };

  // Start processing from first date
  processDate(0);
};

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    
    const user = results[0];
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    
    // Get PT Access
    const accessQuery = 'SELECT pt_code FROM pt_access WHERE user_id = ?';
    db.query(accessQuery, [user.id], (err, accessResults) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
      const accessPT = accessResults.map(row => row.pt_code);
      
      // Get Feature Access
      const featureQuery = 'SELECT feature_id FROM feature_access WHERE user_id = ?';
      db.query(featureQuery, [user.id], (err, featureResults) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }
        
        const fiturAkses = featureResults.map(row => row.feature_id);
      
      // Create token
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
            accessPT,
            fiturAkses
        }
        });
      });
    });
  });
});

// Get User Profile
app.get('/api/auth/profile', verifyToken, (req, res) => {
  const query = 'SELECT id, username, name, role FROM users WHERE id = ?';
  db.query(query, [req.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    const user = results[0];
    
    // Get PT Access
    const accessQuery = 'SELECT pt_code FROM pt_access WHERE user_id = ?';
    db.query(accessQuery, [user.id], (err, accessResults) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
      const accessPT = accessResults.map(row => row.pt_code);
      
      res.json({
        ...user,
        accessPT
      });
    });
  });
});

// ==================== PT ROUTES ====================

// Get All PT
app.get('/api/pt', verifyToken, (req, res) => {
  const query = 'SELECT * FROM pt_list ORDER BY code';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    res.json(results);
  });
});

// ==================== KAS KECIL ROUTES ====================

// Get Kas Kecil (Cash Only)
app.get('/api/kas-kecil', verifyToken, (req, res) => {
  const { pt, tanggal_dari, tanggal_sampai, status } = req.query;

  let query = `
    SELECT
      kk.id, kk.tanggal, kk.pt_code AS pt, kk.jenis, kk.jumlah, kk.keterangan,
      kk.kategori, kk.status, kk.created_by, kk.approved_by, kk.created_at, kk.updated_at,
      kk.sub_kategori_id,
      sk.nama AS sub_kategori_nama,
      sk.jenis AS sub_kategori_jenis
    FROM kas_kecil kk
    LEFT JOIN sub_kategori sk ON kk.sub_kategori_id = sk.id
    WHERE 1=1
  `;
  let params = [];

  if (pt) {
    query += ' AND kk.pt_code = ?';
    params.push(pt);
  }

  if (tanggal_dari) {
    query += ' AND kk.tanggal >= ?';
    params.push(tanggal_dari);
  }

  if (tanggal_sampai) {
    query += ' AND kk.tanggal <= ?';
    params.push(tanggal_sampai);
  }

  if (status) {
    query += ' AND kk.status = ?';
    params.push(status);
  }

  query += ' ORDER BY kk.tanggal DESC, CASE WHEN kk.keterangan LIKE \'Sisa Saldo%\' THEN 0 ELSE 1 END ASC, kk.id ASC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    // Convert jumlah string to number for correct calculations
    const formattedResults = results.map(item => ({
      ...item,
      jumlah: parseFloat(item.jumlah)
    }));
    
    console.log('DEBUG Backend Kas Kecil Load:', {
      resultCount: formattedResults.length,
      sampleData: formattedResults.slice(0, 2).map(item => ({
        id: item.id,
        tanggal: item.tanggal,
        tanggalType: typeof item.tanggal,
        pt: item.pt,
        keterangan: item.keterangan
      })),
      localDate: new Date().toISOString().split('T')[0]
    });
    
    res.json(formattedResults);
  });
});

// Create Kas Kecil (Cash Only)
app.post('/api/kas-kecil', verifyToken, (req, res) => {
  const { tanggal, pt, jenis, jumlah, keterangan, kategori } = req.body;
  
  console.log('DEBUG Backend Kas Kecil Save:', {
    tanggal: tanggal,
    tanggalType: typeof tanggal,
    localDate: new Date().toISOString().split('T')[0],
    timezone: 'Asia/Jakarta (UTC+7)'
  });
  
  // Force tanggal to be treated as local date (no timezone conversion)
  const localTanggal = processTanggal(tanggal);
  
  console.log('DEBUG Processed Tanggal:', {
    original: tanggal,
    processed: localTanggal
  });
  
  // Logic approve/reject:
  // - Semua PEMASUKAN (masuk): Langsung approved
  // - PENGELUARAN (keluar) < 300k: Auto approved  
  // - PENGELUARAN (keluar) >= 300k: Butuh approval (pending)
  let status = 'approved';
  let approved_by = req.userId;
  
  if (jenis === 'keluar' && parseFloat(jumlah) >= 300000) {
    status = 'pending';
    approved_by = null;
  }
  
  const query = 'INSERT INTO kas_kecil (tanggal, pt_code, jenis, jumlah, keterangan, kategori, status, created_by, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(query, [localTanggal, pt, jenis, jumlah, keterangan, kategori || null, status, req.userId, approved_by], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }

    // Smart auto-sync - UPDATE existing Sisa Saldo (preserves manual edits)
    autoRecalculateSisaSaldoFromDate(localTanggal, req.userId, (syncErr, syncResult) => {
      if (syncErr) {
        console.error('⚠️ Auto-sync error (non-critical):', syncErr);
      } else {
        console.log('✅ Auto-sync completed:', syncResult);
      }
    });

    res.status(201).json({
      message: 'Kas kecil berhasil ditambahkan',
      id: result.insertId,
      status
    });
  });
});

// Delete all transactions for a specific month
app.post('/api/kas-kecil/delete-month', verifyToken, (req, res) => {
  const { yearMonth } = req.body; // Format: YYYY-MM

  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return res.status(400).json({ message: 'yearMonth is required (format: YYYY-MM)' });
  }

  console.log('🗑️ Deleting all transactions for month:', yearMonth);

  // Delete all transactions in the specified month
  const deleteQuery = `
    DELETE FROM kas_kecil
    WHERE DATE_FORMAT(tanggal, '%Y-%m') = ?
  `;

  db.query(deleteQuery, [yearMonth], (err, deleteResult) => {
    if (err) {
      console.error('❌ Error deleting transactions:', err);
      return res.status(500).json({ message: 'Server error deleting transactions', error: err });
    }

    console.log(`✅ Deleted ${deleteResult.affectedRows} transactions from ${yearMonth}`);

    return res.json({
      message: `Successfully deleted all transactions from ${yearMonth}`,
      deletedCount: deleteResult.affectedRows
    });
  });
});

// Delete only "Sisa Saldo" entries from a specific date onwards
app.post('/api/kas-kecil/delete-sisa-saldo', verifyToken, (req, res) => {
  const { startDate } = req.body; // Format: YYYY-MM-DD

  if (!startDate) {
    return res.status(400).json({ message: 'startDate is required (format: YYYY-MM-DD)' });
  }

  console.log('🗑️ Deleting Sisa Saldo entries from:', startDate);

  // Delete all "Sisa Saldo" transactions from startDate onwards
  const deleteQuery = `
    DELETE FROM kas_kecil
    WHERE tanggal >= ?
    AND keterangan LIKE 'Sisa Saldo tanggal%'
  `;

  db.query(deleteQuery, [startDate], (err, deleteResult) => {
    if (err) {
      console.error('❌ Error deleting Sisa Saldo:', err);
      return res.status(500).json({ message: 'Server error deleting Sisa Saldo', error: err });
    }

    console.log(`✅ Deleted ${deleteResult.affectedRows} Sisa Saldo entries from ${startDate}`);

    return res.json({
      message: `Successfully deleted Sisa Saldo entries from ${startDate}`,
      deletedCount: deleteResult.affectedRows
    });
  });
});

// Recalculate Saldo Run from specific date
app.post('/api/kas-kecil/recalculate-saldo', verifyToken, (req, res) => {
  const { startDate, skipFirstDate } = req.body; // Format: YYYY-MM-DD

  if (!startDate) {
    return res.status(400).json({ message: 'startDate is required (format: YYYY-MM-DD)' });
  }

  console.log('🔄 Recalculating Saldo Run from:', startDate, skipFirstDate ? '(skipping first date)' : '');

  // Step 1: Delete all "Sisa Saldo" transactions from startDate onwards
  const deleteQuery = `
    DELETE FROM kas_kecil
    WHERE tanggal >= ?
    AND keterangan LIKE 'Sisa Saldo tanggal%'
  `;

  db.query(deleteQuery, [startDate], (err, deleteResult) => {
    if (err) {
      console.error('❌ Error deleting old Sisa Saldo transactions:', err);
      return res.status(500).json({ message: 'Server error deleting old transactions', error: err });
    }

    console.log(`✅ Deleted ${deleteResult.affectedRows} old Sisa Saldo transactions`);

    // Step 2: Get all dates from startDate to today
    const today = getLocalDate();
    const dates = [];
    let currentDate = new Date(startDate);
    const todayDate = new Date(today);

    while (currentDate <= todayDate) {
      dates.push(formatLocalDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`📅 Processing ${dates.length} dates from ${startDate} to ${today}`);

    // Step 3: For each date, calculate closing balance from previous date and create "Sisa Saldo"
    const processDate = (dateIndex) => {
      if (dateIndex >= dates.length) {
        // All dates processed
        console.log('✅ Recalculation complete!');
        return res.json({
          message: 'Saldo Run successfully recalculated',
          startDate: startDate,
          endDate: today,
          datesProcessed: dates.length,
          deletedTransactions: deleteResult.affectedRows
        });
      }

      const currentDateStr = dates[dateIndex];

      // Skip first date if requested (for manual input)
      if (skipFirstDate && dateIndex === 0) {
        console.log(`⏭️ Skipping first date ${currentDateStr} (manual input)`);
        processDate(dateIndex + 1);
        return;
      }

      const yesterday = new Date(currentDateStr);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatLocalDate(yesterday);

      console.log(`🔄 Processing date: ${currentDateStr}, yesterday: ${yesterdayStr}`);

      // Calculate closing balance for yesterday per PT
      const saldoQuery = `
        SELECT pt_code,
          SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) -
          SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as saldo_akhir
        FROM kas_kecil
        WHERE tanggal <= ?
        AND keterangan NOT LIKE 'Sisa Saldo tanggal%'
        GROUP BY pt_code
        HAVING saldo_akhir > 0
      `;

      db.query(saldoQuery, [yesterdayStr], (err, saldoResults) => {
        if (err) {
          console.error(`❌ Error calculating saldo for ${yesterdayStr}:`, err);
          return res.status(500).json({ message: 'Server error calculating saldo', error: err });
        }

        if (saldoResults.length === 0) {
          console.log(`⚠️ No saldo to transfer for ${currentDateStr}`);
          // Continue to next date
          processDate(dateIndex + 1);
          return;
        }

        // Create "Sisa Saldo" transactions for each PT
        const insertPromises = saldoResults.map(pt => {
          return new Promise((resolve, reject) => {
            const keterangan = `Sisa Saldo tanggal ${yesterdayStr}`;
            const insertQuery = `
              INSERT INTO kas_kecil
              (tanggal, pt_code, jenis, jumlah, keterangan, status, created_by, approved_by)
              VALUES (?, ?, 'masuk', ?, ?, 'approved', ?, ?)
            `;

            db.query(
              insertQuery,
              [currentDateStr, pt.pt_code, pt.saldo_akhir, keterangan, req.userId, req.userId],
              (err, result) => {
                if (err) reject(err);
                else resolve({ pt: pt.pt_code, saldo: pt.saldo_akhir, date: currentDateStr });
              }
            );
          });
        });

        Promise.all(insertPromises)
          .then(results => {
            console.log(`✅ Created ${results.length} Sisa Saldo transactions for ${currentDateStr}`);
            // Continue to next date
            processDate(dateIndex + 1);
          })
          .catch(err => {
            console.error(`❌ Error creating Sisa Saldo for ${currentDateStr}:`, err);
            res.status(500).json({ message: 'Error creating Sisa Saldo transactions', error: err });
          });
      });
    };

    // Start processing from first date
    processDate(0);
  });
});

// Auto Transfer Saldo Kemarin
app.post('/api/kas-kecil/transfer-saldo', verifyToken, (req, res) => {
  const today = getLocalDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);
  
  // Step 1: Check apakah hari ini sudah ada transfer saldo
  const checkQuery = `
    SELECT COUNT(*) as count 
    FROM kas_kecil 
    WHERE tanggal = ? 
    AND keterangan LIKE 'Sisa Saldo tanggal%'
  `;
  
  db.query(checkQuery, [today], (err, checkResults) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (checkResults[0].count > 0) {
      return res.json({ 
        message: 'Saldo hari ini sudah ditransfer',
        transferred: false 
      });
    }
    
    // Step 2: Hitung saldo akhir kemarin per PT
    const saldoQuery = `
      SELECT pt_code,
        SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) -
        SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as saldo_akhir
      FROM kas_kecil
      WHERE tanggal = ?
      GROUP BY pt_code
      HAVING saldo_akhir > 0
    `;
    
    db.query(saldoQuery, [yesterdayStr], (err, saldoResults) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
      if (saldoResults.length === 0) {
        return res.json({ 
          message: 'Tidak ada saldo untuk ditransfer',
          transferred: false 
        });
      }
      
      // Step 3: Create transaksi transfer saldo untuk setiap PT
      const insertPromises = saldoResults.map(pt => {
        return new Promise((resolve, reject) => {
          const keterangan = `Sisa Saldo tanggal ${yesterdayStr}`;
          const insertQuery = `
            INSERT INTO kas_kecil 
            (tanggal, pt_code, jenis, jumlah, keterangan, status, created_by, approved_by) 
            VALUES (?, ?, 'masuk', ?, ?, 'approved', ?, ?)
          `;
          
          db.query(
            insertQuery, 
            [today, pt.pt_code, pt.saldo_akhir, keterangan, req.userId, req.userId],
            (err, result) => {
              if (err) reject(err);
              else resolve({ pt: pt.pt_code, saldo: pt.saldo_akhir });
            }
          );
        });
      });
      
      Promise.all(insertPromises)
        .then(results => {
          res.json({
            message: 'Saldo berhasil ditransfer',
            transferred: true,
            count: results.length,
            details: results
          });
        })
        .catch(err => {
          res.status(500).json({ message: 'Error saat transfer saldo', error: err });
        });
    });
  });
});

// Approve/Reject Kas Kecil
app.patch('/api/kas-kecil/:id/status', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  
  // Step 1: Get kas data to check PT and tanggal
  const getKasQuery = 'SELECT pt_code AS pt, DATE_FORMAT(tanggal, "%Y-%m-%d") as tanggal FROM kas_kecil WHERE id = ?';

  db.query(getKasQuery, [id], (err, kasResults) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }

    if (kasResults.length === 0) {
      return res.status(404).json({ message: 'Data kas tidak ditemukan' });
    }

    const kasPT = kasResults[0].pt;
    const kasTanggal = kasResults[0].tanggal;
    
    // Step 2: Get user data and check access
    const getUserQuery = `
      SELECT u.role,
        GROUP_CONCAT(DISTINCT fa.feature_id) as fitur_akses,
        GROUP_CONCAT(DISTINCT pa.pt_code) as access_pts
      FROM users u
      LEFT JOIN feature_access fa ON u.id = fa.user_id
      LEFT JOIN pt_access pa ON u.id = pa.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    db.query(getUserQuery, [req.userId], (err, userResults) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }
      
      const user = userResults[0];
      const userRole = user.role;
      const userAccessPT = user.access_pts ? user.access_pts.split(',') : [];
      const userFiturAkses = user.fitur_akses ? user.fitur_akses.split(',') : [];
      
      // Step 3: Validation
      // Check if user has 'detail-kas' feature access (unless Master User)
      if (userRole !== 'Master User' && !userFiturAkses.includes('detail-kas')) {
        return res.status(403).json({ message: 'Anda tidak memiliki akses fitur Detail Kas Kecil' });
      }
      
      // Check if user has access to this PT (unless Master User)
      if (userRole !== 'Master User' && !userAccessPT.includes(kasPT)) {
        return res.status(403).json({ message: `Anda tidak memiliki akses ke PT ${kasPT}` });
      }
      
      // Step 4: Update status if all validations pass
      const updateQuery = 'UPDATE kas_kecil SET status = ?, approved_by = ? WHERE id = ?';

      db.query(updateQuery, [status, req.userId, id], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }

        // Smart auto-sync - UPDATE existing Sisa Saldo (preserves manual edits)
        autoRecalculateSisaSaldoFromDate(kasTanggal, req.userId, (syncErr, syncResult) => {
          if (syncErr) {
            console.error('⚠️ Auto-sync error (non-critical):', syncErr);
          } else {
            console.log('✅ Auto-sync completed:', syncResult);
          }
        });

        res.json({
          message: 'Status berhasil diupdate',
          status: status,
          pt: kasPT
        });
      });
    });
  });
});

// Update Kas Kecil (hanya untuk transaksi hari ini, Cash Only)
app.put('/api/kas-kecil/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { tanggal, pt, jenis, jumlah, keterangan, kategori } = req.body;
  const today = getLocalDate();
  
  // Step 1: Get existing kas data
  const getKasQuery = 'SELECT DATE_FORMAT(tanggal, "%Y-%m-%d") as tanggal, created_by FROM kas_kecil WHERE id = ?';
  
  db.query(getKasQuery, [id], (err, kasResults) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (kasResults.length === 0) {
      return res.status(404).json({ message: 'Data kas tidak ditemukan' });
    }
    
    const kasData = kasResults[0];
    const kasTanggal = formatLocalDate(kasData.tanggal);
    
    // Step 2: Validasi - hanya bisa edit transaksi hari ini
    if (kasTanggal !== today) {
      return res.status(403).json({ 
        message: 'Hanya bisa mengedit transaksi hari ini',
        kasDate: kasTanggal,
        today: today
      });
    }
    
    // Step 3: Validasi - hanya creator yang bisa edit
    if (kasData.created_by !== req.userId) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk mengedit transaksi ini' });
    }
    
    // Step 4: Update transaksi
    // Re-calculate status based on new jenis and jumlah
    let status = 'approved';
    let approved_by = req.userId;
    
    if (jenis === 'keluar' && parseFloat(jumlah) >= 300000) {
      status = 'pending';
      approved_by = null;
    }
    
    // Force tanggal to be treated as local date (no timezone conversion)
    const localTanggal = processTanggal(tanggal);
    
    const updateQuery = `
      UPDATE kas_kecil 
      SET tanggal = ?, pt_code = ?, jenis = ?, jumlah = ?, keterangan = ?, kategori = ?, status = ?, approved_by = ?
      WHERE id = ?
    `;
    
    db.query(updateQuery, [localTanggal, pt, jenis, jumlah, keterangan, kategori || null, status, approved_by, id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }

      // Smart auto-sync - UPDATE existing Sisa Saldo (preserves manual edits)
      const oldDate = new Date(kasTanggal);
      const newDate = new Date(localTanggal);
      const earlierDate = oldDate < newDate ? kasTanggal : localTanggal;

      autoRecalculateSisaSaldoFromDate(earlierDate, req.userId, (syncErr, syncResult) => {
        if (syncErr) {
          console.error('⚠️ Auto-sync error (non-critical):', syncErr);
        } else {
          console.log('✅ Auto-sync completed:', syncResult);
        }
      });

      res.json({
        message: 'Data kas berhasil diupdate',
        status: status
      });
    });
  });
});

// Delete Kas Kecil (hanya untuk transaksi hari ini)
app.delete('/api/kas-kecil/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const today = getLocalDate();

  console.log('🗑️ DELETE REQUEST:', { kasId: id, today: today, userId: req.userId });

  // Step 1: Get existing kas data
  const getKasQuery = 'SELECT DATE_FORMAT(tanggal, "%Y-%m-%d") as tanggal, created_by, created_at FROM kas_kecil WHERE id = ?';
  
  db.query(getKasQuery, [id], (err, kasResults) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (kasResults.length === 0) {
      return res.status(404).json({ message: 'Data kas tidak ditemukan' });
    }
    
    const kasData = kasResults[0];
    const kasTanggal = formatLocalDate(kasData.tanggal);

    console.log('🔍 DELETE VALIDATION DEBUG:', {
      kasId: id,
      kasTanggal: kasTanggal,
      today: today,
      match: kasTanggal === today,
      rawTanggal: kasData.tanggal
    });

    // Step 2: Validasi - hanya bisa hapus transaksi hari ini
    if (kasTanggal !== today) {
      console.log('❌ DELETE REJECTED: Date mismatch');
      return res.status(403).json({
        message: 'Hanya bisa menghapus transaksi hari ini',
        kasDate: kasTanggal,
        today: today
      });
    }

    console.log('✅ DELETE VALIDATION PASSED: Date matches');
    
    // Step 3: Validasi - hanya creator atau Master User yang bisa delete
    if (kasData.created_by !== req.userId) {
      // Check if user is Master User
      const checkUserQuery = 'SELECT role FROM users WHERE id = ?';
      db.query(checkUserQuery, [req.userId], (err, userResults) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }
        
        if (userResults.length === 0 || userResults[0].role !== 'Master User') {
          return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus transaksi ini' });
        }
        
        // Master User can delete
        deleteTransaction();
      });
    } else {
      // Creator can delete
      deleteTransaction();
    }
    
    function deleteTransaction() {
      const deleteQuery = 'DELETE FROM kas_kecil WHERE id = ?';

      db.query(deleteQuery, [id], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }

        // Smart auto-sync - UPDATE existing Sisa Saldo (preserves manual edits)
        autoRecalculateSisaSaldoFromDate(kasTanggal, req.userId, (syncErr, syncResult) => {
          if (syncErr) {
            console.error('⚠️ Auto-sync error (non-critical):', syncErr);
          } else {
            console.log('✅ Auto-sync completed:', syncResult);
          }
        });

        res.json({
          message: 'Data kas berhasil dihapus'
        });
      });
    }
  });
});

// Get Saldo Kas
app.get('/api/kas-kecil/saldo', verifyToken, (req, res) => {
  const { pt } = req.query;
  
  let query = `
    SELECT
      SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) as total_masuk,
      SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as total_keluar
    FROM kas_kecil
    WHERE keterangan NOT LIKE 'Sisa Saldo tanggal%'
  `;
  
  let params = [];
  
  if (pt) {
    query += ' AND pt_code = ?';
    params.push(pt);
  }
  
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    const masuk = parseFloat(results[0].total_masuk) || 0;
    const keluar = parseFloat(results[0].total_keluar) || 0;
    const saldo = masuk - keluar;
    
    res.json({ masuk, keluar, saldo });
  });
});


// ==================== ARUS KAS ROUTES ====================

// Get Arus Kas (Manual Cash Flow - No Approval)
app.get('/api/arus-kas', verifyToken, (req, res) => {
  const { pt, tanggal_dari, tanggal_sampai } = req.query;

  let query = `
    SELECT
      ak.id, ak.tanggal, ak.pt_code AS pt, ak.jenis, ak.jumlah, ak.keterangan,
      ak.kategori, ak.metode_bayar, ak.created_by, ak.created_at, ak.updated_at,
      ak.sub_kategori_id,
      sk.nama AS sub_kategori_nama,
      sk.jenis AS sub_kategori_jenis
    FROM arus_kas ak
    LEFT JOIN sub_kategori sk ON ak.sub_kategori_id = sk.id
    WHERE 1=1
  `;
  let params = [];

  if (pt) {
    query += ' AND ak.pt_code = ?';
    params.push(pt);
  }

  if (tanggal_dari) {
    query += ' AND ak.tanggal >= ?';
    params.push(tanggal_dari);
  }

  if (tanggal_sampai) {
    query += ' AND ak.tanggal <= ?';
    params.push(tanggal_sampai);
  }

  query += ' ORDER BY ak.tanggal DESC, ak.id DESC';

  console.log('DEBUG Arus Kas Query:', { query, params });

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ ERROR loading arus kas:', {
        error: err.message,
        code: err.code,
        sqlState: err.sqlState,
        sql: err.sql,
        query: query,
        params: params
      });
      return res.status(500).json({
        message: 'Server error loading arus kas',
        error: err.message,
        code: err.code
      });
    }

    // Convert jumlah string to number for correct calculations
    const formattedResults = results.map(item => ({
      ...item,
      jumlah: parseFloat(item.jumlah)
    }));

    console.log('✅ DEBUG Backend Arus Kas Load:', {
      resultCount: formattedResults.length,
      sampleData: formattedResults.slice(0, 2).map(item => ({
        id: item.id,
        tanggal: item.tanggal,
        pt: item.pt,
        kategori: item.kategori,
        metode_bayar: item.metode_bayar
      }))
    });

    res.json(formattedResults);
  });
});

// Create Arus Kas (No Approval Needed)
app.post('/api/arus-kas', verifyToken, (req, res) => {
  const { tanggal, pt, jenis, jumlah, keterangan, subKategoriId, metodeBayar } = req.body;

  console.log('DEBUG Backend Arus Kas Save:', {
    tanggal: tanggal,
    pt: pt,
    jenis: jenis,
    subKategoriId: subKategoriId,
    metodeBayar: metodeBayar
  });

  // Force tanggal to be treated as local date (no timezone conversion)
  const localTanggal = processTanggal(tanggal);

  // Get kategori nama from sub_kategori_id for backward compatibility
  const getKategoriQuery = 'SELECT nama FROM sub_kategori WHERE id = ?';

  db.query(getKategoriQuery, [subKategoriId], (err, kategoriResult) => {
    if (err) {
      return res.status(500).json({ message: 'Server error getting kategori', error: err });
    }

    const kategoriNama = kategoriResult && kategoriResult[0] ? kategoriResult[0].nama : null;

    const query = 'INSERT INTO arus_kas (tanggal, pt_code, jenis, jumlah, keterangan, kategori, sub_kategori_id, metode_bayar, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [localTanggal, pt, jenis, jumlah, keterangan, kategoriNama, subKategoriId, metodeBayar || 'cashless', req.userId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }

      res.status(201).json({
        message: 'Arus kas berhasil ditambahkan',
        id: result.insertId
      });
    });
  });
});

// Update Arus Kas (No Date Restriction - Can Edit Anytime)
app.put('/api/arus-kas/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { tanggal, pt, jenis, jumlah, keterangan, subKategoriId, metodeBayar } = req.body;

  // Step 1: Get existing arus kas data to check ownership
  const getQuery = 'SELECT created_by FROM arus_kas WHERE id = ?';

  db.query(getQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Data arus kas tidak ditemukan' });
    }

    const arusKasData = results[0];

    // Step 2: Validasi - only Master User or creator can edit
    if (arusKasData.created_by !== req.userId) {
      // Check if user is Master User
      const checkUserQuery = 'SELECT role FROM users WHERE id = ?';
      db.query(checkUserQuery, [req.userId], (err, userResults) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }

        if (userResults.length === 0 || userResults[0].role !== 'Master User') {
          return res.status(403).json({ message: 'Anda tidak memiliki akses untuk mengedit transaksi ini' });
        }

        // Master User can edit
        updateTransaction();
      });
    } else {
      // Creator can edit
      updateTransaction();
    }

    function updateTransaction() {
      // Force tanggal to be treated as local date (no timezone conversion)
      const localTanggal = processTanggal(tanggal);

      // Get kategori nama from sub_kategori_id for backward compatibility
      const getKategoriQuery = 'SELECT nama FROM sub_kategori WHERE id = ?';

      db.query(getKategoriQuery, [subKategoriId], (err, kategoriResult) => {
        if (err) {
          return res.status(500).json({ message: 'Server error getting kategori', error: err });
        }

        const kategoriNama = kategoriResult && kategoriResult[0] ? kategoriResult[0].nama : null;

        const updateQuery = `
          UPDATE arus_kas
          SET tanggal = ?, pt_code = ?, jenis = ?, jumlah = ?, keterangan = ?, kategori = ?, sub_kategori_id = ?, metode_bayar = ?
          WHERE id = ?
        `;

        db.query(updateQuery, [localTanggal, pt, jenis, jumlah, keterangan, kategoriNama, subKategoriId, metodeBayar || 'cashless', id], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Server error', error: err });
          }

          res.json({
            message: 'Data arus kas berhasil diupdate'
          });
        });
      });
    }
  });
});

// Delete Arus Kas (No Date Restriction - Can Delete Anytime)
app.delete('/api/arus-kas/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  // Step 1: Get existing arus kas data to check ownership
  const getQuery = 'SELECT created_by FROM arus_kas WHERE id = ?';

  db.query(getQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Data arus kas tidak ditemukan' });
    }

    const arusKasData = results[0];

    // Step 2: Validasi - only Master User or creator can delete
    if (arusKasData.created_by !== req.userId) {
      // Check if user is Master User
      const checkUserQuery = 'SELECT role FROM users WHERE id = ?';
      db.query(checkUserQuery, [req.userId], (err, userResults) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }

        if (userResults.length === 0 || userResults[0].role !== 'Master User') {
          return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus transaksi ini' });
        }

        // Master User can delete
        deleteTransaction();
      });
    } else {
      // Creator can delete
      deleteTransaction();
    }

    function deleteTransaction() {
      const deleteQuery = 'DELETE FROM arus_kas WHERE id = ?';

      db.query(deleteQuery, [id], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }

        res.json({
          message: 'Data arus kas berhasil dihapus'
        });
      });
    }
  });
});

// Test endpoint to debug arus_kas table structure (NO AUTH - TEMPORARY)
app.get('/api/debug/arus-kas', (req, res) => {
  console.log('🔍 DEBUG: Checking arus_kas table...');

  // Check if table exists
  const checkTableQuery = `
    SELECT COUNT(*) as tableExists
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name = 'arus_kas'
  `;

  db.query(checkTableQuery, (err, tableCheck) => {
    if (err) {
      console.error('❌ Error checking table existence:', err);
      return res.status(500).json({ error: 'Failed to check table', details: err.message });
    }

    const tableExists = tableCheck[0].tableExists > 0;
    console.log('Table exists:', tableExists);

    if (!tableExists) {
      return res.json({
        status: 'error',
        message: 'Table arus_kas does not exist',
        tableExists: false
      });
    }

    // Get table structure
    const describeQuery = 'DESCRIBE arus_kas';
    db.query(describeQuery, (err, structure) => {
      if (err) {
        console.error('❌ Error getting table structure:', err);
        return res.status(500).json({ error: 'Failed to describe table', details: err.message });
      }

      // Count rows
      const countQuery = 'SELECT COUNT(*) as rowCount FROM arus_kas';
      db.query(countQuery, (err, countResult) => {
        if (err) {
          console.error('❌ Error counting rows:', err);
          return res.status(500).json({ error: 'Failed to count rows', details: err.message });
        }

        // Get sample data
        const sampleQuery = 'SELECT * FROM arus_kas LIMIT 3';
        db.query(sampleQuery, (err, sampleData) => {
          if (err) {
            console.error('❌ Error getting sample data:', err);
            return res.status(500).json({ error: 'Failed to get sample data', details: err.message });
          }

          console.log('✅ Debug info collected successfully');
          res.json({
            status: 'success',
            tableExists: true,
            structure: structure,
            rowCount: countResult[0].rowCount,
            sampleData: sampleData
          });
        });
      });
    });
  });
});

// Auto-migration endpoint: Add updated_at column to arus_kas (NO AUTH - TEMPORARY)
app.get('/api/migrate/add-updated-at', (req, res) => {
  console.log('🔧 MIGRATION: Adding updated_at column to arus_kas...');

  // First check if column already exists
  const checkColumnQuery = `
    SELECT COUNT(*) as columnExists
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = 'arus_kas'
    AND column_name = 'updated_at'
  `;

  db.query(checkColumnQuery, (err, checkResult) => {
    if (err) {
      console.error('❌ Error checking column:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to check column existence',
        details: err.message
      });
    }

    const columnExists = checkResult[0].columnExists > 0;

    if (columnExists) {
      console.log('✅ Column updated_at already exists');
      return res.json({
        success: true,
        message: 'Column updated_at already exists',
        alreadyExists: true
      });
    }

    // Column doesn't exist, add it
    const addColumnQuery = `
      ALTER TABLE arus_kas
      ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `;

    db.query(addColumnQuery, (err, result) => {
      if (err) {
        console.error('❌ Error adding column:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to add column',
          details: err.message
        });
      }

      console.log('✅ Column updated_at added successfully');

      // Verify the change
      const verifyQuery = 'DESCRIBE arus_kas';
      db.query(verifyQuery, (err, structure) => {
        if (err) {
          console.error('❌ Error verifying structure:', err);
          return res.json({
            success: true,
            message: 'Column added but verification failed',
            changes: 'Added column: updated_at'
          });
        }

        res.json({
          success: true,
          message: 'Migration completed successfully',
          changes: 'Added column: updated_at',
          newStructure: structure
        });
      });
    });
  });
});

// Auto-migration endpoint: Create sub_kategori table and migrate data (NO AUTH - TEMPORARY)
app.get('/api/migrate/create-sub-kategori', (req, res) => {
  console.log('🔧 MIGRATION: Creating sub_kategori table and migrating data...');

  // Step 1: Check if table already exists
  const checkTableQuery = `
    SELECT COUNT(*) as tableExists
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name = 'sub_kategori'
  `;

  db.query(checkTableQuery, (err, tableCheck) => {
    if (err) {
      console.error('❌ Error checking table:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to check table existence',
        details: err.message
      });
    }

    const tableExists = tableCheck[0].tableExists > 0;

    if (tableExists) {
      console.log('✅ Table sub_kategori already exists');
      return res.json({
        success: true,
        message: 'Table sub_kategori already exists',
        alreadyExists: true
      });
    }

    // Step 2: Create sub_kategori table
    const createTableQuery = `
      CREATE TABLE sub_kategori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        jenis ENUM('pemasukan', 'pengeluaran') NOT NULL,
        nama VARCHAR(100) NOT NULL,
        urutan INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_jenis (jenis),
        INDEX idx_urutan (urutan)
      )
    `;

    db.query(createTableQuery, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to create sub_kategori table',
          details: err.message
        });
      }

      console.log('✅ Table sub_kategori created successfully');

      // Step 3: Seed initial data
      const seedQuery = `
        INSERT INTO sub_kategori (jenis, nama, urutan) VALUES
        ('pengeluaran', 'BIAYA OPERASIONAL', 1),
        ('pengeluaran', 'BIAYA LAIN-LAIN', 2),
        ('pengeluaran', 'TRANSPORT FEE', 3),
        ('pengeluaran', 'BEBAN GAJI KARYAWAN', 4),
        ('pengeluaran', 'BEBAN DIMUKA', 5),
        ('pengeluaran', 'BIAYA PAJAK & KONSULTAN', 6),
        ('pengeluaran', 'BIAYA ANGSURAN', 7),
        ('pengeluaran', 'BIAYA SEWA', 8),
        ('pengeluaran', 'KASBON KARYAWAN', 9),
        ('pengeluaran', 'PEMBELIAN BARANG', 10),
        ('pengeluaran', 'MAINTENANCE', 11),
        ('pengeluaran', 'KOMUNIKASI', 12),
        ('pemasukan', 'PEMASUKAN LAIN', 1)
      `;

      db.query(seedQuery, (err) => {
        if (err) {
          console.error('❌ Error seeding data:', err);
          return res.status(500).json({
            success: false,
            error: 'Table created but failed to seed initial data',
            details: err.message
          });
        }

        console.log('✅ Initial data seeded successfully');

        // Step 4: Add sub_kategori_id column to kas_kecil
        const alterKasKecilQuery = `
          ALTER TABLE kas_kecil
          ADD COLUMN sub_kategori_id INT NULL AFTER kategori,
          ADD FOREIGN KEY (sub_kategori_id) REFERENCES sub_kategori(id)
        `;

        db.query(alterKasKecilQuery, (err) => {
          if (err) {
            console.error('❌ Error altering kas_kecil:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to add sub_kategori_id to kas_kecil',
              details: err.message
            });
          }

          console.log('✅ Column sub_kategori_id added to kas_kecil');

          // Step 5: Add sub_kategori_id column to arus_kas
          const alterArusKasQuery = `
            ALTER TABLE arus_kas
            ADD COLUMN sub_kategori_id INT NULL AFTER kategori,
            ADD FOREIGN KEY (sub_kategori_id) REFERENCES sub_kategori(id)
          `;

          db.query(alterArusKasQuery, (err) => {
            if (err) {
              console.error('❌ Error altering arus_kas:', err);
              return res.status(500).json({
                success: false,
                error: 'Failed to add sub_kategori_id to arus_kas',
                details: err.message
              });
            }

            console.log('✅ Column sub_kategori_id added to arus_kas');

            // Step 6: Migrate existing data from kas_kecil
            const migrateKasKecilQuery = `
              UPDATE kas_kecil kk
              JOIN sub_kategori sk ON kk.kategori = sk.nama
              SET kk.sub_kategori_id = sk.id
              WHERE kk.kategori IS NOT NULL
            `;

            db.query(migrateKasKecilQuery, (err, result) => {
              if (err) {
                console.error('❌ Error migrating kas_kecil data:', err);
              } else {
                console.log(`✅ Migrated ${result.affectedRows} rows in kas_kecil`);
              }

              // Step 7: Migrate existing data from arus_kas
              const migrateArusKasQuery = `
                UPDATE arus_kas ak
                JOIN sub_kategori sk ON ak.kategori = sk.nama
                SET ak.sub_kategori_id = sk.id
                WHERE ak.kategori IS NOT NULL
              `;

              db.query(migrateArusKasQuery, (err, result2) => {
                if (err) {
                  console.error('❌ Error migrating arus_kas data:', err);
                } else {
                  console.log(`✅ Migrated ${result2.affectedRows} rows in arus_kas`);
                }

                res.json({
                  success: true,
                  message: 'Migration completed successfully',
                  changes: [
                    'Created table: sub_kategori',
                    'Seeded 13 initial sub kategori',
                    'Added column: kas_kecil.sub_kategori_id',
                    'Added column: arus_kas.sub_kategori_id',
                    `Migrated ${result?.affectedRows || 0} kas_kecil records`,
                    `Migrated ${result2?.affectedRows || 0} arus_kas records`
                  ]
                });
              });
            });
          });
        });
      });
    });
  });
});


// ==================== SUB KATEGORI ROUTES ====================

// Get all sub kategori
app.get('/api/sub-kategori', verifyToken, (req, res) => {
  const { jenis } = req.query; // Filter by jenis: 'pemasukan' or 'pengeluaran'

  let query = 'SELECT id, jenis, nama, urutan, created_at, updated_at FROM sub_kategori';
  const params = [];

  if (jenis) {
    query += ' WHERE jenis = ?';
    params.push(jenis);
  }

  query += ' ORDER BY jenis ASC, urutan ASC, nama ASC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error loading sub kategori:', err);
      return res.status(500).json({ message: 'Server error loading sub kategori', error: err.message });
    }

    res.json(results);
  });
});

// Create new sub kategori
app.post('/api/sub-kategori', verifyToken, (req, res) => {
  const { jenis, nama, urutan } = req.body;

  // Validation
  if (!jenis || !nama) {
    return res.status(400).json({ message: 'Jenis dan nama sub kategori wajib diisi' });
  }

  if (!['pemasukan', 'pengeluaran'].includes(jenis)) {
    return res.status(400).json({ message: 'Jenis harus pemasukan atau pengeluaran' });
  }

  const insertQuery = `
    INSERT INTO sub_kategori (jenis, nama, urutan)
    VALUES (?, ?, ?)
  `;

  db.query(insertQuery, [jenis, nama, urutan || 0], (err, result) => {
    if (err) {
      console.error('Error creating sub kategori:', err);
      return res.status(500).json({ message: 'Server error creating sub kategori', error: err.message });
    }

    res.status(201).json({
      message: 'Sub kategori berhasil ditambahkan',
      id: result.insertId
    });
  });
});

// Update sub kategori
app.put('/api/sub-kategori/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { jenis, nama, urutan } = req.body;

  // Validation
  if (!jenis || !nama) {
    return res.status(400).json({ message: 'Jenis dan nama sub kategori wajib diisi' });
  }

  if (!['pemasukan', 'pengeluaran'].includes(jenis)) {
    return res.status(400).json({ message: 'Jenis harus pemasukan atau pengeluaran' });
  }

  const updateQuery = `
    UPDATE sub_kategori
    SET jenis = ?, nama = ?, urutan = ?
    WHERE id = ?
  `;

  db.query(updateQuery, [jenis, nama, urutan || 0, id], (err, result) => {
    if (err) {
      console.error('Error updating sub kategori:', err);
      return res.status(500).json({ message: 'Server error updating sub kategori', error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sub kategori tidak ditemukan' });
    }

    res.json({ message: 'Sub kategori berhasil diupdate' });
  });
});

// Delete sub kategori
app.delete('/api/sub-kategori/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  // Check if sub kategori is being used in kas_kecil or arus_kas
  const checkUsageQuery = `
    SELECT
      (SELECT COUNT(*) FROM kas_kecil WHERE sub_kategori_id = ?) as kas_kecil_count,
      (SELECT COUNT(*) FROM arus_kas WHERE sub_kategori_id = ?) as arus_kas_count
  `;

  db.query(checkUsageQuery, [id, id], (err, result) => {
    if (err) {
      console.error('Error checking sub kategori usage:', err);
      return res.status(500).json({ message: 'Server error checking usage', error: err.message });
    }

    const kasKecilCount = result[0].kas_kecil_count;
    const arusKasCount = result[0].arus_kas_count;
    const totalUsage = kasKecilCount + arusKasCount;

    if (totalUsage > 0) {
      return res.status(400).json({
        message: `Sub kategori tidak dapat dihapus karena masih digunakan di ${kasKecilCount} transaksi Kas Kecil dan ${arusKasCount} transaksi Arus Kas`,
        usage: { kas_kecil: kasKecilCount, arus_kas: arusKasCount }
      });
    }

    // Safe to delete
    const deleteQuery = 'DELETE FROM sub_kategori WHERE id = ?';

    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error('Error deleting sub kategori:', err);
        return res.status(500).json({ message: 'Server error deleting sub kategori', error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Sub kategori tidak ditemukan' });
      }

      res.json({ message: 'Sub kategori berhasil dihapus' });
    });
  });
});


// ==================== PENJUALAN ROUTES ====================

// Get Penjualan
app.get('/api/penjualan', verifyToken, (req, res) => {
  const { pt, tanggal_dari, tanggal_sampai } = req.query;
  
  let query = 'SELECT * FROM penjualan WHERE 1=1';
  let params = [];
  
  if (pt) {
    query += ' AND pt_code = ?';
    params.push(pt);
  }
  
  if (tanggal_dari) {
    query += ' AND tanggal >= ?';
    params.push(tanggal_dari);
  }
  
  if (tanggal_sampai) {
    query += ' AND tanggal <= ?';
    params.push(tanggal_sampai);
  }
  
  query += ' ORDER BY tanggal ASC, id ASC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    res.json(results);
  });
});

// Create Penjualan
app.post('/api/penjualan', verifyToken, (req, res) => {
  const { tanggal, pt, pangkalan, qty, ppnPercent, metodeBayar } = req.body;
  
  // Force tanggal to be treated as local date
  const localTanggal = processTanggal(tanggal);
  
  const harga = 16000;
  const total = qty * harga;
  const ppn = total * (ppnPercent / 100);
  
  const query = 'INSERT INTO penjualan (tanggal, pt_code, pangkalan, qty, harga, total, ppn, ppn_percent, metode_bayar, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(query, [localTanggal, pt, pangkalan, qty, harga, total, ppn, ppnPercent, metodeBayar, req.userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    // Jika cash, masukkan ke kas kecil
    if (metodeBayar === 'cash') {
      const kasQuery = 'INSERT INTO kas_kecil (tanggal, pt_code, jenis, jumlah, keterangan, status, created_by, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const keterangan = `Penjualan Tunai ${pangkalan}`;
      
      db.query(kasQuery, [localTanggal, pt, 'masuk', total, keterangan, 'approved', req.userId, req.userId], (kasErr) => {
        if (kasErr) {
          console.error('Error inserting kas:', kasErr);
        }
      });
    }
    
    res.status(201).json({
      message: 'Penjualan berhasil ditambahkan',
      id: result.insertId
    });
  });
});

// Get Pangkalan by PT
app.get('/api/pangkalan', verifyToken, (req, res) => {
  const { pt } = req.query;
  
  let query = 'SELECT * FROM pangkalan WHERE 1=1';
  let params = [];
  
  if (pt) {
    query += ' AND pt_code = ?';
    params.push(pt);
  }
  
  query += ' ORDER BY name';
  
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    res.json(results);
  });
});

// ==================== DASHBOARD STATS ====================

app.get('/api/dashboard/stats', verifyToken, (req, res) => {
  const { pt } = req.query;
  const today = getLocalDate();

  // Query untuk stats
  const queries = {
    // Kas Kecil Hari Ini: Saldo akhir dari transaksi hari ini saja (masuk - keluar)
    kasKecilHariIni: `SELECT
      SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) -
      SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as saldo
      FROM kas_kecil
      WHERE tanggal = ?
      AND keterangan NOT LIKE 'Sisa Saldo tanggal%'
      ${pt ? 'AND pt_code = ?' : ''}`,

    // Pemasukan Kas Kecil Hari Ini
    pemasukanHariIni: `SELECT SUM(jumlah) as total_pemasukan
      FROM kas_kecil
      WHERE jenis = 'masuk'
        AND status = 'approved'
        AND tanggal = ?
        AND keterangan NOT LIKE 'Sisa Saldo tanggal%'
        ${pt ? 'AND pt_code = ?' : ''}`,

    // Pengeluaran Kas Kecil Hari Ini
    pengeluaranHariIni: `SELECT SUM(jumlah) as total_pengeluaran
      FROM kas_kecil
      WHERE jenis = 'keluar'
        AND status = 'approved'
        AND tanggal = ?
        ${pt ? 'AND pt_code = ?' : ''}`,

    penjualanHariIni: `SELECT SUM(qty) as total_qty, SUM(total) as total_nilai
      FROM penjualan WHERE tanggal = ? ${pt ? 'AND pt_code = ?' : ''}`,

    pendingApproval: `SELECT COUNT(*) as total
      FROM kas_kecil WHERE status = 'pending' ${pt ? 'AND pt_code = ?' : ''}`
  };

  const paramsKasKecil = pt ? [today, pt] : [today];
  const paramsPemasukan = pt ? [today, pt] : [today];
  const paramsPengeluaran = pt ? [today, pt] : [today];
  const paramsPenjualan = pt ? [today, pt] : [today];
  const paramsPending = pt ? [pt] : [];

  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queries.kasKecilHariIni, paramsKasKecil, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.pemasukanHariIni, paramsPemasukan, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.pengeluaranHariIni, paramsPengeluaran, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.penjualanHariIni, paramsPenjualan, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.pendingApproval, paramsPending, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    })
  ])
  .then(([kasKecil, pemasukan, pengeluaran, penjualan, pending]) => {
    res.json({
      kasKecilSaldoAkhir: parseFloat(kasKecil.saldo) || 0,
      kasKecilPemasukanHariIni: parseFloat(pemasukan.total_pemasukan) || 0,
      kasKecilPengeluaranHariIni: parseFloat(pengeluaran.total_pengeluaran) || 0,
      penjualanQty: parseInt(penjualan.total_qty) || 0,
      penjualanNilai: parseFloat(penjualan.total_nilai) || 0,
      pendingApproval: parseInt(pending.total) || 0
    });
  })
  .catch(err => {
    res.status(500).json({ message: 'Server error', error: err });
  });
});

// ==================== USER MANAGEMENT ROUTES ====================

// Get All Users (Admin only)
app.get('/api/users', verifyToken, (req, res) => {
  const query = 'SELECT id, username, name, role FROM users ORDER BY id';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    // Get PT access for each user
    const usersWithAccess = results.map(user => {
      return new Promise((resolve, reject) => {
        const accessQuery = 'SELECT pt_code FROM pt_access WHERE user_id = ?';
        db.query(accessQuery, [user.id], (err, accessResults) => {
          if (err) reject(err);
          const accessPT = accessResults.map(row => row.pt_code);
          resolve({ ...user, accessPT });
        });
      });
    });
    
    Promise.all(usersWithAccess)
      .then(users => res.json(users))
      .catch(err => res.status(500).json({ message: 'Server error', error: err }));
  });
});

// Create User
app.post('/api/users', verifyToken, async (req, res) => {
  const { username, password, name, role, aksesPT, fiturAkses } = req.body;
  
  // Validate required fields
  if (!username || !password || !name || !role) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }
  
  try {
    // Check if username exists
    const checkQuery = 'SELECT id FROM users WHERE username = ?';
    db.query(checkQuery, [username], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ message: 'Username sudah digunakan' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user
      const insertQuery = 'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)';
      db.query(insertQuery, [username, hashedPassword, name, role], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }
        
        const userId = result.insertId;
        
        // Insert PT access
        if (aksesPT && aksesPT.length > 0) {
          const accessValues = aksesPT.map(pt => [userId, pt]);
          const accessQuery = 'INSERT INTO pt_access (user_id, pt_code) VALUES ?';
          db.query(accessQuery, [accessValues], (err) => {
            if (err) {
              console.error('Error inserting PT access:', err);
            }
          });
        }
        
        // Insert Feature access
        if (fiturAkses && fiturAkses.length > 0) {
          const featureValues = fiturAkses.map(feature => [userId, feature]);
          const featureQuery = 'INSERT INTO feature_access (user_id, feature_id) VALUES ?';
          db.query(featureQuery, [featureValues], (err) => {
            if (err) {
              console.error('Error inserting feature access:', err);
            }
          });
        }
        
        res.status(201).json({ 
          message: 'User berhasil ditambahkan',
          userId 
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update User
app.put('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { username, name, role, aksesPT, fiturAkses, password } = req.body;
  
  try {
    // Check if user exists
    const checkQuery = 'SELECT id FROM users WHERE id = ?';
    db.query(checkQuery, [id], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }
      
      // Build update query
      let updateQuery = 'UPDATE users SET username = ?, name = ?, role = ?';
      let updateParams = [username, name, role];
      
      // If password provided, hash and add to update
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery += ', password = ?';
        updateParams.push(hashedPassword);
      }
      
      updateQuery += ' WHERE id = ?';
      updateParams.push(id);
      
      // Update user
      db.query(updateQuery, updateParams, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }
        
        // Update PT access
        const deleteAccessQuery = 'DELETE FROM pt_access WHERE user_id = ?';
        db.query(deleteAccessQuery, [id], (err) => {
          if (err) {
            console.error('Error deleting PT access:', err);
          }
          
          if (aksesPT && aksesPT.length > 0) {
            const accessValues = aksesPT.map(pt => [id, pt]);
            const accessQuery = 'INSERT INTO pt_access (user_id, pt_code) VALUES ?';
            db.query(accessQuery, [accessValues], (err) => {
              if (err) {
                console.error('Error inserting PT access:', err);
              }
            });
          }
          
          // Update Feature access
          const deleteFeatureQuery = 'DELETE FROM feature_access WHERE user_id = ?';
          db.query(deleteFeatureQuery, [id], (err) => {
            if (err) {
              console.error('Error deleting feature access:', err);
            }
            
            if (fiturAkses && fiturAkses.length > 0) {
              const featureValues = fiturAkses.map(feature => [id, feature]);
              const featureQuery = 'INSERT INTO feature_access (user_id, feature_id) VALUES ?';
              db.query(featureQuery, [featureValues], (err) => {
                if (err) {
                  console.error('Error inserting feature access:', err);
                }
              });
            }
            
            res.json({ message: 'User berhasil diupdate' });
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete User
app.delete('/api/users/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  // Delete PT access first
  const deleteAccessQuery = 'DELETE FROM pt_access WHERE user_id = ?';
  db.query(deleteAccessQuery, [id], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    // Delete user
    const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
    db.query(deleteUserQuery, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }
      
      res.json({ message: 'User berhasil dihapus' });
    });
  });
});

// ==================== PROFILE MANAGEMENT ROUTES ====================

// Update Profile (Self)
app.put('/api/auth/profile', verifyToken, (req, res) => {
  const { name, role } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Nama wajib diisi' });
  }
  
  const updateQuery = 'UPDATE users SET name = ?, role = ? WHERE id = ?';
  db.query(updateQuery, [name, role, req.userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    res.json({ 
      message: 'Profile berhasil diupdate',
      user: { name, role }
    });
  });
});

// Change Password (Self)
app.put('/api/auth/password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Password lama dan baru wajib diisi' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
  }
  
  try {
    // Get current user
    const query = 'SELECT password FROM users WHERE id = ?';
    db.query(query, [req.userId], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }
      
      const user = results[0];
      
      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Password lama salah' });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
      db.query(updateQuery, [hashedPassword, req.userId], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Server error', error: err });
        }
        
        res.json({ message: 'Password berhasil diubah' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sumber Jaya API is running' });
});

// TEMPORARY: Seed Database Endpoint (REMOVE AFTER FIRST RUN!)
app.get('/api/setup-database', async (req, res) => {
  try {
    // Insert PT List
    await db.promise().query(`
      INSERT INTO pt_list (code, name) VALUES
      ('KSS', 'PT KHALISA SALMA SEJAHTERA'),
      ('SJE', 'PT SUMBER JAYA ELPIJI'),
      ('FAB', 'PT FADILLAH AMANAH BERSAMA'),
      ('KBS', 'PT KHABITSA INDOGAS'),
      ('SJS', 'PT SUMBER JAYA SEJAHTERA')
      ON DUPLICATE KEY UPDATE code=code
    `);
    
    // Insert Master User (password: hengky123)
    const hashedPassword = await bcrypt.hash('hengky123', 10);
    await db.promise().query(`
      INSERT INTO users (username, password, name, role) 
      VALUES ('hengky', ?, 'Hengky Master User', 'Master User')
      ON DUPLICATE KEY UPDATE username=username
    `, [hashedPassword]);
    
    // Insert PT Access
    await db.promise().query(`
      INSERT INTO pt_access (user_id, pt_code) 
      SELECT 1, code FROM pt_list
      ON DUPLICATE KEY UPDATE user_id=user_id
    `);
    
    // Insert Pangkalan
    await db.promise().query(`
      INSERT INTO pangkalan (pt, nama) VALUES
      ('KSS', 'Pangkalan A'), ('KSS', 'Pangkalan B'),
      ('SJE', 'Pangkalan C'), ('FAB', 'Pangkalan D'),
      ('KBS', 'Pangkalan E'), ('SJS', 'Pangkalan F')
      ON DUPLICATE KEY UPDATE pt=pt
    `);
    
    // Verify
    const [users] = await db.promise().query('SELECT id, username, name, role FROM users WHERE username = "hengky"');
    
    res.json({ 
      status: 'SUCCESS',
      message: 'Database seeded successfully!',
      credentials: {
        username: 'hengky',
        password: 'hengky123'
      },
      user: users[0]
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Failed to seed database',
      error: error.message 
    });
  }
});

// ==================== HEALTH CHECK & MONITORING ====================

// Health check endpoint untuk monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Sumber Jaya API',
    version: '1.0.0',
    connectionPool: {
      configured: true,
      maxConnections: dbConfig.connectionLimit
    }
  });
});

// Enhanced database health check with pool status
app.get('/api/health/db', async (req, res) => {
  try {
    // Test actual query execution (more thorough than just ping)
    const [result] = await db.promise().query('SELECT 1 + 1 AS result');

    res.status(200).json({
      status: 'OK',
      message: 'Database connection pool healthy',
      timestamp: new Date().toISOString(),
      pool: {
        active: true,
        testQuery: 'passed'
      }
    });
  } catch (err) {
    console.error('❌ Health check failed:', err);
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection pool unhealthy',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Keep-alive endpoint to prevent sleep
app.get('/api/keep-alive', (req, res) => {
  res.status(200).json({
    status: 'ALIVE',
    message: 'Server is awake',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start Server
// Production: Listen on all interfaces (0.0.0.0)
// Development: Listen on localhost only (127.0.0.1) to avoid macOS EPERM
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API: http://${HOST}:${PORT}/api`);
  console.log(`🔄 Connection pool: ACTIVE with ${dbConfig.connectionLimit} max connections`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Public URL configured for Railway`);
  }
});

// ==================== DATABASE HEALTH CHECK ====================

// Periodic health check to keep Railway MySQL connection alive
if (process.env.NODE_ENV === 'production') {
  const healthCheckInterval = setInterval(async () => {
    try {
      await promisePool.query('SELECT 1');
      console.log('💚 Database health check: OK');
    } catch (err) {
      console.error('⚠️ Health check failed:', err.code);
    }
  }, 60000); // Check every 60 seconds

  // Clear interval on shutdown
  process.on('SIGTERM', () => clearInterval(healthCheckInterval));
  process.on('SIGINT', () => clearInterval(healthCheckInterval));

  console.log('💓 Database health check started (60s interval)');
}

// ==================== GRACEFUL SHUTDOWN HANDLER ====================

// Handle graceful shutdown to close pool connections properly
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️ ${signal} signal received: closing HTTP server...`);

  server.close(async () => {
    console.log('✅ HTTP server closed');

    // Close database pool connections gracefully
    try {
      await pool.end();
      console.log('✅ Database connection pool closed');
      console.log('👋 Server shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing database pool:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout...');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors to prevent pool connection leaks
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});