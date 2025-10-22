-- Create feature_access table
CREATE TABLE IF NOT EXISTS feature_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  feature_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_feature (user_id, feature_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Master User (hengky) feature access
INSERT INTO feature_access (user_id, feature_id) VALUES
(1, 'dashboard'),
(1, 'kas-kecil'),
(1, 'detail-kas'),
(1, 'penjualan'),
(1, 'laporan'),
(1, 'master-admin')
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Verify
SELECT * FROM feature_access;

