# Migration Instructions - Create Arus Kas Table

## Problem
Error 500 when accessing `/api/arus-kas` endpoint because the `arus_kas` table doesn't exist in production database.

## Solution
Run the migration SQL to create the `arus_kas` table in Railway MySQL database.

## Steps to Run Migration on Railway

### Option 1: Using Railway CLI (Recommended)
```bash
# Install Railway CLI if not installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Connect to MySQL database
railway connect MySQL

# Once connected, run the SQL file
source /path/to/migrations/create_arus_kas_table.sql
```

### Option 2: Using Railway Dashboard
1. Go to Railway Dashboard: https://railway.app
2. Select your project: `sumber-jaya-app`
3. Click on your MySQL service
4. Go to "Data" tab
5. Click "Query" or "Connect"
6. Copy and paste the content of `create_arus_kas_table.sql`
7. Execute the SQL

### Option 3: Using MySQL Client
```bash
# Get database credentials from Railway dashboard
# Then connect using mysql client
mysql -h <host> -u <username> -p<password> -D <database>

# Run the migration
source backend/migrations/create_arus_kas_table.sql
```

## Verification
After running the migration, verify the table was created:

```sql
SHOW TABLES LIKE 'arus_kas';
DESCRIBE arus_kas;
```

You should see the `arus_kas` table with the following columns:
- id
- tanggal
- pt_code
- jenis
- jumlah
- keterangan
- kategori
- metode_bayar
- created_by
- created_at
- updated_at

## Testing
After migration, test the endpoint:
```bash
# Should return 200 OK with empty array [] if no data
GET https://sumber-jaya-app-production.up.railway.app/api/arus-kas
```

## Related Files
- Migration SQL: `backend/migrations/create_arus_kas_table.sql`
- Database Schema: `backend/database.sql`
- API Routes: `backend/server.js` (line 813-860)
