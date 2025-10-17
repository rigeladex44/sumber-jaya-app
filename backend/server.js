const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection - Support Railway
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

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL Database');
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
      
      // Create token
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          accessPT
        }
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
  
  let query = 'SELECT * FROM kas_kecil WHERE 1=1';
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
    res.json(results);
  });
});

// Create Kas Kecil
app.post('/api/kas-kecil', verifyToken, (req, res) => {
  const { tanggal, pt, jenis, jumlah, keterangan } = req.body;
  
  // Auto approve jika <= 300000
  const status = parseFloat(jumlah) <= 300000 ? 'approved' : 'pending';
  const approved_by = status === 'approved' ? req.userId : null;
  
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

// Approve/Reject Kas Kecil
app.patch('/api/kas-kecil/:id/status', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  
  const query = 'UPDATE kas_kecil SET status = ?, approved_by = ? WHERE id = ?';
  
  db.query(query, [status, req.userId, id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }
    
    res.json({ message: 'Status berhasil diupdate' });
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
  
  // Query untuk stats
  const queries = {
    kasHarian: `SELECT 
      SUM(CASE WHEN jenis = 'masuk' AND status = 'approved' THEN jumlah ELSE 0 END) - 
      SUM(CASE WHEN jenis = 'keluar' AND status = 'approved' THEN jumlah ELSE 0 END) as saldo
      FROM kas_kecil WHERE tanggal = ? ${pt ? 'AND pt_code = ?' : ''}`,
    
    penjualanHariIni: `SELECT SUM(qty) as total_qty, SUM(total) as total_nilai
      FROM penjualan WHERE tanggal = ? ${pt ? 'AND pt_code = ?' : ''}`,
    
    pendingApproval: `SELECT COUNT(*) as total
      FROM kas_kecil WHERE status = 'pending' ${pt ? 'AND pt_code = ?' : ''}`
  };
  
  const params = pt ? [today, pt] : [today];
  
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queries.kasHarian, params, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.penjualanHariIni, params, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.pendingApproval, pt ? [pt] : [], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    })
  ])
  .then(([kas, penjualan, pending]) => {
    res.json({
      kasHarian: parseFloat(kas.saldo) || 0,
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
  const { username, password, name, role, aksesPT, status } = req.body;
  
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
      const insertQuery = 'INSERT INTO users (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)';
      db.query(insertQuery, [username, hashedPassword, name, role, status || 'aktif'], (err, result) => {
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
  const { username, name, role, aksesPT, status, password } = req.body;
  
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
          
          res.json({ message: 'User berhasil diupdate' });
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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});