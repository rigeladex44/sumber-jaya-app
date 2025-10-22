-- Update feature_access in database
-- Add 'kas-kecil' and 'arus-kas' features

-- Ensure user ID 1 has the 'arus-kas' feature
INSERT IGNORE INTO feature_access (user_id, feature_id) VALUES (1, 'arus-kas');

-- If you want to add it for other users as well, uncomment and modify:
-- INSERT IGNORE INTO feature_access (user_id, feature_id) VALUES (2, 'arus-kas');
-- INSERT IGNORE INTO feature_access (user_id, feature_id) VALUES (3, 'arus-kas');

-- Verify the feature access
SELECT u.id, u.username, u.name, GROUP_CONCAT(fa.feature_id) as features
FROM users u
LEFT JOIN feature_access fa ON u.id = fa.user_id
GROUP BY u.id
ORDER BY u.id;

