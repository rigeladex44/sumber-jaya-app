import React, { useState } from 'react';
import { 
  Home, DollarSign, ShoppingCart, BarChart3, Users, LogOut, 
  Download, Calendar, Plus, AlertCircle, Lock
} from 'lucide-react';

const SumberJayaApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [selectedPT, setSelectedPT] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Data Management State
  const [kasKecilData, setKasKecilData] = useState([
    { id: 1, tanggal: '2025-10-11', pt: 'SJE', jenis: 'masuk', jumlah: 5000000, keterangan: 'Penjualan Tunai Pangkalan Jaya', status: 'approved' },
    { id: 2, tanggal: '2025-10-11', pt: 'SJE', jenis: 'keluar', jumlah: 250000, keterangan: 'Pembelian ATK Kantor', status: 'approved' }
  ]);
  
  const [penjualanData, setPenjualanData] = useState([
    { id: 1, tanggal: '2025-10-11', pt: 'SJE', pangkalan: 'Pangkalan Jaya', qty: 300, harga: 16000, total: 4800000, ppn: 528000, metodeBayar: 'cash' }
  ]);
  
  // Form State
  const [formKas, setFormKas] = useState({
    tanggal: '2025-10-11',
    pt: '',
    jenis: 'keluar',
    jumlah: '',
    keterangan: ''
  });
  
  const [formPenjualan, setFormPenjualan] = useState({
    tanggal: '2025-10-11',
    pt: '',
    pangkalan: '',
    qty: '',
    ppnPercent: 11,
    metodeBayar: 'cash'
  });

  // Hitung Total
  const hitungTotalPenjualan = () => {
    const total = (formPenjualan.qty || 0) * 16000;
    const ppn = total * (formPenjualan.ppnPercent / 100);
    return { total, ppn };
  };

  const hitungSaldoKas = (pt = '') => {
    const filtered = pt ? kasKecilData.filter(k => k.pt === pt) : kasKecilData;
    const masuk = filtered.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + k.jumlah, 0);
    const keluar = filtered.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + k.jumlah, 0);
    return { masuk, keluar, saldo: masuk - keluar };
  };

  const handleSaveKas = () => {
    if (!formKas.pt || !formKas.jumlah || !formKas.keterangan) {
      alert('Mohon lengkapi semua field!');
      return;
    }
    
    const newData = {
      id: Date.now(),
      ...formKas,
      jumlah: parseFloat(formKas.jumlah),
      status: parseFloat(formKas.jumlah) > 300000 ? 'pending' : 'approved'
    };
    
    setKasKecilData([...kasKecilData, newData]);
    setFormKas({ tanggal: '2025-10-11', pt: '', jenis: 'keluar', jumlah: '', keterangan: '' });
    alert('Data kas berhasil disimpan!');
  };

  const handleSavePenjualan = () => {
    if (!formPenjualan.pt || !formPenjualan.pangkalan || !formPenjualan.qty) {
      alert('Mohon lengkapi semua field!');
      return;
    }
    
    const { total, ppn } = hitungTotalPenjualan();
    const newData = {
      id: Date.now(),
      ...formPenjualan,
      qty: parseFloat(formPenjualan.qty),
      harga: 16000,
      total,
      ppn
    };
    
    setPenjualanData([...penjualanData, newData]);
    
    // Jika cash, masuk ke kas kecil
    if (formPenjualan.metodeBayar === 'cash') {
      const kasData = {
        id: Date.now() + 1,
        tanggal: formPenjualan.tanggal,
        pt: formPenjualan.pt,
        jenis: 'masuk',
        jumlah: total,
        keterangan: `Penjualan Tunai ${formPenjualan.pangkalan}`,
        status: 'approved'
      };
      setKasKecilData([...kasKecilData, kasData]);
    }
    
    setFormPenjualan({ tanggal: '2025-10-11', pt: '', pangkalan: '', qty: '', ppnPercent: 11, metodeBayar: 'cash' });
    alert('Data penjualan berhasil disimpan!');
  };

  const ptList = [
    { code: 'KSS', name: 'PT KHALISA SALMA SEJAHTERA' },
    { code: 'SJE', name: 'PT SUMBER JAYA ELPIJI' },
    { code: 'FAB', name: 'PT FADILLAH AMANAH BERSAMA' },
    { code: 'KBS', name: 'PT KHABITSA INDOGAS' },
    { code: 'SJS', name: 'PT SRI JOYO SHAKTI' }
  ];

  const currentUser = {
    username: 'hengky',
    name: 'Hengky',
    role: 'Master User',
    accessPT: ['KSS', 'SJE', 'FAB', 'KBS', 'SJS']
  };

  const mainMenuItems = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'arus-kas', label: 'Kas Kecil', icon: DollarSign },
    { id: 'penjualan', label: 'Penjualan', icon: ShoppingCart },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'master-admin', label: 'Admin', icon: Users }
  ];

  const handleLogin = () => {
    setLoginError('');
    if (username === 'hengky' && password === 'hengky123') {
      setIsLoggedIn(true);
      setActiveMenu('beranda');
    } else {
      setLoginError('Username atau password salah!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
    setActiveMenu('beranda');
  };

  const handleExportPDF = () => {
    const content = document.getElementById('content-to-export');
    const tanggal = new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (content) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Export PDF - Sumber Jaya Grup</title>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                padding: 30px; 
                color: #333;
                line-height: 1.6;
              }
              .header { 
                text-align: center; 
                margin-bottom: 40px; 
                padding-bottom: 20px;
                border-bottom: 3px solid #2563eb;
              }
              .header h1 { 
                color: #1e40af; 
                font-size: 28px;
                margin-bottom: 8px;
                font-weight: bold;
              }
              .header p { 
                color: #64748b; 
                font-size: 14px;
              }
              .info-box {
                background: #f1f5f9;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 30px;
              }
              .info-box p {
                margin: 5px 0;
                font-size: 13px;
              }
              .info-box strong {
                color: #1e40af;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              th { 
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                padding: 12px 8px;
                text-align: left;
                font-size: 13px;
                font-weight: 600;
              }
              td { 
                border: 1px solid #e2e8f0; 
                padding: 10px 8px; 
                font-size: 12px;
              }
              tr:nth-child(even) { 
                background: #f8fafc; 
              }
              tr:hover {
                background: #f1f5f9;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .footer { 
                margin-top: 50px; 
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center; 
                font-size: 11px; 
                color: #64748b;
              }
              .footer p { margin: 5px 0; }
              .status-badge {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
              }
              .status-approved {
                background: #dcfce7;
                color: #16a34a;
              }
              .status-pending {
                background: #fef3c7;
                color: #ca8a04;
              }
              h2 {
                color: #1e40af;
                margin: 30px 0 15px 0;
                font-size: 18px;
                padding-bottom: 8px;
                border-bottom: 2px solid #3b82f6;
              }
              @media print {
                body { padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>SUMBER JAYA GRUP</h1>
              <p>Sistem Manajemen Keuangan</p>
            </div>
            
            <div class="info-box">
              <p><strong>Tanggal Cetak:</strong> ${tanggal}</p>
              <p><strong>Dicetak oleh:</strong> ${currentUser.name} (${currentUser.role})</p>
              <p><strong>PT:</strong> ${selectedPT || 'Semua PT'}</p>
            </div>
            
            ${content.innerHTML}
            
            <div class="footer">
              <p><strong>© 2025 Sumber Jaya Grup</strong></p>
              <p>Dokumen ini dicetak secara otomatis dari sistem</p>
              <p style="margin-top: 10px; font-size: 10px;">Halaman ini adalah salinan resmi - ${tanggal}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Auto print setelah load
      printWindow.onload = function() {
        printWindow.print();
      };
    } else {
      alert('Tidak ada konten untuk di-export');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white text-center">
            <div className="bg-white bg-opacity-20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-2">SUMBER JAYA GRUP</h1>
            <p className="text-blue-100">Sistem Manajemen Keuangan</p>
          </div>
          
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
            
            {loginError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span className="text-sm">{loginError}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan username"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan password"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl"
              >
                Login
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                Demo Login:<br />
                <span className="font-semibold">Username: hengky</span><br />
                <span className="font-semibold">Password: hengky123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderBeranda = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Selamat Datang, {currentUser.name}!</h2>
        <p className="text-blue-100 text-lg">{currentUser.role} - SUMBER JAYA GRUP</p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Sabtu, 11 Oktober 2025</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Kas Harian</p>
            <DollarSign className="text-blue-500" size={28} />
          </div>
          <p className="text-3xl font-bold text-gray-800">Rp 15.5 Jt</p>
          <p className="text-xs text-green-600 mt-2 font-medium">↑ 12% dari kemarin</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Penjualan Hari Ini</p>
            <ShoppingCart className="text-green-500" size={28} />
          </div>
          <p className="text-3xl font-bold text-gray-800">1,250 Tabung</p>
          <p className="text-xs text-gray-500 mt-2">Rp 20.000.000</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <AlertCircle className="text-yellow-500" size={28} />
          </div>
          <p className="text-3xl font-bold text-gray-800">5</p>
          <p className="text-xs text-yellow-600 mt-2 font-medium">Perlu persetujuan</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Laba Bulan Ini</p>
            <BarChart3 className="text-purple-500" size={28} />
          </div>
          <p className="text-3xl font-bold text-gray-800">Rp 165 Jt</p>
          <p className="text-xs text-gray-500 mt-2">Total 5 PT</p>
        </div>
      </div>

      {/* Akses Cepat hanya untuk Mobile */}
      <div className="md:hidden">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Akses Cepat</h3>
        <div className="grid grid-cols-2 gap-4">
          {mainMenuItems.map(item => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all group text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-100 text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all mx-auto">
                  <ItemIcon size={32} />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">{item.label}</h4>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">PT Yang Dapat Diakses</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentUser.accessPT.map(code => {
            const pt = ptList.find(p => p.code === code);
            return (
              <div key={code} className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 hover:border-blue-400 transition-all">
                <p className="font-bold text-gray-800 text-lg">{pt.code}</p>
                <p className="text-xs text-gray-600 mt-1">{pt.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderArusKas = () => (
    <div className="space-y-6" id="content-to-export">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Arus Kas Kecil</h2>
        <div className="flex gap-2 flex-wrap">
          <select 
            value={selectedPT}
            onChange={(e) => setSelectedPT(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih PT</option>
            {currentUser.accessPT.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input type="date" defaultValue="2025-10-11" className="px-4 py-2 border rounded-lg" />
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Saldo Awal</p>
          <p className="text-xl font-bold text-gray-800">Rp 5.000.000</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Total Masuk</p>
          <p className="text-xl font-bold text-green-600">+ Rp 15.000.000</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Total Keluar</p>
          <p className="text-xl font-bold text-red-600">- Rp 4.500.000</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Saldo Akhir</p>
          <p className="text-xl font-bold text-blue-600">Rp 15.500.000</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Input Transaksi Kas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tanggal</label>
            <input 
              type="date" 
              value={formKas.tanggal}
              onChange={(e) => setFormKas({...formKas, tanggal: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">PT</label>
            <select 
              value={formKas.pt}
              onChange={(e) => setFormKas({...formKas, pt: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Pilih PT</option>
              {currentUser.accessPT.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Jenis Transaksi</label>
            <select 
              value={formKas.jenis}
              onChange={(e) => setFormKas({...formKas, jenis: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="keluar">Pengeluaran</option>
              <option value="masuk">Pemasukan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Jumlah (Rp)</label>
            <input 
              type="number" 
              value={formKas.jumlah}
              onChange={(e) => setFormKas({...formKas, jumlah: e.target.value})}
              placeholder="0" 
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Keterangan</label>
            <textarea 
              rows={3} 
              value={formKas.keterangan}
              onChange={(e) => setFormKas({...formKas, keterangan: e.target.value})}
              placeholder="Deskripsi transaksi..." 
              className="w-full px-4 py-2 border rounded-lg"
            ></textarea>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
          <p className="text-sm text-yellow-800">Pengeluaran di atas Rp 300.000 memerlukan approval</p>
        </div>
        <div className="mt-4 flex gap-3">
          <button 
            onClick={handleSaveKas}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Simpan Transaksi
          </button>
          <button 
            onClick={() => setFormKas({ tanggal: '2025-10-11', pt: '', jenis: 'keluar', jumlah: '', keterangan: '' })}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Riwayat Transaksi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">PT</th>
                <th className="px-4 py-3 text-left">Keterangan</th>
                <th className="px-4 py-3 text-right">Masuk</th>
                <th className="px-4 py-3 text-right">Keluar</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {kasKecilData.map(kas => (
                <tr key={kas.id}>
                  <td className="px-4 py-3">{kas.tanggal}</td>
                  <td className="px-4 py-3">{kas.pt}</td>
                  <td className="px-4 py-3">{kas.keterangan}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">
                    {kas.jenis === 'masuk' ? `Rp ${kas.jumlah.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-semibold">
                    {kas.jenis === 'keluar' ? `Rp ${kas.jumlah.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${kas.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {kas.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPenjualan = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Entri Penjualan Gas LPG 3 Kg</h2>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-l-4 border-green-500">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-lg">
            <ShoppingCart className="text-green-600" size={32} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Gas LPG 3 Kg</h3>
            <p className="text-2xl font-bold text-green-600">Rp 16.000 / Tabung</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Form Input Penjualan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tanggal</label>
            <input type="date" defaultValue="2025-10-11" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">PT</label>
            <select className="w-full px-4 py-2 border rounded-lg">
              <option value="">Pilih PT</option>
              {currentUser.accessPT.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pangkalan</label>
            <select className="w-full px-4 py-2 border rounded-lg">
              <option value="">Pilih Pangkalan</option>
              <option>Pangkalan Jaya</option>
              <option>Pangkalan Makmur</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Jumlah Tabung</label>
            <input type="number" placeholder="0" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
            <select className="w-full px-4 py-2 border rounded-lg">
              <option value="cash">Cash (Masuk Kas Kecil)</option>
              <option value="cashless">Cashless (Langsung Laba Rugi)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Total</label>
            <input type="text" value="Rp 0" readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-50 font-bold" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan</button>
          <button className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Reset</button>
        </div>
      </div>
    </div>
  );

  const renderLaporan = () => (
    <div className="space-y-6" id="content-to-export">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Laporan Laba Rugi</h2>
        <div className="flex gap-2 flex-wrap">
          <select 
            value={selectedPT}
            onChange={(e) => setSelectedPT(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Pilih PT</option>
            {currentUser.accessPT.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input type="month" defaultValue="2025-10" className="px-4 py-2 border rounded-lg" />
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Laporan Laba Rugi - Oktober 2025</h3>
        <div className="space-y-4">
          <div className="border-b pb-3">
            <p className="text-sm text-gray-600 mb-2">PENDAPATAN</p>
            <div className="flex justify-between">
              <span>Penjualan Gas LPG</span>
              <span className="font-bold">Rp 200.000.000</span>
            </div>
            <div className="flex justify-between">
              <span>Pendapatan Lain</span>
              <span className="font-bold">Rp 8.000.000</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t">
              <span className="font-bold">Total Pendapatan</span>
              <span className="font-bold text-green-600">Rp 208.000.000</span>
            </div>
          </div>

          <div className="border-b pb-3">
            <p className="text-sm text-gray-600 mb-2">PENGELUARAN</p>
            <div className="flex justify-between">
              <span>Pembelian Stok</span>
              <span className="font-bold">Rp 150.000.000</span>
            </div>
            <div className="flex justify-between">
              <span>Operasional</span>
              <span className="font-bold">Rp 10.000.000</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t">
              <span className="font-bold">Total Pengeluaran</span>
              <span className="font-bold text-red-600">Rp 160.000.000</span>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between text-xl">
              <span className="font-bold">Laba Bersih</span>
              <span className="font-bold text-green-600">Rp 48.000.000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMasterAdmin = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Master Admin</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Daftar User</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Jabatan</th>
                <th className="px-4 py-3 text-left">Akses PT</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3 font-semibold">Hengky</td>
                <td className="px-4 py-3">hengky</td>
                <td className="px-4 py-3">Master User</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Semua PT</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Aktif</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'beranda': return renderBeranda();
      case 'arus-kas': return renderArusKas();
      case 'penjualan': return renderPenjualan();
      case 'laporan': return renderLaporan();
      case 'master-admin': return renderMasterAdmin();
      default: return renderBeranda();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="min-h-screen flex flex-col">
        {/* Header Desktop dengan Akses Cepat */}
        <header className="hidden md:block bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center gap-8">
              {/* Logo & Brand */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  SJ
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">SUMBER JAYA GRUP</h1>
                  <p className="text-xs text-gray-600">Sistem Manajemen Keuangan</p>
                </div>
              </div>

              {/* Akses Cepat Icons */}
              <div className="flex items-center gap-3 flex-1">
                {mainMenuItems.map(item => {
                  const ItemIcon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveMenu(item.id)}
                      className={`relative p-3.5 rounded-2xl transition-all ${
                        isActive 
                          ? 'bg-blue-100 text-blue-600 shadow-md' 
                          : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                      title={item.label}
                    >
                      <ItemIcon size={24} strokeWidth={2.5} />
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-4 ml-auto">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                  <p className="text-xs text-gray-600">{currentUser.role}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold hover:shadow-lg transition-all"
                  >
                    {currentUser.name.charAt(0)}
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                        <p className="text-xs text-gray-600">{currentUser.role}</p>
                        <p className="text-xs text-gray-500 mt-1">@{currentUser.username}</p>
                      </div>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                        <Users size={16} />
                        <span>Edit Profil</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                        <Lock size={16} />
                        <span>Ganti Password</span>
                      </button>
                      <div className="border-t border-gray-200 mt-2"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Header Mobile */}
        <header className="md:hidden bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  SJ
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">SUMBER JAYA GRUP</h1>
                  <p className="text-xs text-gray-600">Sistem Manajemen Keuangan</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold hover:shadow-lg transition-all"
                >
                  {currentUser.name.charAt(0)}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                      <p className="text-xs text-gray-600">{currentUser.role}</p>
                      <p className="text-xs text-gray-500 mt-1">@{currentUser.username}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0">

          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {renderContent()}
          </div>
        </main>

        {/* Bottom Navigation Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="flex justify-around items-center">
            {mainMenuItems.map(item => {
              const ItemIcon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`flex flex-col items-center px-3 py-2 transition-all ${
                    isActive ? 'text-blue-600 scale-110' : 'text-gray-600'
                  }`}
                >
                  <ItemIcon size={24} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SumberJayaApp;