import React, { useState, useEffect } from 'react';
import { 
  Home, DollarSign, ShoppingCart, BarChart3, Users, LogOut, 
  Download, Calendar, Plus, AlertCircle, Lock, X, Eye, EyeOff, TrendingDown, TrendingUp, Search
} from 'lucide-react';
import { 
  authService, 
  kasKecilService, 
  arusKasService,
  penjualanService, 
  dashboardService,
  userService,
  profileService,
  keepAliveService
} from './services/api';

const SumberJayaApp = () => {
  // Cek sessionStorage saat pertama kali load (logout saat close tab)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLogin = sessionStorage.getItem('isLoggedIn');
    return savedLogin === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeMenu, setActiveMenu] = useState('beranda');
  const [selectedPT, setSelectedPT] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(() => {
    const savedUser = sessionStorage.getItem('currentUserData');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [showLaporanPreview, setShowLaporanPreview] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Dashboard Stats State
  const [dashboardStats, setDashboardStats] = useState({
    kasHarian: 0,
    penjualanQty: 0,
    penjualanNilai: 0,
    pendingApproval: 0,
    pengeluaran7Hari: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingKas, setIsLoadingKas] = useState(false);
  const [isLoadingPenjualan, setIsLoadingPenjualan] = useState(false);
  
  // Form Edit Profile
  const [formEditProfile, setFormEditProfile] = useState({
    nama: '',
    jabatan: ''
  });
  
  // Form Change Password
  const [formChangePassword, setFormChangePassword] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Inactivity Timer: Auto-logout setelah 3 jam tidak aktif
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 jam dalam milliseconds
    let inactivityTimer;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Logout
        setIsLoggedIn(false);
        setUsername('');
        setPassword('');
        setLoginError('');
        setActiveMenu('beranda');
        setCurrentUserData(null);
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('currentUserData');
        alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 3 jam. Silakan login kembali.');
      }, INACTIVITY_TIMEOUT);
    };
    
    // Events yang menandakan user aktif
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });
    
    resetTimer(); // Start timer
    
    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [isLoggedIn]);
  
  // Keep-alive timer: Ping server setiap 4 menit untuk mencegah sleep
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000; // 4 menit dalam milliseconds
    let keepAliveTimer;
    
    const pingServer = async () => {
      try {
        const result = await keepAliveService.ping();
        console.log('Keep-alive ping:', result.status);
      } catch (error) {
        console.error('Keep-alive failed:', error);
      }
    };
    
    // Start keep-alive timer
    keepAliveTimer = setInterval(pingServer, KEEP_ALIVE_INTERVAL);
    
    // Ping immediately
    pingServer();
    
    return () => {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
      }
    };
  }, [isLoggedIn]);
  
  // Fetch Dashboard Stats
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const fetchDashboardStats = async () => {
      setIsLoadingStats(true);
      try {
        const data = await dashboardService.getStats();
        setDashboardStats({
          kasHarian: data.kasHarian || 0,
          penjualanQty: data.penjualanQty || 0,
          penjualanNilai: data.penjualanNilai || 0,
          pendingApproval: data.pendingApproval || 0,
          pengeluaran7Hari: data.pengeluaran7Hari || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Keep default values on error
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchDashboardStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn, activeMenu]); // Re-fetch when menu changes
  
  
  // Data Management State
  const [kasKecilData, setKasKecilData] = useState([]);
  const [arusKasData, setArusKasData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [penjualanData, setPenjualanData] = useState([]);
  const [isLoadingArusKas, setIsLoadingArusKas] = useState(false);
  
  // Kas Kecil State (untuk pembukuan kasir tunai - Cash Only)
  const [isLoadingKasKecil, setIsLoadingKasKecil] = useState(false);
  const [formKasKecil, setFormKasKecil] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    pt: '',
    jenis: 'keluar',
    jumlah: '',
    keterangan: '',
    kategori: ''
  });
  const [showEditKasKecilModal, setShowEditKasKecilModal] = useState(false);
  const [editingKasKecil, setEditingKasKecil] = useState(null);
  
  // Load Users from API
  const loadUsers = async () => {
    if (!isLoggedIn) return;
    
    try {
      const data = await userService.getAll();
      setUserList(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };
  
  // Load Kas Kecil Data from API (untuk pembukuan kasir tunai)
  const loadKasKecilData = async (filters = {}) => {
    if (!isLoggedIn) return;
    
    setIsLoadingKasKecil(true);
    try {
      // Auto-transfer saldo kemarin jika belum
      try {
        const transferResult = await kasKecilService.transferSaldo();
        if (transferResult.transferred) {
          console.log(`✅ Saldo ditransfer: ${transferResult.count} PT`);
        }
      } catch (error) {
        console.log('Transfer saldo skip:', error.response?.data?.message || error.message);
      }
      
      // Load data kas kecil
      const data = await kasKecilService.getAll(filters);
      
      console.log('DEBUG Load Kas Kecil Data:', {
        dataCount: data.length,
        sampleData: data.slice(0, 2).map(item => ({
          id: item.id,
          tanggal: item.tanggal,
          tanggalSplit: item.tanggal?.split('T')[0],
          pt: item.pt,
          keterangan: item.keterangan
        })),
        localDate: new Date().toISOString().split('T')[0]
      });
      
      setKasKecilData(data);
    } catch (error) {
      console.error('Error loading kas kecil:', error);
      // Don't alert on load error, just log it
    } finally {
      setIsLoadingKasKecil(false);
    }
  };
  
  // Load Penjualan Data from API
  const loadPenjualanData = async (filters = {}) => {
    if (!isLoggedIn) return;
    
    try {
      const data = await penjualanService.getAll(filters);
      setPenjualanData(data);
    } catch (error) {
      console.error('Error loading penjualan:', error);
    }
  };

  // Load Arus Kas Data from API (Aggregated: Penjualan + Kas Kecil + Manual Arus Kas)
  const loadArusKasData = async (filters = {}) => {
    if (!isLoggedIn) return;
    
    setIsLoadingArusKas(true);
    try {
      const data = await arusKasService.getAll(filters);
      setArusKasData(data);
    } catch (error) {
      console.error('Error loading arus kas:', error);
    } finally {
      setIsLoadingArusKas(false);
    }
  };
  
  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadKasKecilData();
      loadPenjualanData();
      loadArusKasData();
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);
  
  // Helper: Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  // Form State
  const [formKas, setFormKas] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    pt: '',
    jenis: 'keluar',
    jumlah: '',
    keterangan: ''
  });

  const [showEditKasModal, setShowEditKasModal] = useState(false);
  const [editingKas, setEditingKas] = useState(null);

  // Search State
  const [searchDate, setSearchDate] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Filter State for Kas Kecil & Arus Kas (Auto-filter, no manual trigger)
  const [filterKasKecil, setFilterKasKecil] = useState({
    pt: [] // Multi-select for Kas Kecil, no date filter
  });

  const [filterArusKas, setFilterArusKas] = useState({
    pt: '',
    tanggal: new Date().toISOString().split('T')[0] // Default to today
  });

  const [formUser, setFormUser] = useState({
    nama: '',
    username: '',
    password: '',
    jabatan: '',
    fiturAkses: [],
    aksesPT: []
  });
  
  const [formPenjualan, setFormPenjualan] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    pt: '',
    pangkalan: '',
    qty: '',
    harga: 16000, // Harga per tabung
    ppnPercent: 11,
    ppnType: 'include', // 'include' atau 'exclude'
    metodeBayar: 'cash'
  });

  const [formArusKas, setFormArusKas] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    pt: '',
    jenis: 'keluar',
    jumlah: '',
    keterangan: '',
    kategori: ''
  });

  // Hitung Total
  const hitungTotalPenjualan = () => {
    const subtotal = (formPenjualan.qty || 0) * (formPenjualan.harga || 16000);
    const ppn = subtotal * (formPenjualan.ppnPercent / 100);
    
    if (formPenjualan.ppnType === 'include') {
      // PPN sudah termasuk dalam harga
      const total = subtotal;
      const ppnAmount = total * (formPenjualan.ppnPercent / 100);
      const baseAmount = total - ppnAmount;
      return { 
        subtotal: baseAmount, 
        ppn: ppnAmount, 
        total: total,
        displayTotal: total
      };
    } else {
      // PPN ditambahkan ke harga
      const total = subtotal + ppn;
      return { 
        subtotal: subtotal, 
        ppn: ppn, 
        total: total,
        displayTotal: total
      };
    }
  };

  const hitungSaldoKas = (pts = []) => {
    const filtered = pts.length > 0 ? kasKecilData.filter(k => pts.includes(k.pt)) : kasKecilData;
    const masuk = filtered.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + k.jumlah, 0);
    const keluar = filtered.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + k.jumlah, 0);
    return { masuk, keluar, saldo: masuk - keluar };
  };

  const getFilteredKasData = (pts = []) => {
    return pts.length > 0 ? kasKecilData.filter(k => pts.includes(k.pt)) : kasKecilData;
  };

  const handleSaveKas = async () => {
    if (!formKas.pt || !formKas.jumlah || !formKas.keterangan) {
      alert('Mohon lengkapi semua field!');
      return;
    }
    
    setIsLoadingKas(true);
    
    try {
      const kasData = {
        tanggal: formKas.tanggal,
        pt: formKas.pt,
        jenis: formKas.jenis,
      jumlah: parseFloat(formKas.jumlah),
        keterangan: formKas.keterangan
      };
      
      await kasKecilService.create(kasData);
      
      // Refresh data
      await loadKasKecilData();
      
      // Reset form
      setFormKas({ tanggal: getTodayDate(), pt: '', jenis: 'keluar', jumlah: '', keterangan: '' });
      
      const needsApproval = formKas.jenis === 'keluar' && parseFloat(formKas.jumlah) >= 300000;
      if (needsApproval) {
        alert('Data kas berhasil disimpan! Status: Menunggu approval karena pengeluaran >= Rp 300.000');
      } else if (formKas.jenis === 'masuk') {
        alert('Data kas berhasil disimpan! Pemasukan langsung disetujui.');
      } else {
        alert('Data kas berhasil disimpan! Pengeluaran langsung disetujui.');
      }
    } catch (error) {
      console.error('Error saving kas:', error);
      alert('Gagal menyimpan data kas: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingKas(false);
    }
  };

  const handleSaveUser = async () => {
    if (!formUser.nama || !formUser.username || !formUser.password || !formUser.jabatan || !formUser.aksesPT || formUser.aksesPT.length === 0) {
      alert('Mohon lengkapi semua field!');
      return;
    }

    try {
      const userData = {
        username: formUser.username,
        password: formUser.password,
        name: formUser.nama,
        role: formUser.jabatan,
        aksesPT: formUser.aksesPT,
        fiturAkses: formUser.fiturAkses,
      status: 'aktif'
    };

      await userService.create(userData);
      await loadUsers(); // Refresh user list
      
    setFormUser({
      nama: '',
      username: '',
      password: '',
      jabatan: '',
      fiturAkses: [],
      aksesPT: []
    });
    setShowAddUserModal(false);
    alert('User berhasil ditambahkan!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Gagal menambahkan user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handler Edit User (Admin)
  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setFormUser({
      nama: user.name,
      username: user.username,
      password: '', // Don't prefill password for security
      jabatan: user.role,
      fiturAkses: user.fiturAkses || [],
      aksesPT: user.accessPT || []
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!formUser.nama || !formUser.username || !formUser.jabatan || formUser.aksesPT.length === 0) {
      alert('Mohon lengkapi semua field!');
      return;
    }

    try {
      const userData = {
        username: formUser.username,
        name: formUser.nama,
        role: formUser.jabatan,
        aksesPT: formUser.aksesPT,
        fiturAkses: formUser.fiturAkses,
        status: editingUser.status || 'aktif'
      };
      
      // Include password only if changed
      if (formUser.password) {
        userData.password = formUser.password;
      }
      
      await userService.update(editingUser.id, userData);
      await loadUsers(); // Refresh user list
      
      // Update currentUserData jika sedang edit user yang sedang login
      if (currentUserData?.id === editingUser.id) {
        const updatedUser = {
          ...currentUserData,
          name: formUser.nama,
          role: formUser.jabatan,
          accessPT: formUser.aksesPT
        };
        setCurrentUserData(updatedUser);
        sessionStorage.setItem('currentUserData', JSON.stringify(updatedUser));
      }

      setShowEditUserModal(false);
      setEditingUser(null);
      setFormUser({
        nama: '',
        username: '',
        password: '',
        jabatan: '',
        fiturAkses: [],
        aksesPT: []
      });
      alert('User berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Gagal mengupdate user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handler Hapus User
  const handleDeleteUser = async (userId) => {
    if (userId === currentUserData?.id) {
      alert('Anda tidak bisa menghapus user yang sedang login!');
      return;
    }
    
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        await userService.delete(userId);
        await loadUsers(); // Refresh user list
        alert('User berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Gagal menghapus user: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Handler Approve/Reject Kas - Hanya untuk user dengan akses 'detail-kas'
  const handleApproveKas = async (kasId) => {
    if (window.confirm('Approve transaksi ini?')) {
      try {
        await kasKecilService.updateStatus(kasId, 'approved');
        await loadKasKecilData(); // Refresh data
        alert('Transaksi berhasil di-approve!');
      } catch (error) {
        console.error('Error approving kas:', error);
        alert('Gagal approve transaksi: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleRejectKas = async (kasId) => {
    const reason = prompt('Alasan reject:');
    if (reason) {
      try {
        await kasKecilService.updateStatus(kasId, 'rejected');
        await loadKasKecilData(); // Refresh data
        alert('Transaksi berhasil di-reject!');
      } catch (error) {
        console.error('Error rejecting kas:', error);
        alert('Gagal reject transaksi: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleOpenEditKas = (kas) => {
    setEditingKas(kas);
    setFormKas({
      tanggal: kas.tanggal.split('T')[0],
      pt: kas.pt,
      jenis: kas.jenis,
      jumlah: kas.jumlah,
      keterangan: kas.keterangan
    });
    setShowEditKasModal(true);
  };

  const handleUpdateKas = async () => {
    if (!formKas.pt || !formKas.jumlah || !formKas.keterangan) {
      alert('Mohon lengkapi semua field!');
      return;
    }
    
    setIsLoadingKas(true);
    
    try {
      const kasData = {
        tanggal: formKas.tanggal,
        pt: formKas.pt,
        jenis: formKas.jenis,
        jumlah: parseFloat(formKas.jumlah),
        keterangan: formKas.keterangan
      };
      
      await kasKecilService.update(editingKas.id, kasData);
      
      // Refresh data
      await loadKasKecilData();
      
      // Close modal & reset
      setShowEditKasModal(false);
      setEditingKas(null);
      setFormKas({ tanggal: getTodayDate(), pt: '', jenis: 'keluar', jumlah: '', keterangan: '' });
      
      alert('Data kas berhasil diupdate!');
    } catch (error) {
      console.error('Error updating kas:', error);
      alert('Gagal update data kas: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingKas(false);
    }
  };

  const handleDeleteKas = async (kasId, kasKeterangan) => {
    if (window.confirm(`Hapus transaksi: "${kasKeterangan}"?\n\nData yang sudah dihapus tidak dapat dikembalikan!`)) {
      try {
        await kasKecilService.delete(kasId);
        await loadKasKecilData(); // Refresh data
        alert('Transaksi berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting kas:', error);
        alert('Gagal menghapus transaksi: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Search Kas Kecil by Date
  const handleSearchKas = async () => {
    if (!searchDate) {
      alert('Mohon pilih tanggal untuk pencarian!');
      return;
    }

    try {
      const filters = {
        tanggal_dari: searchDate,
        tanggal_sampai: searchDate
      };
      
      const results = await kasKecilService.getAll(filters);
      setSearchResults(results);
      setShowSearchResults(true);
      
      if (results.length === 0) {
        alert(`Tidak ada transaksi pada tanggal ${searchDate}`);
      } else {
        alert(`Ditemukan ${results.length} transaksi pada tanggal ${searchDate}`);
      }
    } catch (error) {
      console.error('Error searching kas:', error);
      alert('Gagal mencari transaksi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCloseSearchResults = () => {
    setShowSearchResults(false);
    setSearchResults([]);
    setSearchDate('');
  };

  // Auto-filter: Get filtered data for Kas Kecil (PT only, no date filter)
  const getFilteredKasKecilData = () => {
    console.log('DEBUG Kas Kecil Filter:', {
      filterPT: filterKasKecil.pt,
      kasKecilData: kasKecilData.slice(0, 3), // First 3 items for debugging
      currentUserAccessPT: currentUserData?.accessPT
    });

    // If no PT selected, show all data
    if (filterKasKecil.pt.length === 0) {
      return kasKecilData;
    }

    // If PT selected, filter by PT only
    const filtered = kasKecilData.filter(item => 
      filterKasKecil.pt.includes(item.pt)
    );

    console.log('DEBUG Filtered Kas Kecil:', filtered);
    return filtered;
  };

  // Auto-filter: Get filtered data for Arus Kas (real-time)
  const getFilteredArusKasData = () => {
    console.log('DEBUG Arus Kas Filter:', {
      filterPT: filterArusKas.pt,
      filterTanggal: filterArusKas.tanggal,
      arusKasData: arusKasData.slice(0, 3), // First 3 items for debugging
      currentUserAccessPT: currentUserData?.accessPT
    });

    // If no PT selected, show all data for selected date
    if (!filterArusKas.pt) {
      return arusKasData.filter(item => {
        const itemDate = item.tanggal.split('T')[0];
        const filterDate = filterArusKas.tanggal;
        return itemDate === filterDate;
      });
    }

    // If PT selected, filter by PT and date
    const filtered = arusKasData.filter(item => {
      const itemDate = item.tanggal.split('T')[0]; // Get YYYY-MM-DD from ISO string
      const filterDate = filterArusKas.tanggal; // Already in YYYY-MM-DD format
      
      console.log('DEBUG Arus Kas Date Comparison:', {
        itemDate,
        filterDate,
        match: itemDate === filterDate,
        itemPT: item.pt,
        filterPT: filterArusKas.pt,
        ptMatch: item.pt === filterArusKas.pt
      });
      
      return item.pt === filterArusKas.pt && itemDate === filterDate;
    });

    console.log('DEBUG Filtered Arus Kas:', filtered);
    return filtered;
  };

  // Handler: Print Kas Kecil
  const handlePrintKasKecil = () => {
    const tanggal = new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const hari = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggalOnly = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    });

    let ptInfo = '';
    if (filterKasKecil.pt.length > 0) {
      ptInfo = filterKasKecil.pt.join(' - ');
    } else {
      ptInfo = 'Semua PT';
    }

    // Get filtered data for PDF
    const displayData = getFilteredKasKecilData();
    
    const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>LAPORAN KAS KECIL - Sumber Jaya Grup</title>
            <meta charset="UTF-8">
            <style>
              @page {
                size: A4;
                margin: 8mm;
              }
              * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
              }
              body { 
                font-family: 'Arial', sans-serif; 
                padding: 15px;
                color: #000;
                line-height: 1.4;
                background: white;
              }
              
              .report-header { 
                text-align: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 3px solid #000;
              }
              .report-title {
                font-size: 18px;
                font-weight: bold;
                letter-spacing: 1px;
                margin-bottom: 4px;
                line-height: 1.1;
              }
              .report-subtitle {
                font-size: 12px;
                color: #333;
                margin-bottom: 2px;
                font-weight: bold;
                line-height: 1.2;
              }
              .report-company {
                font-size: 9px;
                color: #666;
                margin-top: 2px;
              }
              
              .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 12px;
              }
              .info-left, .info-right {
                width: 48%;
              }
              .info-row {
                display: flex;
                padding: 3px 0;
              }
              .info-label {
                width: 100px;
                font-weight: normal;
              }
              .info-value {
                flex: 1;
                font-weight: bold;
              }
              
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 15px 0;
                font-size: 11px;
              }
              th { 
                background: #86ff81 !important;
                color: #000 !important;
                padding: 8px 6px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #ddd;
              }
              th.text-center { text-align: center; }
              th.text-right { text-align: right; }
              td { 
                border: 1px solid #ddd;
                padding: 6px;
                background: white;
              }
              tr:nth-child(even) td { 
                background: #f9f9f9; 
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              
              .grand-total-row {
                background: #86ff81 !important;
                font-weight: bold;
                border-top: 2px solid #000 !important;
                color: #000 !important;
              }
              .grand-total-row td {
                background: #86ff81 !important;
                color: #000 !important;
                font-weight: bold !important;
              }
              
              .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
                font-size: 9px;
              }
              .signature-box {
                width: 30%;
                text-align: center;
              }
              .signature-title {
                font-weight: bold;
                margin-bottom: 5px;
                padding: 5px;
                background: #86ff81;
                color: #000;
              }
              .signature-space {
                height: 60px;
                border: 1px solid #ddd;
                margin: 10px 0;
              }
              .signature-name {
                font-weight: bold;
                padding-top: 5px;
              }
              
              .report-footer { 
                margin-top: 30px; 
                padding-top: 15px;
                border-top: 2px solid #ddd;
                text-align: center; 
                font-size: 8px; 
                color: #888;
                line-height: 1.6;
              }
              
              .report-footer p {
                margin: 3px 0;
              }
              
              .no-print { 
                display: none !important; 
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div class="report-title">LAPORAN KAS KECIL</div>
              <div class="report-subtitle">Transaksi Tunai (Cash) di Kasir</div>
              <div class="report-company">Sistem Sumber Jaya Grup Official</div>
            </div>
            
            <div class="info-section">
              <div class="info-left">
                <div class="info-row">
                  <span class="info-label">Hari</span>
                  <span class="info-value">: ${hari}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tanggal</span>
                  <span class="info-value">: ${tanggalOnly}</span>
                </div>
              </div>
              <div class="info-right">
                <div class="info-row">
                  <span class="info-label">Dicetak Oleh</span>
                  <span class="info-value">: ${currentUserData?.name || 'User'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">PT</span>
                  <span class="info-value">: ${ptInfo}</span>
                </div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th class="text-center">Tanggal</th>
                  <th class="text-center">PT</th>
                  <th class="text-center">Kategori</th>
                  <th class="text-center">Keterangan</th>
                  <th class="text-right">Masuk</th>
                  <th class="text-right">Keluar</th>
                </tr>
              </thead>
              <tbody>
                ${displayData.map(item => `
                  <tr>
                    <td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${item.pt}</td>
                    <td>${item.kategori || '-'}</td>
                    <td>${item.keterangan}</td>
                    <td class="text-right">${item.jenis === 'masuk' ? `Rp ${(item.jumlah || 0).toLocaleString('id-ID')}` : '-'}</td>
                    <td class="text-right">${item.jenis === 'keluar' ? `Rp ${(item.jumlah || 0).toLocaleString('id-ID')}` : '-'}</td>
                  </tr>
                `).join('')}
                <tr class="grand-total-row">
                  <td colspan="4" class="text-center"><strong>Total (Approved)</strong></td>
                  <td class="text-right"><strong>Rp ${displayData.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0).toLocaleString('id-ID')}</strong></td>
                  <td class="text-right"><strong>Rp ${displayData.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0).toLocaleString('id-ID')}</strong></td>
                </tr>
                <tr class="grand-total-row">
                  <td colspan="5" class="text-center"><strong>Saldo Akhir</strong></td>
                  <td class="text-right"><strong>Rp ${(displayData.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0) - displayData.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0)).toLocaleString('id-ID')}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-title">Kasir</div>
                <div class="signature-space"></div>
                <div class="signature-name">${currentUserData?.name || 'User'}</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Manager Keuangan</div>
                <div class="signature-space"></div>
                <div class="signature-name">( _________________ )</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Direktur</div>
                <div class="signature-space"></div>
                <div class="signature-name">( _________________ )</div>
              </div>
            </div>
            
            <div class="report-footer">
              <p><strong>© 2025 Sumber Jaya Grup Official | Powered by Rigeel One Click</strong></p>
              <p>Laporan ini dicetak secara otomatis dari sistem</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
  };

  // Handler: Print Arus Kas
  const handlePrintArusKas = () => {
    const tanggal = new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const hari = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggalOnly = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    });

    let ptInfo = '';
    if (filterArusKas.pt) {
      ptInfo = filterArusKas.pt;
    } else {
      ptInfo = 'Semua PT';
    }

    // Get filtered data for PDF
    const displayData = getFilteredArusKasData();
    
    const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>LAPORAN ARUS KAS - Sumber Jaya Grup</title>
            <meta charset="UTF-8">
            <style>
              @page {
                size: A4;
                margin: 8mm;
              }
              * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
              }
              body { 
                font-family: 'Arial', sans-serif; 
                padding: 15px;
                color: #000;
                line-height: 1.4;
                background: white;
              }
              
              .report-header { 
                text-align: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 3px solid #000;
              }
              .report-title {
                font-size: 18px;
                font-weight: bold;
                letter-spacing: 1px;
                margin-bottom: 4px;
                line-height: 1.1;
              }
              .report-subtitle {
                font-size: 12px;
                color: #333;
                margin-bottom: 2px;
                font-weight: bold;
                line-height: 1.2;
              }
              .report-company {
                font-size: 9px;
                color: #666;
                margin-top: 2px;
              }
              
              .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 12px;
              }
              .info-left, .info-right {
                width: 48%;
              }
              .info-row {
                display: flex;
                padding: 3px 0;
              }
              .info-label {
                width: 100px;
                font-weight: normal;
              }
              .info-value {
                flex: 1;
                font-weight: bold;
              }
              
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 15px 0;
                font-size: 11px;
              }
              th { 
                background: #86ff81 !important;
                color: #000 !important;
                padding: 8px 6px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #ddd;
              }
              th.text-center { text-align: center; }
              th.text-right { text-align: right; }
              td { 
                border: 1px solid #ddd;
                padding: 6px;
                background: white;
              }
              tr:nth-child(even) td { 
                background: #f9f9f9; 
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              
              .grand-total-row {
                background: #86ff81 !important;
                font-weight: bold;
                border-top: 2px solid #000 !important;
                color: #000 !important;
              }
              .grand-total-row td {
                background: #86ff81 !important;
                color: #000 !important;
                font-weight: bold !important;
              }
              
              .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
                font-size: 9px;
              }
              .signature-box {
                width: 30%;
                text-align: center;
              }
              .signature-title {
                font-weight: bold;
                margin-bottom: 5px;
                padding: 5px;
                background: #86ff81;
                color: #000;
              }
              .signature-space {
                height: 60px;
                border: 1px solid #ddd;
                margin: 10px 0;
              }
              .signature-name {
                font-weight: bold;
                padding-top: 5px;
              }
              
              .report-footer { 
                margin-top: 30px; 
                padding-top: 15px;
                border-top: 2px solid #ddd;
                text-align: center; 
                font-size: 8px; 
                color: #888;
                line-height: 1.6;
              }
              
              .report-footer p {
                margin: 3px 0;
              }
              
              .no-print { 
                display: none !important; 
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div class="report-title">LAPORAN ARUS KAS</div>
              <div class="report-subtitle">Arus Kas Komprehensif (Cash + Cashless)</div>
              <div class="report-company">Sistem Sumber Jaya Grup Official</div>
            </div>
            
            <div class="info-section">
              <div class="info-left">
                <div class="info-row">
                  <span class="info-label">Hari</span>
                  <span class="info-value">: ${hari}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tanggal</span>
                  <span class="info-value">: ${tanggalOnly}</span>
                </div>
              </div>
              <div class="info-right">
                <div class="info-row">
                  <span class="info-label">Dicetak Oleh</span>
                  <span class="info-value">: ${currentUserData?.name || 'User'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">PT</span>
                  <span class="info-value">: ${ptInfo}</span>
                </div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th class="text-center">Tanggal</th>
                  <th class="text-center">PT</th>
                  <th class="text-center">Kategori</th>
                  <th class="text-center">Keterangan</th>
                  <th class="text-right">Masuk</th>
                  <th class="text-right">Keluar</th>
                </tr>
              </thead>
              <tbody>
                ${displayData.map(item => `
                  <tr>
                    <td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${item.pt}</td>
                    <td>${item.kategori || '-'}</td>
                    <td>${item.keterangan}</td>
                    <td class="text-right">${item.jenis === 'masuk' ? `Rp ${(item.jumlah || 0).toLocaleString('id-ID')}` : '-'}</td>
                    <td class="text-right">${item.jenis === 'keluar' ? `Rp ${(item.jumlah || 0).toLocaleString('id-ID')}` : '-'}</td>
                  </tr>
                `).join('')}
                <tr class="grand-total-row">
                  <td colspan="4" class="text-center"><strong>Total (Approved)</strong></td>
                  <td class="text-right"><strong>Rp ${displayData.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0).toLocaleString('id-ID')}</strong></td>
                  <td class="text-right"><strong>Rp ${displayData.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0).toLocaleString('id-ID')}</strong></td>
                </tr>
                <tr class="grand-total-row">
                  <td colspan="5" class="text-center"><strong>Saldo Akhir</strong></td>
                  <td class="text-right"><strong>Rp ${(displayData.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0) - displayData.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0)).toLocaleString('id-ID')}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-title">Kasir</div>
                <div class="signature-space"></div>
                <div class="signature-name">${currentUserData?.name || 'User'}</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Manager Keuangan</div>
                <div class="signature-space"></div>
                <div class="signature-name">( _________________ )</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Direktur</div>
                <div class="signature-space"></div>
                <div class="signature-name">( _________________ )</div>
              </div>
            </div>
            
            <div class="report-footer">
              <p><strong>© 2025 Sumber Jaya Grup Official | Powered by Rigeel One Click</strong></p>
              <p>Laporan ini dicetak secara otomatis dari sistem</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
  };

  const handleSavePenjualan = async () => {
    if (!formPenjualan.pt || !formPenjualan.pangkalan || !formPenjualan.qty) {
      alert('Mohon lengkapi semua field!');
      return;
    }
    
    setIsLoadingPenjualan(true);
    
    try {
      const penjualanData = {
        tanggal: formPenjualan.tanggal,
        pt: formPenjualan.pt,
        pangkalan: formPenjualan.pangkalan,
      qty: parseFloat(formPenjualan.qty),
        harga: parseFloat(formPenjualan.harga),
        ppnPercent: parseFloat(formPenjualan.ppnPercent),
        ppnType: formPenjualan.ppnType,
        metodeBayar: formPenjualan.metodeBayar
      };
    
      await penjualanService.create(penjualanData);
    
      // Refresh data
      await loadPenjualanData();
      await loadArusKasData(); // Refresh arus kas since penjualan affects it
      
      // If cash payment, kas kecil will be auto-created by backend
    if (formPenjualan.metodeBayar === 'cash') {
        await loadKasKecilData();
      }
      
      // Reset form
      setFormPenjualan({ tanggal: getTodayDate(), pt: '', pangkalan: '', qty: '', harga: 16000, ppnPercent: 11, ppnType: 'include', metodeBayar: 'cash' });
    alert('Data penjualan berhasil disimpan!');
    } catch (error) {
      console.error('Error saving penjualan:', error);
      alert('Gagal menyimpan data penjualan: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingPenjualan(false);
    }
  };

  // Handler Save Arus Kas Manual Entry
  const handleSaveArusKas = async () => {
    if (!formArusKas.pt || !formArusKas.jumlah || !formArusKas.keterangan || !formArusKas.kategori) {
      alert('Mohon lengkapi semua field!');
      return;
    }
    
    setIsLoadingArusKas(true);
    
    try {
      const arusKasData = {
        tanggal: formArusKas.tanggal,
        pt: formArusKas.pt,
        jenis: formArusKas.jenis,
        jumlah: parseFloat(formArusKas.jumlah),
        keterangan: formArusKas.keterangan,
        kategori: formArusKas.kategori
      };
      
      await arusKasService.create(arusKasData);
      
      // Refresh data
      await loadArusKasData();
      
      // Reset form
      setFormArusKas({ 
        tanggal: new Date().toISOString().split('T')[0], 
        pt: '', 
        jenis: 'keluar', 
        jumlah: '', 
        keterangan: '', 
        kategori: ''
      });
      
      alert('Data arus kas berhasil disimpan!');
    } catch (error) {
      console.error('Error saving arus kas:', error);
      alert('Gagal menyimpan data arus kas: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingArusKas(false);
    }
  };

  // Handler Save Kas Kecil (untuk pembukuan kasir tunai)
  const handleSaveKasKecil = async () => {
    if (!formKasKecil.pt || !formKasKecil.jumlah || !formKasKecil.keterangan || !formKasKecil.kategori) {
      alert('Mohon lengkapi semua field!');
      return;
    }
    
    setIsLoadingKasKecil(true);
    
    try {
      const kasKecilData = {
        tanggal: formKasKecil.tanggal,
        pt: formKasKecil.pt,
        jenis: formKasKecil.jenis,
        jumlah: parseFloat(formKasKecil.jumlah),
        keterangan: formKasKecil.keterangan,
        kategori: formKasKecil.kategori
      };

      console.log('DEBUG Save Kas Kecil:', {
        tanggal: kasKecilData.tanggal,
        localDate: new Date().toISOString().split('T')[0],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      await kasKecilService.create(kasKecilData);
      
      // Refresh data
      await loadKasKecilData();
      
      // Reset form
      setFormKasKecil({ 
        tanggal: new Date().toISOString().split('T')[0], 
        pt: '', 
        jenis: 'keluar', 
        jumlah: '', 
        keterangan: '', 
        kategori: ''
      });
      
      alert('Data kas kecil berhasil disimpan!');
    } catch (error) {
      console.error('Error saving kas kecil:', error);
      alert('Gagal menyimpan data kas kecil: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingKasKecil(false);
    }
  };

  // Handler Delete Kas Kecil (only for today's entries)
  const handleDeleteKasKecil = async (kasKecilId, keterangan) => {
    if (!window.confirm(`Yakin ingin menghapus transaksi "${keterangan}"?`)) return;
    
    setIsLoadingKasKecil(true);
    
    try {
      await kasKecilService.delete(kasKecilId);
      await loadKasKecilData();
      alert('Data kas kecil berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting kas kecil:', error);
      alert('Gagal menghapus data kas kecil: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingKasKecil(false);
    }
  };

  // Handler Update Kas Kecil (only for today's entries)
  const handleUpdateKasKecil = async () => {
    if (!editingKasKecil) return;
    
    if (!formKasKecil.pt || !formKasKecil.jumlah || !formKasKecil.keterangan) {
      alert('Mohon lengkapi semua field!');
      return;
    }
    
    setIsLoadingKasKecil(true);
    
    try {
      const kasKecilData = {
        tanggal: formKasKecil.tanggal,
        pt: formKasKecil.pt,
        jenis: formKasKecil.jenis,
        jumlah: parseFloat(formKasKecil.jumlah),
        keterangan: formKasKecil.keterangan,
        kategori: formKasKecil.kategori
      };
      
      await kasKecilService.update(editingKasKecil.id, kasKecilData);
      
      // Refresh data
      await loadKasKecilData();
      
      // Close modal and reset
      setShowEditKasKecilModal(false);
      setEditingKasKecil(null);
      setFormKasKecil({ 
        tanggal: new Date().toISOString().split('T')[0], 
        pt: '', 
        jenis: 'keluar', 
        jumlah: '', 
        keterangan: '', 
        kategori: ''
      });
      
      alert('Data kas kecil berhasil diupdate!');
    } catch (error) {
      console.error('Error updating kas kecil:', error);
      alert('Gagal mengupdate data kas kecil: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingKasKecil(false);
    }
  };

  // Handler Delete Arus Kas Manual Entry (only for manual entries from today)
  const handleDeleteArusKas = async (arusKasId, keterangan) => {
    if (window.confirm(`Hapus transaksi arus kas: "${keterangan}"?\n\nData yang sudah dihapus tidak dapat dikembalikan!`)) {
      try {
        await arusKasService.delete(arusKasId);
        await loadArusKasData(); // Refresh data
        alert('Transaksi arus kas berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting arus kas:', error);
        alert('Gagal menghapus transaksi: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const ptList = [
    { code: 'KSS', name: 'PT KHALISA SALMA SEJAHTERA' },
    { code: 'SJE', name: 'PT SUMBER JAYA ELPIJI' },
    { code: 'FAB', name: 'PT FADILLAH AMANAH BERSAMA' },
    { code: 'KBS', name: 'PT KHABITSA INDOGAS' },
    { code: 'SJS', name: 'PT SRI JOYO SHAKTI' }
  ];

  // Kategori untuk Arus Kas (cashless transactions)
  const kategoriList = [
    'PENJUALAN',
    'PEMASUKAN LAIN',
    'TRANSPORT FEE',
    'BIAYA OPERASIONAL',
    'BIAYA LAIN-LAIN',
    'BEBAN GAJI KARYAWAN',
    'BEBAN DIMUKA',
    'BIAYA PAJAK & KONSULTAN',
    'BIAYA ANGSURAN',
    'BIAYA SEWA',
    'KASBON KARYAWAN'
  ];

  // Kategori Pengeluaran untuk Kas Kecil (cashless)
  const kategoriPengeluaran = [
    'BIAYA OPERASIONAL',
    'BIAYA LAIN-LAIN',
    'TRANSPORT FEE',
    'BEBAN GAJI KARYAWAN',
    'BEBAN DIMUKA',
    'BIAYA PAJAK & KONSULTAN',
    'BIAYA ANGSURAN',
    'BIAYA SEWA',
    'KASBON KARYAWAN',
    'PEMBELIAN BARANG',
    'MAINTENANCE',
    'KOMUNIKASI'
  ];

  const mainMenuItems = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'kas-kecil', label: 'Kas Kecil', icon: DollarSign },
    { id: 'arus-kas', label: 'Arus Kas', icon: TrendingUp },
    { id: 'detail-kas', label: 'Detail Kas', icon: AlertCircle },
    { id: 'penjualan', label: 'Penjualan', icon: ShoppingCart },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'master-admin', label: 'Admin', icon: Users }
  ];

  const handleLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const data = await authService.login(username, password);
      setIsLoggedIn(true);
      setCurrentUserData(data.user);
      setActiveMenu('beranda');
      setPassword(''); // Clear password for security
      
      // Initialize forms
      setFormKasKecil({
        tanggal: new Date().toISOString().split('T')[0],
        pt: '',
        jenis: 'keluar',
        jumlah: '',
        keterangan: '',
        kategori: ''
      });
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.response?.data?.message || 'Username atau password salah!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
    setActiveMenu('beranda');
    setCurrentUserData(null);
    setShowProfileMenu(false);
  };

  // Handler Edit Profile
  const handleOpenEditProfile = () => {
    setFormEditProfile({
      nama: currentUserData?.name || '',
      jabatan: currentUserData?.role || ''
    });
    setShowEditProfileModal(true);
    setShowProfileMenu(false);
  };

  const handleSaveProfile = async () => {
    if (!formEditProfile.nama || !formEditProfile.jabatan) {
      alert('Mohon lengkapi semua field!');
      return;
    }

    try {
      const data = await profileService.updateProfile({
        name: formEditProfile.nama,
        role: formEditProfile.jabatan
      });
      
      // Update currentUserData
      const updatedUser = {
        ...currentUserData,
        name: formEditProfile.nama,
        role: formEditProfile.jabatan
      };
      
      setCurrentUserData(updatedUser);
      sessionStorage.setItem('currentUserData', JSON.stringify(updatedUser));
      
      setShowEditProfileModal(false);
      alert(data.message || 'Profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal memperbarui profil: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handler Change Password
  const handleOpenChangePassword = () => {
    setFormChangePassword({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowChangePasswordModal(true);
    setShowProfileMenu(false);
  };

  const handleSavePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = formChangePassword;

    // Validasi field kosong
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('Mohon lengkapi semua field!');
      return;
    }

    // Validasi password baru minimal 6 karakter
    if (newPassword.length < 6) {
      alert('Password baru minimal 6 karakter!');
      return;
    }

    // Validasi konfirmasi password
    if (newPassword !== confirmPassword) {
      alert('Password baru dan konfirmasi tidak sama!');
      return;
    }

    try {
      const data = await profileService.changePassword({
        oldPassword,
        newPassword
      });
      
      setShowChangePasswordModal(false);
      setFormChangePassword({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert(data.message || 'Password berhasil diubah!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Gagal mengubah password: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-900">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/background.jpg')",
            filter: 'brightness(0.3)'
          }}
        />
        
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Sumber Jaya</h1>
            <p className="text-gray-300 mb-6">Management System</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {loginError && (
                <div className="text-red-400 text-sm text-center">
                  {loginError}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Login
              </button>
            </form>
            
            <div className="mt-6 text-center text-gray-400 text-sm">
              © 2025 Sumber Jaya Grup Official | Powered by Rigeel One Click
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App Content
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="min-h-screen flex flex-col">
        <header className="hidden md:block bg-white shadow-sm sticky top-0 z-30">
          }}
        />
        
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 text-white text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Sumber Jaya</h1>
            <p className="text-gray-300 mb-6">Management System</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {loginError && (
                <div className="text-red-400 text-sm text-center">
                  {loginError}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Login
              </button>
            </form>
            
            <div className="mt-6 text-center text-gray-400 text-sm">
              © 2025 Sumber Jaya Grup Official | Powered by Rigeel One Click
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App Content
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="min-h-screen flex flex-col">
        <header className="hidden md:block bg-white shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <img 
                  src="/images/logo.png" 
                  alt="Logo" 
                  className="w-12 h-12 object-contain rounded-lg bg-white p-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg items-center justify-center text-white font-bold text-xl shadow-lg hidden">
                  SJ
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SUMBER JAYA GRUP</h1>
                  <p className="text-xs text-gray-600">Sistem Sumber Jaya Grup Official</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-1">
                {mainMenuItems
                  .filter(item => currentUserData?.fiturAkses?.includes(item.id) || currentUserData?.role === 'Master User')
                  .map(item => {
                    const ItemIcon = item.icon;
                    const isActive = activeMenu === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`relative p-3.5 rounded-2xl transition-all ${
                          isActive 
                            ? 'bg-gray-800 text-white shadow-md' 
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
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
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo.png" 
                  alt="Logo" 
                  className="w-12 h-12 object-contain rounded-lg bg-white p-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg items-center justify-center text-white font-bold text-xl shadow-lg hidden">
                  SJ
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">SUMBER JAYA GRUP</h1>
                  <p className="text-xs text-gray-600">Sistem Manajemen Keuangan</p>
                </div>
              </div>

              <button
                onClick={() => setIsLoggedIn(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-white border-t border-gray-200 sticky bottom-0 z-30">
          <div className="px-4 py-2">
            <div className="flex justify-around">
              {(() => {
                const filteredItems = mainMenuItems.filter(item => 
                  currentUserData?.fiturAkses?.includes(item.id) || currentUserData?.role === 'Master User'
                );
                
                // Dynamic icon size based on number of features
                const iconSize = filteredItems.length <= 3 ? 32 : 
                                filteredItems.length <= 5 ? 28 : 24;
                
                return filteredItems.map(item => {
                  const ItemIcon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveMenu(item.id)}
                      className={`flex items-center justify-center p-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-lg scale-110' 
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <ItemIcon size={iconSize} strokeWidth={2.5} />
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SumberJayaApp;
// Force rebuild Thu Oct 23 11:19:42 WIB 2025
