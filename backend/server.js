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
  // Add your production frontend URL here after deployment
  // Example: 'https://sumber-jaya-app.vercel.app'
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

// Database Connection - Support Railway
const dbConfig = process.env.MYSQLHOST 
  ? {
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE || 'railway',
      timezone: '+07:00' // WIB (Western Indonesian Time)
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sumber_jaya_db',
      timezone: '+07:00' // WIB (Western Indonesian Time)
    };

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL Database');
  
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
  
  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('⚠️ Error creating feature_access table:', err.message);
    } else {
      console.log('✅ feature_access table ready');
      
      // Insert default feature access for Master User (ID=1)
      const insertSQL = `
        INSERT IGNORE INTO feature_access (user_id, feature_id) VALUES
        (1, 'dashboard'),
        (1, 'kas-kecil'),
        (1, 'detail-kas'),
        (1, 'penjualan'),
        (1, 'laporan'),
        (1, 'master-admin');
      `;
      
      db.query(insertSQL, (err) => {
        if (err) {
          console.error('⚠️ Error inserting default feature access:', err.message);
        } else {
          console.log('✅ Master User feature access configured');
        }
      });
    }
  });
});

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

// Get Kas Kecil
app.get('/api/kas-kecil', verifyToken, (req, res) => {
  const { pt, tanggal_dari, tanggal_sampai, status } = req.query;
  
  let query = 'SELECT id, tanggal, pt_code AS pt, jenis, jumlah, keterangan, status, created_by, approved_by, created_at, updated_at FROM kas_kecil WHERE 1=1';
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
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY tanggal DESC, id DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    // Convert jumlah string to number for correct calculations
    const formattedResults = results.map(item => ({
      ...item,
      jumlah: parseFloat(item.jumlah)
    }));
    
    res.json(formattedResults);
  });
});

// Create Kas Kecil
app.post('/api/kas-kecil', verifyToken, (req, res) => {
  const { tanggal, pt, jenis, jumlah, keterangan } = req.body;
  
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
  
  const query = 'INSERT INTO kas_kecil (tanggal, pt_code, jenis, jumlah, keterangan, status, created_by, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(query, [tanggal, pt, jenis, jumlah, keterangan, status, req.userId, approved_by], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    res.status(201).json({
      message: 'Kas kecil berhasil ditambahkan',
      id: result.insertId,
      status
    });
  });
});

// Auto Transfer Saldo Kemarin
app.post('/api/kas-kecil/transfer-saldo', verifyToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
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
      WHERE tanggal <= ?
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
  
  // Step 1: Get kas data to check PT
  const getKasQuery = 'SELECT pt_code AS pt FROM kas_kecil WHERE id = ?';
  
  db.query(getKasQuery, [id], (err, kasResults) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (kasResults.length === 0) {
      return res.status(404).json({ message: 'Data kas tidak ditemukan' });
    }
    
    const kasPT = kasResults[0].pt;
    
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
        
        res.json({ 
          message: 'Status berhasil diupdate',
          status: status,
          pt: kasPT
        });
      });
    });
  });
});

