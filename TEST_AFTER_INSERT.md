# ✅ TEST SETELAH INSERT DATA

Setelah insert data berhasil via `railway connect`, test dengan cara berikut:

## 🧪 Test 1: Login API
```bash
curl -X POST https://sumber-jaya-app-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hengky","password":"hengky123"}'
```

**Expected:** Returns JWT token

---

## 🧪 Test 2: Frontend Login

1. Buka: https://sumber-jaya-8n871iamz-rigeels-projects.vercel.app
2. Login dengan:
   - Username: `hengky`
   - Password: `hengky123`
3. Should work! ✅

---

## 🧪 Test 3: Test All Features

### Dashboard
- ✅ Shows stats (might be 0 if no data yet)

### Master Admin
- ✅ Click "Admin" menu
- ✅ Click "Tambah User"
- ✅ Fill form & submit
- ✅ New user appears in table

### Profile Menu
- ✅ Click profile icon (top right)
- ✅ Click "Edit Profil"
- ✅ Change name
- ✅ Save → Should update

### Change Password
- ✅ Click "Ganti Password"
- ✅ Old: hengky123
- ✅ New: newpass123
- ✅ Save → Logout & login with new password

---

## 🎉 Success Indicators:

- ✅ Can login to frontend
- ✅ Dashboard loads
- ✅ Can add/edit users
- ✅ Can edit profile
- ✅ Can change password
- ✅ All CRUD operations work

---

**If all tests pass, deployment is 100% SUCCESS!** 🚀

