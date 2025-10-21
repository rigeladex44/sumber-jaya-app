#!/bin/bash

# Quick Database Seeding via Railway Database URL
# This connects directly to Railway MySQL and inserts data

echo "🌱 Quick Database Seeding..."
echo ""

# Get Railway MySQL credentials
cd /Users/macbookairi52019/Desktop/sumber-jaya-app/backend

# Use Railway to connect and run SQL
railway run bash -c '
mysql -h $MYSQLHOST -P $MYSQLPORT -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE << "EEOF"

-- Insert PT List
INSERT INTO pt_list (code, name) VALUES
("KSS", "PT KHALISA SALMA SEJAHTERA"),
("SJE", "PT SUMBER JAYA ELPIJI"),
("FAB", "PT FADILLAH AMANAH BERSAMA"),
("KBS", "PT KHABITSA INDOGAS"),
("SJS", "PT SUMBER JAYA SEJAHTERA")
ON DUPLICATE KEY UPDATE code=code;

-- Insert Master User (password: hengky123)
INSERT INTO users (username, password, name, role, status) 
VALUES ("hengky", "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGQeL8hE9zqT.XPvBGIJeOa", "Hengky Master User", "Master User", "aktif")
ON DUPLICATE KEY UPDATE username=username;

-- Insert PT Access
INSERT INTO pt_access (user_id, pt_code) VALUES
(1, "KSS"), (1, "SJE"), (1, "FAB"), (1, "KBS"), (1, "SJS")
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Insert Pangkalan
INSERT INTO pangkalan (pt, nama) VALUES
("KSS", "Pangkalan A"), ("KSS", "Pangkalan B"),
("SJE", "Pangkalan C"), ("FAB", "Pangkalan D"),
("KBS", "Pangkalan E"), ("SJS", "Pangkalan F")
ON DUPLICATE KEY UPDATE pt=pt;

-- Verify
SELECT "✅ Database seeded successfully!" as Status;
SELECT COUNT(*) as Users FROM users;
SELECT COUNT(*) as PT_List FROM pt_list;
SELECT COUNT(*) as PT_Access FROM pt_access;
SELECT COUNT(*) as Pangkalan FROM pangkalan;

EEOF
'

echo ""
echo "🎉 Done! Try logging in with:"
echo "   Username: hengky"
echo "   Password: hengky123"

