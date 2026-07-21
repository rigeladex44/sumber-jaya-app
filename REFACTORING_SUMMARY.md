# Struktur Project: Sumber Jaya App

> Update terakhir: 21 Juli 2026

## Struktur Frontend (`frontend/src/`)

```
src/
├── App.js                          # Komponen utama — semua state, routing, dan render halaman
├── index.js                        # Entry point React
├── index.css                       # Global CSS (Tailwind reset)
│
├── pages/                          # Halaman-halaman aplikasi
│   ├── Beranda/index.jsx           # Dashboard beranda
│   ├── DetailKas/index.jsx         # Detail Kas Kecil (approve/reject)
│   ├── Laporan/index.jsx           # Laporan Laba Rugi
│   ├── MasterAdmin/index.jsx       # Manajemen user & akses
│   ├── MasterKategori/index.jsx    # Master sub-kategori
│   └── Penjualan/index.jsx         # Input penjualan
│
├── components/
│   └── modals/
│       └── SearchResultsModal.jsx  # Modal hasil pencarian tanggal
│
├── services/
│   └── api.js                      # Semua API calls (axios)
│
└── utils/
    └── constants.js                # Konstanta: PT_LIST, KASIR_GROUPS, APP_VERSION
```

## Struktur Backend (`backend/`)

```
backend/
├── server.js       # Express server + semua API routes (2200+ baris)
├── package.json    # Dependencies
├── .env            # Environment variables (tidak di-commit)
└── migrations/     # File migrasi SQL
```

## Arsitektur Singkat

- **Frontend**: React (CRA), Tailwind CSS, di-host di Vercel
- **Backend**: Node.js + Express + MySQL (mysql2), di-host di Railway
- **Auth**: JWT (24 jam), disimpan di sessionStorage
- **Fitur utama**: Kas Kecil (tunai, multi-PT dengan grup kasir), Arus Kas (cash+cashless), Penjualan, Laporan, Master Admin
- **Kas Kecil**: SJE + KSS + FAB dikonfigurasi sebagai satu grup kasir (saldo fisik gabungan)
- **Approval**: Pengeluaran Kas Kecil ≥ Rp 300.000 butuh approval dari user dengan akses `detail-kas`

## Konfigurasi Penting

| Item | Nilai | Lokasi |
|------|-------|--------|
| Grup Kasir | SJE, KSS, FAB | `utils/constants.js → KASIR_GROUPS` |
| Batas Auto-Approve | Rp 300.000 | `backend/server.js` baris ~595 |
| Connection Pool | max 5 koneksi | `backend/server.js` baris ~65 |
| Health Check DB | setiap 60 detik | `backend/server.js` baris ~2170 |
| Auto-refresh UI | setiap 30 detik | `frontend/src/App.js` |
