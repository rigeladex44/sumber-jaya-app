-- Update feature_access in database
-- Add 'kas-kecil' feature

-- Note: 'arus-kas' feature has been removed from the system

-- Verify the feature access
SELECT u.id, u.username, u.name, GROUP_CONCAT(fa.feature_id) as features
FROM users u
LEFT JOIN feature_access fa ON u.id = fa.user_id
GROUP BY u.id
ORDER BY u.id;