// Update Kas Kecil (hanya untuk transaksi hari ini)
app.put('/api/kas-kecil/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { tanggal, pt, jenis, jumlah, keterangan } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  // Step 1: Get existing kas data
  const getKasQuery = 'SELECT tanggal, created_by FROM kas_kecil WHERE id = ?';
  
  db.query(getKasQuery, [id], (err, kasResults) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (kasResults.length === 0) {
      return res.status(404).json({ message: 'Data kas tidak ditemukan' });
    }
    
    const kasData = kasResults[0];
    const kasTanggal = new Date(kasData.tanggal).toISOString().split('T')[0];
    
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
    
    const updateQuery = `
      UPDATE kas_kecil 
      SET tanggal = ?, pt_code = ?, jenis = ?, jumlah = ?, keterangan = ?, status = ?, approved_by = ?
      WHERE id = ?
    `;
    
    db.query(updateQuery, [tanggal, pt, jenis, jumlah, keterangan, status, approved_by, id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }
      
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
  const today = new Date().toISOString().split('T')[0];
  
  // Step 1: Get existing kas data
  const getKasQuery = 'SELECT tanggal, created_by, created_at FROM kas_kecil WHERE id = ?';
  
  db.query(getKasQuery, [id], (err, kasResults) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (kasResults.length === 0) {
      return res.status(404).json({ message: 'Data kas tidak ditemukan' });
    }
    
    const kasData = kasResults[0];
    
    // Step 2: Validasi - hanya bisa hapus transaksi yang dibuat hari ini
    const createdDate = new Date(kasData.created_at);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    if (createdDate < todayStart) {
      return res.status(403).json({ 
        message: 'Hanya bisa menghapus transaksi yang dibuat hari ini',
        createdAt: kasData.created_at
      });
    }
    
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
    WHERE 1=1
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
  
  query += ' ORDER BY tanggal DESC, id DESC';
  
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
  
  const harga = 16000;
  const total = qty * harga;
  const ppn = total * (ppnPercent / 100);
  
  const query = 'INSERT INTO penjualan (tanggal, pt_code, pangkalan, qty, harga, total, ppn, ppn_percent, metode_bayar, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(query, [tanggal, pt, pangkalan, qty, harga, total, ppn, ppnPercent, metodeBayar, req.userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    // Jika cash, masukkan ke kas kecil
    if (metodeBayar === 'cash') {
      const kasQuery = 'INSERT INTO kas_kecil (tanggal, pt_code, jenis, jumlah, keterangan, status, created_by, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const keterangan = `Penjualan Tunai ${pangkalan}`;
      
      db.query(kasQuery, [tanggal, pt, 'masuk', total, keterangan, 'approved', req.userId, req.userId], (kasErr) => {
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
  const today = new Date().toISOString().split('T')[0];
  
  // Hitung tanggal 7 hari yang lalu
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  
  // Query untuk stats
  const queries = {
    // Kas Kecil: Saldo akumulasi dari SEMUA transaksi approved (bukan hanya hari ini)
    kasHarian: `SELECT 
      SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) - 
      SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as saldo
      FROM kas_kecil ${pt ? 'WHERE pt_code = ?' : ''}`,
    
    penjualanHariIni: `SELECT SUM(qty) as total_qty, SUM(total) as total_nilai
      FROM penjualan WHERE tanggal = ? ${pt ? 'AND pt_code = ?' : ''}`,
    
    pendingApproval: `SELECT COUNT(*) as total
      FROM kas_kecil WHERE status = 'pending' ${pt ? 'AND pt_code = ?' : ''}`,
    
    pengeluaran7Hari: `SELECT SUM(jumlah) as total_pengeluaran
      FROM kas_kecil 
      WHERE jenis = 'keluar' 
        AND status = 'approved' 
        AND tanggal >= ? 
        AND tanggal <= ? 
        ${pt ? 'AND pt_code = ?' : ''}`
  };
  
  const paramsKas = pt ? [pt] : [];
  const paramsPenjualan = pt ? [today, pt] : [today];
  const paramsPending = pt ? [pt] : [];
  const params7Days = pt ? [sevenDaysAgoStr, today, pt] : [sevenDaysAgoStr, today];
  
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queries.kasHarian, paramsKas, (err, results) => {
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
    }),
    new Promise((resolve, reject) => {
      db.query(queries.pengeluaran7Hari, params7Days, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    })
  ])
  .then(([kas, penjualan, pending, pengeluaran7]) => {
    res.json({
      kasHarian: parseFloat(kas.saldo) || 0,
      penjualanQty: parseInt(penjualan.total_qty) || 0,
      penjualanNilai: parseFloat(penjualan.total_nilai) || 0,
      pendingApproval: parseInt(pending.total) || 0,
      pengeluaran7Hari: parseFloat(pengeluaran7.total_pengeluaran) || 0
    });
  })
  .catch(err => {
    res.status(500).json({ message: 'Server error', error: err });
  });
});

// ==================== USER MANAGEMENT ROUTES ====================

// Get All Users (Admin only)
app.get('/api/users', verifyToken, (req, res) => {
  const query = 'SELECT id, username, name, role, status FROM users ORDER BY id';
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
  const { username, name, role, aksesPT, fiturAkses, status, password } = req.body;
  
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
      let updateQuery = 'UPDATE users SET username = ?, name = ?, role = ?, status = ?';
      let updateParams = [username, name, role, status];
      
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
    version: '1.0.0'
  });
});

// Database health check
app.get('/api/health/db', (req, res) => {
  db.ping((err) => {
    if (err) {
      return res.status(503).json({
        status: 'ERROR',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
    res.status(200).json({
      status: 'OK',
      message: 'Database connected',
      timestamp: new Date().toISOString()
    });
  });
});

// Start Server
// Production: Listen on all interfaces (0.0.0.0)
// Development: Listen on localhost only (127.0.0.1) to avoid macOS EPERM
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API: http://${HOST}:${PORT}/api`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Public URL configured for Railway`);
  }
});