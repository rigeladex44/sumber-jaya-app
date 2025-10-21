-- FIXED INSERT - Sesuai dengan table structure Railway

-- Clear existing data (optional)
DELETE FROM pt_access WHERE user_id = 1;
DELETE FROM users WHERE username = 'hengky';

-- Insert Master User (NO status column)
INSERT INTO users (username, password, name, role) 
VALUES ('hengky', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGQeL8hE9zqT.XPvBGIJeOa', 'Hengky Master User', 'Master User');

-- PT List already exist, skip

-- Insert PT Access (already success!)
INSERT IGNORE INTO pt_access (user_id, pt_code) VALUES
(1, 'KSS'), (1, 'SJE'), (1, 'FAB'), (1, 'KBS'), (1, 'SJS');

-- Insert Pangkalan (check column names first)
-- Try without 'pt' column
INSERT IGNORE INTO pangkalan (nama) VALUES
('Pangkalan A'), ('Pangkalan B'), ('Pangkalan C'), 
('Pangkalan D'), ('Pangkalan E'), ('Pangkalan F');

-- Verify
SELECT '=== SUCCESS ===' as Status;
SELECT id, username, name, role FROM users WHERE username='hengky';
SELECT COUNT(*) as Total_PT_Access FROM pt_access WHERE user_id=1;

