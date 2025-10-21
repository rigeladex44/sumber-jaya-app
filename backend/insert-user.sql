-- Insert master user (password: hengky123)
INSERT INTO users (username, password, name, role, status) 
VALUES ('hengky', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGQeL8hE9zqT.XPvBGIJeOa', 'Hengky Master User', 'Master User', 'aktif')
ON DUPLICATE KEY UPDATE username=username;

-- Insert PT list
INSERT INTO pt_list (code, name) VALUES
('KSS', 'PT KHALISA SALMA SEJAHTERA'),
('SJE', 'PT SUMBER JAYA ELPIJI'),
('FAB', 'PT FADILLAH AMANAH BERSAMA'),
('KBS', 'PT KHABITSA INDOGAS'),
('SJS', 'PT SUMBER JAYA SEJAHTERA')
ON DUPLICATE KEY UPDATE code=code;

-- Insert PT access for master user
INSERT INTO pt_access (user_id, pt_code) 
SELECT 1, code FROM pt_list
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Insert sample pangkalan
INSERT INTO pangkalan (pt, nama) VALUES
('KSS', 'Pangkalan A'), ('KSS', 'Pangkalan B'),
('SJE', 'Pangkalan C'), ('FAB', 'Pangkalan D'),
('KBS', 'Pangkalan E'), ('SJS', 'Pangkalan F')
ON DUPLICATE KEY UPDATE pt=pt;

-- Show result
SELECT id, username, name, role, status FROM users WHERE username = 'hengky';
