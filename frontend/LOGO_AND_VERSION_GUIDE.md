# Panduan Ganti Logo dan Versi Aplikasi

## Mengganti Logo

### Lokasi File Logo
Logo aplikasi berada di:
```
/frontend/public/images/logo.png
```

### Cara Mengganti Logo
1. Siapkan file logo baru dengan format PNG
2. Pastikan ukuran logo sesuai (rekomendasi: 512x512 pixels untuk kualitas terbaik)
3. Ganti file `logo.png` di folder `/frontend/public/images/` dengan logo baru Anda
4. Logo akan otomatis muncul di:
   - Halaman login
   - Header desktop (kiri atas)
   - Header mobile (kiri atas)
   - Favicon browser

### Format dan Spesifikasi Logo
- Format: PNG (mendukung transparansi)
- Ukuran rekomendasi: 512x512 pixels
- Background: Transparan atau putih
- File size: Usahakan di bawah 100KB untuk performa optimal

## Mengganti Versi Aplikasi

### Lokasi Konfigurasi Versi
Versi aplikasi dikonfigurasi secara terpusat di:
```
/frontend/src/utils/constants.js
```

### Cara Mengganti Versi
1. Buka file `/frontend/src/utils/constants.js`
2. Cari konstanta `APP_VERSION`
3. Ubah nilai versi sesuai kebutuhan

Contoh:
```javascript
/**
 * Application version
 */
export const APP_VERSION = '1.0.0';  // Ubah nilai ini
```

### Dimana Versi Ditampilkan
Versi akan otomatis muncul di:
1. **Halaman Login** - Di bagian footer bawah
2. **Header Desktop** - Di subtitle setelah nama aplikasi
3. **Mobile Navigation Bar** - Di bagian paling bawah dengan teks kecil

### Format Versi
Gunakan format Semantic Versioning (SemVer):
- Format: `MAJOR.MINOR.PATCH`
- Contoh: `1.0.0`, `1.2.3`, `2.0.0`
- MAJOR: Perubahan besar yang tidak kompatibel
- MINOR: Penambahan fitur baru yang kompatibel
- PATCH: Perbaikan bug

## Testing Setelah Perubahan

### 1. Testing Logo
```bash
cd frontend
npm start
```
Pastikan logo muncul dengan baik di:
- [ ] Halaman login
- [ ] Header desktop
- [ ] Header mobile

### 2. Testing Versi
Cek tampilan versi di:
- [ ] Login page (footer)
- [ ] Desktop header (subtitle)
- [ ] Mobile bottom navigation

### 3. Build Production
```bash
cd frontend
npm run build
```

## Troubleshooting

### Logo Tidak Muncul
1. Pastikan nama file adalah `logo.png` (lowercase)
2. Clear browser cache (Ctrl+F5 atau Cmd+Shift+R)
3. Pastikan file ada di `/frontend/public/images/`
4. Cek console browser untuk error

### Versi Tidak Berubah
1. Pastikan sudah save file `constants.js`
2. Restart development server
3. Clear browser cache
4. Pastikan tidak ada typo di nama konstanta

## Catatan Penting
- Selalu backup file logo lama sebelum mengganti
- Test di browser yang berbeda (Chrome, Firefox, Safari)
- Test di mobile device atau menggunakan responsive mode
- Commit perubahan ke git setelah yakin semuanya berfungsi

## Contoh Workflow Lengkap

```bash
# 1. Backup logo lama
cp frontend/public/images/logo.png frontend/public/images/logo-backup.png

# 2. Copy logo baru
cp /path/to/new-logo.png frontend/public/images/logo.png

# 3. Edit versi di constants.js
nano frontend/src/utils/constants.js
# Ubah APP_VERSION = '1.1.0'

# 4. Test aplikasi
cd frontend
npm start

# 5. Build production jika sudah OK
npm run build

# 6. Commit perubahan
git add .
git commit -m "Update logo dan versi aplikasi ke v1.1.0"
git push
```

## Support
Untuk bantuan lebih lanjut, hubungi tim developer atau buat issue di repository GitHub.
