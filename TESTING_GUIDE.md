# Testing Guide - Sumber Jaya App

## ✅ Pre-Testing Checklist

### 1. Backend Status
- ✅ Backend running on Railway: `https://sumber-jaya-app-production.up.railway.app`
- ✅ Database tables created
- ✅ Health check: `curl https://sumber-jaya-app-production.up.railway.app/api/health`

### 2. Frontend Setup
```bash
cd /Users/macbookairi52019/Desktop/sumber-jaya-app/frontend

# Create .env file for production
echo "REACT_APP_API_URL=https://sumber-jaya-app-production.up.railway.app/api" > .env

# Install dependencies (if needed)
npm install

# Start development server
npm start
```

---

## 🧪 Test Scenarios

### Test #1: Login & Authentication ✅
**Steps:**
1. Navigate to `http://localhost:3000`
2. Login dengan:
   - **Username:** `hengky`
   - **Password:** `hengky123`
3. **Expected:**
   - Loading indicator appears
   - Successfully logged in
   - Dashboard appears with user name "Hengky Master User"
   - Token saved in sessionStorage

**Error Cases to Test:**
- Wrong password → Should show error message
- Empty fields → Browser validation
- Network error → Should show error alert

---

### Test #2: Dashboard Stats 📊
**Steps:**
1. After login, check dashboard
2. Wait for stats to load (loading indicator should appear)
3. **Expected:**
   - Kas Harian: Real data from backend
   - Penjualan Hari Ini: Real qty & nilai
   - Pending Approval: Real count
   - Stats auto-refresh every 30 seconds

---

### Test #3: Kas Kecil CRUD 💰
**Steps:**
1. Navigate to "Kas Kecil" menu
2. **Add Kas Masuk:**
   - Tanggal: Today (auto-filled)
   - PT: KSS
   - Jenis: Masuk
   - Jumlah: 500000
   - Keterangan: "Test Kas Masuk"
   - Click "Simpan Transaksi"
3. **Expected:**
   - Loading indicator on button
   - Success alert
   - Data appears in table
   - Status: Approved (auto-approved)

4. **Add Kas Keluar < 300k:**
   - PT: KSS
   - Jenis: Keluar
   - Jumlah: 200000
   - Keterangan: "Test Kas Keluar"
5. **Expected:**
   - Auto-approved
   - Appears in table immediately

6. **Add Kas Keluar > 300k:**
   - PT: KSS
   - Jenis: Keluar
   - Jumlah: 500000
   - Keterangan: "Test Need Approval"
7. **Expected:**
   - Status: Pending
   - Alert: "Menunggu approval"

---

### Test #4: Approval/Reject (Detail Kas Kecil) ✅❌
**Steps:**
1. Navigate to "Detail Kas Kecil" menu
2. Find pending transaction from Test #3
3. **Approve:**
   - Click "Approve" button
   - Confirm
4. **Expected:**
   - Success alert
   - Status changes to "Approved"
   - Data refreshes

5. **Reject:**
   - Add another >300k transaction
   - Click "Reject"
   - Enter reason
6. **Expected:**
   - Success alert
   - Status changes to "Rejected"

---

### Test #5: Penjualan CRUD 🛒
**Steps:**
1. Navigate to "Penjualan" menu
2. **Add Penjualan (Cash):**
   - Tanggal: Today
   - PT: KSS
   - Pangkalan: Pangkalan A
   - Qty: 100
   - PPN: 11%
   - Metode: Cash
   - Click "Simpan"
3. **Expected:**
   - Loading indicator
   - Success alert
   - Data appears in penjualan table
   - Kas Masuk auto-created in Kas Kecil

4. **Add Penjualan (Tempo):**
   - Same as above, but Metode: Tempo
5. **Expected:**
   - Penjualan saved
   - No kas entry created

---

### Test #6: Session Management ⏰
**Steps:**
1. Login
2. **Test Auto-Logout on Inactivity:**
   - Wait 3 hours without interaction
   - **Expected:** Auto-logout + alert
   
3. **Test Auto-Logout on Tab Close:**
   - Close browser tab
   - Reopen tab
   - **Expected:** Logged out, back to login page

4. **Test Session Persistence:**
   - Login
   - Refresh page (F5)
   - **Expected:** Still logged in

---

### Test #7: Multi-User & RBAC 👥
**Note:** Backend has master user only. This test requires creating additional users in database.

**Test with different users:**
- User dengan akses "kas-kecil" only → Cannot see "Detail Kas"
- User dengan akses "detail-kas" → Can approve/reject
- User dengan specific PT access → Only see data for their PTs

---

### Test #8: Logout 🚪
**Steps:**
1. Click profile menu (top-right)
2. Click "Logout"
3. **Expected:**
   - Logged out immediately
   - Redirected to login page
   - sessionStorage cleared
   - Cannot access protected pages

---

## 🐛 Known Issues / Limitations

1. **User Management**: Edit/Delete users tidak terhubung ke backend (need backend endpoints)
2. **Edit Profile**: Tidak terhubung ke backend (need endpoints)
3. **Change Password**: Tidak terhubung ke backend (need endpoints)
4. **Laporan Export**: PDF generation works, but data is from frontend state (not filtered by date range via API)

---

## 📝 Test Results Log

| Test | Status | Notes |
|------|--------|-------|
| Login | ⏳ Pending | |
| Dashboard Stats | ⏳ Pending | |
| Kas Kecil CRUD | ⏳ Pending | |
| Approval/Reject | ⏳ Pending | |
| Penjualan CRUD | ⏳ Pending | |
| Session Management | ⏳ Pending | |
| Logout | ⏳ Pending | |

---

## 🚀 Ready for Production?

After all tests pass:
- ✅ All core features working
- ✅ Loading states implemented
- ✅ Error handling in place
- ✅ Session management working
- ⚠️ User management requires backend work
- ⚠️ Profile edit requires backend work

**Deployment Status:**
- Backend: ✅ Live on Railway
- Frontend: ⏳ Ready for Vercel

