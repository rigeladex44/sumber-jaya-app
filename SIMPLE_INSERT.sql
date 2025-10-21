-- SIMPLE INSERT - Copy paste ini di Railway MySQL Console
-- atau run via mysql client

-- PT List
INSERT INTO pt_list (code, name) VALUES 
('KSS', 'PT KHALISA SALMA SEJAHTERA'),
('SJE', 'PT SUMBER JAYA ELPIJI'),
('FAB', 'PT FADILLAH AMANAH BERSAMA'),
('KBS', 'PT KHABITSA INDOGAS'),
('SJS', 'PT SUMBER JAYA SEJAHTERA')
ON DUPLICATE KEY UPDATE code=code;

-- Master User (hengky / hengky123)
INSERT INTO users (username, password, name, role, status) 
VALUES ('hengky', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGQeL8hE9zqT.XPvBGIJeOa', 'Hengky Master User', 'Master User', 'aktif')
ON DUPLICATE KEY UPDATE username=username;

-- PT Access
INSERT INTO pt_access (user_id, pt_code) VALUES
(1, 'KSS'), (1, 'SJE'), (1, 'FAB'), (1, 'KBS'), (1, 'SJS')
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Pangkalan
INSERT INTO pangkalan (pt, nama) VALUES
('KSS', 'Pangkalan A'), ('KSS', 'Pangkalan B'),
('SJE', 'Pangkalan C'), ('FAB', 'Pangkalan D'),
('KBS', 'Pangkalan E'), ('SJS', 'Pangkalan F')
ON DUPLICATE KEY UPDATE pt=pt;

-- Verify
SELECT '=== INSERT SUCCESS ===' as Status;
SELECT COUNT(*) as Total_Users FROM users;
SELECT COUNT(*) as Total_PT FROM pt_list;
SELECT COUNT(*) as Total_Access FROM pt_access;
SELECT username, name, role FROM users WHERE username='hengky';

