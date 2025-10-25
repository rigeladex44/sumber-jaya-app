# How to Run Migration: Add updated_at Column

## Problem
Error 500 when loading Arus Kas because table `arus_kas` is missing the `updated_at` column.

Backend query tries to SELECT `updated_at` but column doesn't exist:
```sql
SELECT ... updated_at FROM arus_kas  -- ERROR: Unknown column 'updated_at'
```

## Solution
Add the missing `updated_at` column to the table.

---

## 🚀 EASIEST METHOD: Use Auto-Migration Endpoint

After deploying the latest code, access this URL in your browser:

```
https://sumber-jaya-app-production.up.railway.app/api/migrate/add-updated-at
```

Or if using custom domain:
```
https://sje-grup.rigeel.id/api/migrate/add-updated-at
```

**No authentication required** (temporary for migration).

Expected response:
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "changes": "Added column: updated_at"
}
```

After successful migration, **refresh the Arus Kas page** and the error should be gone!

---

## Alternative: Manual SQL (If you have MySQL access)

If you have access to Railway MySQL console or MySQL client:

```sql
ALTER TABLE arus_kas
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

Then verify:
```sql
DESCRIBE arus_kas;
```

You should now see `updated_at` column at the end of the table.

---

## Verification

After migration, the table should have these columns:
1. id
2. tanggal
3. pt_code
4. jenis
5. jumlah
6. keterangan
7. kategori
8. metode_bayar
9. created_by
10. created_at
11. updated_at ← **NEW**

---

## Rollback (If needed)

If something goes wrong:
```sql
ALTER TABLE arus_kas DROP COLUMN updated_at;
```
