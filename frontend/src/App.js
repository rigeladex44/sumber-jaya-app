import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, DollarSign, ShoppingCart, BarChart3, Users, LogOut,
  Download, Plus, AlertCircle, Lock, X, Eye, EyeOff, TrendingDown, TrendingUp, Tags, BookOpen
} from 'lucide-react';
import {
  authService,
  kasKecilService,
  arusKasService,
  penjualanService,
  dashboardService,
  userService,
  profileService,
  keepAliveService,
  subKategoriService
} from './services/api';

// Imported Page Components
import DetailKasPage from './pages/DetailKas';
import MasterKategoriPage from './pages/MasterKategori';
import MasterAdminPage from './pages/MasterAdmin';
import BerandaPage from './pages/Beranda';
import LaporanPage from './pages/Laporan';
import SearchResultsModal from './components/modals/SearchResultsModal';

// Helper: Get today's date in YYYY-MM-DD format (timezone-aware untuk WIB)
const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Convert ISO date string to local YYYY-MM-DD format
// Handles timezone properly - parses ISO string and extracts local date
const getLocalDateFromISO = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [selectedDate, setSelectedDate] = useState(''); // Filter tanggal untuk Arus Kas Komprehensif
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
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
    kasKecilSaldoAkhir: 0,
    kasKecilPemasukanHariIni: 0,
    kasKecilPengeluaranHariIni: 0,
    penjualanQty: 0,
    penjualanNilai: 0,
    pendingApproval: 0
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
  
  // Fetch Dashboard Stats
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchDashboardStats = async () => {
      setIsLoadingStats(true);
      try {
        const data = await dashboardService.getStats();
        setDashboardStats({
          kasKecilSaldoAkhir: data.kasKecilSaldoAkhir || 0,
          kasKecilPemasukanHariIni: data.kasKecilPemasukanHariIni || 0,
          kasKecilPengeluaranHariIni: data.kasKecilPengeluaranHariIni || 0,
          penjualanQty: data.penjualanQty || 0,
          penjualanNilai: data.penjualanNilai || 0,
          pendingApproval: data.pendingApproval || 0
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

  // Keep-Alive Service - Prevent server & database from sleeping
  useEffect(() => {
    if (!isLoggedIn) return;

    console.log('🔄 Keep-alive service: ACTIVATED');

    // Ping immediately on login
    keepAliveService.ping().then(result => {
      console.log('✅ Initial keep-alive ping:', result.status);
    });

    // Auto-ping every 5 minutes to keep server & DB connection alive
    const keepAliveInterval = setInterval(async () => {
      try {
        const result = await keepAliveService.ping();
        console.log('✅ Keep-alive ping successful:', result.status);
      } catch (error) {
        console.error('❌ Keep-alive ping failed:', error.message);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      console.log('⏹️ Keep-alive service: DEACTIVATED');
      clearInterval(keepAliveInterval);
    };
  }, [isLoggedIn]);

  // Auto-refresh for Kas Kecil menu - sync data every 30 seconds
  useEffect(() => {
    if (!isLoggedIn || activeMenu !== 'kas-kecil') return;

    console.log('🔄 Kas Kecil auto-refresh: ACTIVATED (30s interval)');

    // Refresh immediately when entering menu (with loading indicator)
    loadKasKecilData();

    // Then refresh every 30 seconds for real-time collaboration (silent, no popup)
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing Kas Kecil data (silent)...');
      loadKasKecilData({}, true); // silent = true
    }, 30000); // 30 seconds

    return () => {
      console.log('⏹️ Kas Kecil auto-refresh: DEACTIVATED');
      clearInterval(refreshInterval);
    };
    // eslint-disable-next-line no-use-before-define
  }, [isLoggedIn, activeMenu, loadKasKecilData]); // Re-run when menu changes

  // Auto-refresh for Arus Kas menu - sync data every 30 seconds
  useEffect(() => {
    if (!isLoggedIn || activeMenu !== 'arus-kas') return;

    console.log('🔄 Arus Kas auto-refresh: ACTIVATED (30s interval)');

    // Load sub kategori immediately when entering menu
    loadSubKategoriData();

    // Refresh immediately when entering menu (with loading indicator)
    loadArusKasData();

    // Then refresh every 30 seconds for real-time collaboration (silent, no popup)
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing Arus Kas data (silent)...');
      loadArusKasData({}, true); // silent = true
    }, 30000); // 30 seconds

    return () => {
      console.log('⏹️ Arus Kas auto-refresh: DEACTIVATED');
      clearInterval(refreshInterval);
    };
    // eslint-disable-next-line no-use-before-define
  }, [isLoggedIn, activeMenu, loadSubKategoriData, loadArusKasData]); // Re-run when menu changes

  // Auto-refresh for Penjualan menu - sync data every 30 seconds
  useEffect(() => {
    if (!isLoggedIn || activeMenu !== 'penjualan') return;

    console.log('🔄 Penjualan auto-refresh: ACTIVATED (30s interval)');

    // Refresh immediately when entering menu
    loadPenjualanData();

    // Then refresh every 30 seconds for real-time collaboration
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing Penjualan data...');
      loadPenjualanData();
    }, 30000); // 30 seconds

    return () => {
      console.log('⏹️ Penjualan auto-refresh: DEACTIVATED');
      clearInterval(refreshInterval);
    };
    // eslint-disable-next-line no-use-before-define
  }, [isLoggedIn, activeMenu, loadPenjualanData]); // Re-run when menu changes

  // Auto-refresh for Master Kategori menu
  useEffect(() => {
    if (!isLoggedIn || activeMenu !== 'master-kategori') return;

    console.log('🔄 Master Kategori: Loading data...');

    // Load data immediately when entering menu
    loadSubKategoriData();

    return () => {
      console.log('⏹️ Master Kategori: Menu exited');
    };
    // eslint-disable-next-line no-use-before-define
  }, [isLoggedIn, activeMenu, loadSubKategoriData]); // Re-run when menu changes


  // Data Management State
  const [kasKecilData, setKasKecilData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [penjualanData, setPenjualanData] = useState([]);
  
  // Kas Kecil State (untuk pembukuan kasir tunai - Cash Only)
  const [isLoadingKasKecil, setIsLoadingKasKecil] = useState(false);
  const [formKasKecil, setFormKasKecil] = useState({
    tanggal: getLocalDateString(),
    pt: '',
    jenis: 'keluar',
    jumlah: '',
    keterangan: '',
    kategori: ''
  });
  const [showEditKasKecilModal, setShowEditKasKecilModal] = useState(false);
  const [editingKasKecil, setEditingKasKecil] = useState(null);

  // Arus Kas State (Manual Cash Flow - Cash & Cashless)
  const [arusKasData, setArusKasData] = useState([]);
  const [isLoadingArusKas, setIsLoadingArusKas] = useState(false);
  const [filterArusKas, setFilterArusKas] = useState({
    pt: [],  // Array for multi-select
    tanggal: getLocalDateString()  // Default to today for realtime view
  });
  const [formArusKas, setFormArusKas] = useState({
    tanggal: getLocalDateString(),
    pt: '',
    jenis: 'keluar',
    jumlah: '',
    keterangan: '',
    subKategoriId: '',
    metodeBayar: 'cashless'
  });
  const [showEditArusKasModal, setShowEditArusKasModal] = useState(false);
  const [editingArusKas, setEditingArusKas] = useState(null);

  // Sub Kategori State (Master Data for Categories)
  const [subKategoriData, setSubKategoriData] = useState([]);
  const [isLoadingSubKategori, setIsLoadingSubKategori] = useState(false);
  const [showAddSubKategoriModal, setShowAddSubKategoriModal] = useState(false);
  const [showEditSubKategoriModal, setShowEditSubKategoriModal] = useState(false);
  const [editingSubKategori, setEditingSubKategori] = useState(null);
  const [formSubKategori, setFormSubKategori] = useState({
    jenis: 'pengeluaran',
    nama: '',
    urutan: 0
  });

  // Load Users from API
  const loadUsers = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const data = await userService.getAll();
      setUserList(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [isLoggedIn]);

  // Load Sub Kategori Data from API
  const loadSubKategoriData = useCallback(async () => {
    if (!isLoggedIn) return;

    setIsLoadingSubKategori(true);
    try {
      const data = await subKategoriService.getAll();
      setSubKategoriData(data);
    } catch (error) {
      console.error('Error loading sub kategori:', error);
      alert('Gagal memuat data sub kategori!');
    } finally {
      setIsLoadingSubKategori(false);
    }
  }, [isLoggedIn]);

  // Handle Add Sub Kategori
  const handleAddSubKategori = async (e) => {
    e.preventDefault();

    if (!formSubKategori.nama.trim()) {
      alert('Nama sub kategori wajib diisi!');
      return;
    }

    try {
      await subKategoriService.create(formSubKategori);
      alert('Sub kategori berhasil ditambahkan!');
      setFormSubKategori({ jenis: 'pengeluaran', nama: '', urutan: 0 });
      setShowAddSubKategoriModal(false);
      await loadSubKategoriData();
    } catch (error) {
      console.error('Error creating sub kategori:', error);
      alert(error.response?.data?.message || 'Gagal menambahkan sub kategori!');
    }
  };

  // Handle Update Sub Kategori
  const handleUpdateSubKategori = async (e) => {
    e.preventDefault();

    if (!formSubKategori.nama.trim()) {
      alert('Nama sub kategori wajib diisi!');
      return;
    }

    try {
      await subKategoriService.update(editingSubKategori.id, formSubKategori);
      alert('Sub kategori berhasil diupdate!');
      setFormSubKategori({ jenis: 'pengeluaran', nama: '', urutan: 0 });
      setShowEditSubKategoriModal(false);
      setEditingSubKategori(null);
      await loadSubKategoriData();
    } catch (error) {
      console.error('Error updating sub kategori:', error);
      alert(error.response?.data?.message || 'Gagal mengupdate sub kategori!');
    }
  };

  // Handle Delete Sub Kategori
  const handleDeleteSubKategori = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus sub kategori ini?')) {
      return;
    }

    try {
      await subKategoriService.delete(id);
      alert('Sub kategori berhasil dihapus!');
      await loadSubKategoriData();
    } catch (error) {
      console.error('Error deleting sub kategori:', error);
      alert(error.response?.data?.message || 'Gagal menghapus sub kategori!');
    }
  };

  // Load Kas Kecil Data from API (untuk pembukuan kasir tunai)
  const loadKasKecilData = useCallback(async (filters = {}, silent = false) => {
    if (!isLoggedIn) return;

    // Only show loading indicator if not silent refresh
    if (!silent) {
      setIsLoadingKasKecil(true);
    }

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
          tanggalLocal: getLocalDateFromISO(item.tanggal),
          pt: item.pt,
          keterangan: item.keterangan
        })),
        localDate: getLocalDateString(),
        silentRefresh: silent
      });

      setKasKecilData(data);
    } catch (error) {
      console.error('Error loading kas kecil:', error);
      // Don't alert on load error, just log it
    } finally {
      if (!silent) {
        setIsLoadingKasKecil(false);
      }
    }
  }, [isLoggedIn]);
  
  // Load Penjualan Data from API
  const loadPenjualanData = useCallback(async (filters = {}) => {
    if (!isLoggedIn) return;

    try {
      const data = await penjualanService.getAll(filters);
      setPenjualanData(data);
    } catch (error) {
      console.error('Error loading penjualan:', error);
    }
  }, [isLoggedIn]);

  // Load Arus Kas Data from API (Manual Cash Flow - No Approval)
  const loadArusKasData = useCallback(async (filters = {}, silent = false) => {
    if (!isLoggedIn) return;

    // Only show loading indicator if not silent refresh
    if (!silent) {
      setIsLoadingArusKas(true);
    }

    try {
      const data = await arusKasService.getAll(filters);

      console.log('DEBUG Load Arus Kas Data:', {
        dataCount: data.length,
        sampleData: data.slice(0, 2).map(item => ({
          id: item.id,
          tanggal: item.tanggal,
          pt: item.pt,
          kategori: item.kategori,
          metode_bayar: item.metode_bayar
        })),
        silentRefresh: silent
      });

      setArusKasData(data);
    } catch (error) {
      console.error('Error loading arus kas:', error);
    } finally {
      if (!silent) {
        setIsLoadingArusKas(false);
      }
    }
  }, [isLoggedIn]);

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadKasKecilData();
      loadArusKasData();
      loadPenjualanData();
      loadUsers();
    }
  }, [isLoggedIn, loadKasKecilData, loadArusKasData, loadPenjualanData, loadUsers]);

  // Auto set selectedPT to all user's PT when currentUserData changes
  useEffect(() => {
    if (currentUserData?.accessPT && currentUserData.accessPT.length > 0) {
      setSelectedPT(currentUserData.accessPT);
    }
  }, [currentUserData]);

  // Auto show Laporan Laba Rugi when menu "laporan" is opened
  useEffect(() => {
    if (activeMenu === 'laporan') {
      // Reload data Arus Kas dan Sub Kategori untuk memastikan data terbaru
      loadArusKasData();
      loadSubKategoriData();

      if (selectedPT.length > 0) {
        setShowLaporanPreview(true);
      }
    }
  }, [activeMenu, loadArusKasData, loadSubKategoriData, selectedPT.length]);

  // Helper: Get today's date in YYYY-MM-DD format (Asia/Jakarta timezone)
  const getTodayDate = () => {
    return getLocalDateString();
  };
  
  // Form State
  const [formKas, setFormKas] = useState({
    tanggal: getLocalDateString(),
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
    pt: [], // Multi-select for Kas Kecil
    tanggal: getLocalDateString() // Default to today
  });

  // Filter State for Detail Kas (PT and date filters)
  const [filterDetailKas, setFilterDetailKas] = useState({
    tanggal: '' // Empty means show all dates
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
    tanggal: getLocalDateString(),
    pt: '',
    pangkalan: '',
    qty: '',
    harga: 16000, // Harga per tabung
    ppnPercent: 11,
    ppnType: 'include', // 'include' atau 'exclude'
    metodeBayar: 'cash'
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
    let filtered = kasKecilData;

    // Filter by PT if selected
    if (pts.length > 0) {
      filtered = filtered.filter(k => pts.includes(k.pt));
    }

    // Filter by date if selected
    if (filterDetailKas.tanggal) {
      const selectedDate = new Date(filterDetailKas.tanggal + 'T00:00:00');
      filtered = filtered.filter(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        return itemDateOnly.getTime() === selectedDate.getTime();
      });
    }

    return filtered;
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
      // Get transaction data before approving (for syncing Sisa Saldo)
      const transaction = kasKecilData.find(item => item.id === kasId);

      try {
        await kasKecilService.updateStatus(kasId, 'approved');
        await loadKasKecilData(); // Refresh data

        // Auto-sync Sisa Saldo removed - backend transferSaldo handles this automatically
        // if (transaction) {
        //   await syncSisaSaldoForDate(getLocalDateFromISO(transaction.tanggal), transaction.pt);
        //   await loadKasKecilData(); // Reload to get updated Sisa Saldo
        // }

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
      // Get transaction data before rejecting (for syncing Sisa Saldo)
      const transaction = kasKecilData.find(item => item.id === kasId);

      try {
        await kasKecilService.updateStatus(kasId, 'rejected');
        await loadKasKecilData(); // Refresh data

        // Auto-sync Sisa Saldo removed - backend transferSaldo handles this automatically
        // if (transaction) {
        //   await syncSisaSaldoForDate(getLocalDateFromISO(transaction.tanggal), transaction.pt);
        //   await loadKasKecilData(); // Reload to get updated Sisa Saldo
        // }

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
      tanggal: getLocalDateFromISO(kas.tanggal),
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

  // Auto-filter: Get filtered data for Kas Kecil (Harian - tampilkan hari ini saja)
  const getFilteredKasKecilData = () => {
    // Get selected date from filter (defaults to today)
    const selectedDate = filterKasKecil.tanggal || getLocalDateString();
    const selectedDateObj = new Date(selectedDate + 'T00:00:00'); // Parse as local date

    console.log('DEBUG Kas Kecil Filter:', {
      filterPT: filterKasKecil.pt,
      selectedDate: selectedDate,
      kasKecilDataCount: kasKecilData.length,
      sampleData: kasKecilData.slice(0, 3).map(item => ({
        id: item.id,
        tanggal: item.tanggal,
        tanggalParsed: getLocalDateFromISO(item.tanggal),
        pt: item.pt,
        keterangan: item.keterangan.substring(0, 30)
      })),
      currentUserAccessPT: currentUserData?.accessPT
    });

    // Filter data by selected date (berdasarkan tanggal item, bukan created_at)
    const dateFilteredData = kasKecilData.filter(item => {
      if (!item.tanggal) return false;

      // Parse tanggal item (handle both ISO string and date object)
      const itemDate = new Date(item.tanggal);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

      // Compare date only (ignore time)
      return itemDateOnly.getTime() === selectedDateObj.getTime();
    });

    console.log('DEBUG Date Filtered Data:', {
      count: dateFilteredData.length,
      data: dateFilteredData.map(d => ({ pt: d.pt, keterangan: d.keterangan.substring(0, 30) }))
    });

    // If no PT selected, show all data for selected date
    if (filterKasKecil.pt.length === 0) {
      return dateFilteredData;
    }

    // If PT selected, filter by PT
    const filtered = dateFilteredData.filter(item =>
      filterKasKecil.pt.includes(item.pt)
    );

    console.log('DEBUG Filtered Kas Kecil:', {
      filteredCount: filtered.length,
      filteredPT: filterKasKecil.pt
    });

    return filtered;
  };


  // Handler: Print Kas Kecil
  const handlePrintKasKecil = () => {
    console.log('🖨️ TOMBOL PRINT DIKLIK! Starting print process...');

    // Get filtered data for PDF
    const displayData = getFilteredKasKecilData();

    console.log('DEBUG Print Kas Kecil - FULL DETAILS:', {
      totalKasKecilData: kasKecilData.length,
      displayDataLength: displayData.length,
      filterPT: filterKasKecil.pt,
      filterTanggal: filterKasKecil.tanggal,
      sampleData: displayData.slice(0, 3),
      allStatuses: displayData.map(d => d.status)
    });

    // Use selected date from filter (or today as fallback)
    const selectedDate = filterKasKecil.tanggal || getLocalDateString();
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const tanggalOnly = selectedDateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Generate PT Names with separator
    let ptNames = '';
    if (filterKasKecil.pt.length > 0) {
      // Use PT codes directly if no ptList available
      ptNames = filterKasKecil.pt.map(code => {
        const pt = ptList?.find(p => p.code === code);
        return pt ? pt.name : code;
      }).join(' - ');
    } else {
      ptNames = 'Semua PT';
    }

    // Check if data is empty
    if (!displayData || displayData.length === 0) {
      console.error('ERROR: No data to print!', {
        kasKecilData: kasKecilData,
        filterKasKecil: filterKasKecil
      });
      alert('Tidak ada data untuk dicetak. Total data: ' + kasKecilData.length + ', Filter PT: ' + filterKasKecil.pt.join(', '));
      return;
    }

    // Calculate running balance - START FROM YESTERDAY'S "Sisa Saldo" TRANSACTION
    // Find "Sisa Saldo" transaction from yesterday ONLY, not cumulative
    const yesterday = new Date(selectedDateObj);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    // Find "Sisa Saldo" transaction from yesterday
    const sisaSaldoTransactions = kasKecilData.filter(item => {
      if (!item.tanggal) return false;

      // Check if transaction is from yesterday
      const itemDate = new Date(item.tanggal);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      if (itemDateOnly.getTime() !== yesterdayDateOnly.getTime()) return false;

      // Check if it's a "Sisa Saldo" transaction (masuk, approved, keterangan contains "Sisa Saldo")
      if (item.jenis !== 'masuk') return false;
      if (item.status !== 'approved') return false;
      if (!item.keterangan || !item.keterangan.toLowerCase().includes('sisa saldo')) return false;

      // Filter by PT if selected
      if (filterKasKecil.pt.length > 0 && !filterKasKecil.pt.includes(item.pt)) return false;

      return true;
    });

    // Get yesterday's "Sisa Saldo" amount
    const yesterdaySisaSaldo = sisaSaldoTransactions.reduce((sum, item) => sum + (item.jumlah || 0), 0);

    // Start from 0 because "Sisa Saldo" transaction is already in displayData as first transaction
    let runningBalance = 0;

    const dataWithBalance = displayData.map((item, index) => {
      // Only count approved transactions for balance
      if (item.status === 'approved') {
        if (item.jenis === 'masuk') {
          runningBalance += item.jumlah || 0;
        } else if (item.jenis === 'keluar') {
          runningBalance -= item.jumlah || 0;
        }
      }
      return {
        ...item,
        no: index + 1,
        saldo: runningBalance
      };
    });

    // Calculate totals
    const totalMasuk = displayData.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0);
    const totalKeluar = displayData.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0);

    // Saldo Akhir = Total Masuk - Total Keluar (today only)
    const saldoAkhir = totalMasuk - totalKeluar;

    // DEBUG: Alert untuk konfirmasi data sebelum print
    console.log('✅ PRINT START - Data Count:', displayData.length);

    try {
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        alert('Gagal membuka window baru. Mohon izinkan popup di browser Anda.');
        return;
      }

      // Format date for filename (DD-MM-YYYY)
      const filenameDateParts = selectedDate.split('-'); // YYYY-MM-DD
      const filenameDate = `${filenameDateParts[2]}-${filenameDateParts[1]}-${filenameDateParts[0]}`; // DD-MM-YYYY

      // Generate HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Laporan Kas Kecil ${filenameDate}</title>
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
              
              @media print {
                body {
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div class="report-title">LAPORAN KAS KECIL</div>
              <div class="report-subtitle">${ptNames}</div>
              <div class="report-company">Sistem Sumber Jaya Grup Official</div>
            </div>

            <div class="info-section">
              <div class="info-left">
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
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="text-center">No</th>
                  <th class="text-center">Tanggal</th>
                  <th class="text-center">Kategori</th>
                  <th class="text-center">Keterangan</th>
                  <th class="text-right">Masuk</th>
                  <th class="text-right">Keluar</th>
                  <th class="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                ${dataWithBalance && dataWithBalance.length > 0 ? dataWithBalance.map(item => `
                  <tr>
                    <td class="text-center">${item.no}</td>
                    <td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${item.kategori || '-'}</td>
                    <td>${item.keterangan}</td>
                    <td class="text-right">${item.jenis === 'masuk' ? `Rp ${(item.jumlah || 0).toLocaleString('id-ID')}` : '-'}</td>
                    <td class="text-right">${item.jenis === 'keluar' ? `Rp ${(item.jumlah || 0).toLocaleString('id-ID')}` : '-'}</td>
                    <td class="text-right"><strong>Rp ${item.saldo.toLocaleString('id-ID')}</strong></td>
                  </tr>
                `).join('') : '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>'}
                <tr class="grand-total-row">
                  <td colspan="4" class="text-center"><strong>Total Hari Ini (Approved)</strong></td>
                  <td class="text-right"><strong>Rp ${totalMasuk.toLocaleString('id-ID')}</strong></td>
                  <td class="text-right"><strong>Rp ${totalKeluar.toLocaleString('id-ID')}</strong></td>
                  <td class="text-right"><strong>Rp ${saldoAkhir.toLocaleString('id-ID')}</strong></td>
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
      `;

      // Write HTML to new window
      console.log('✅ HTML Content generated, length:', htmlContent.length);
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      console.log('✅ Document written and closed');

      // Wait for content to load before printing
      setTimeout(() => {
        console.log('✅ Triggering print dialog');
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('❌ ERROR in handlePrintKasKecil:', error);
      alert('Error saat generate PDF: ' + error.message + '\n\nSilakan cek console untuk detail.');
    }
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

  // Auto-sync "Sisa Saldo" transaction for a specific date and PT
  const syncSisaSaldoForDate = async (tanggal, ptCode) => {
    try {
      console.log(`🔄 Syncing Sisa Saldo for ${tanggal}, PT: ${ptCode}`);

      // Get all transactions for this date and PT
      const transactionsForDate = kasKecilData.filter(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        const targetDate = new Date(tanggal);
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

        return itemDateOnly.getTime() === targetDateOnly.getTime() &&
               item.pt === ptCode &&
               item.status === 'approved' &&
               !item.keterangan.toLowerCase().includes('sisa saldo'); // Exclude existing Sisa Saldo
      });

      // Calculate saldo akhir for this date
      const masuk = transactionsForDate.filter(k => k.jenis === 'masuk').reduce((sum, k) => sum + (k.jumlah || 0), 0);
      const keluar = transactionsForDate.filter(k => k.jenis === 'keluar').reduce((sum, k) => sum + (k.jumlah || 0), 0);

      // Get saldo awal (from yesterday's Sisa Saldo)
      const targetDateObj = new Date(tanggal + 'T00:00:00');
      const yesterday = new Date(targetDateObj);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

      const yesterdaySisaSaldo = kasKecilData.filter(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        return itemDateOnly.getTime() === yesterdayDateOnly.getTime() &&
               item.pt === ptCode &&
               item.jenis === 'masuk' &&
               item.status === 'approved' &&
               item.keterangan.toLowerCase().includes('sisa saldo');
      }).reduce((sum, item) => sum + (item.jumlah || 0), 0);

      const saldoAkhir = yesterdaySisaSaldo + masuk - keluar;

      console.log(`💰 Calculated Saldo Akhir for ${tanggal}, PT ${ptCode}:`, {
        saldoAwal: yesterdaySisaSaldo,
        masuk,
        keluar,
        saldoAkhir
      });

      // Find existing "Sisa Saldo" transaction for this date
      const existingSisaSaldo = kasKecilData.find(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        const targetDate = new Date(tanggal);
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

        return itemDateOnly.getTime() === targetDateOnly.getTime() &&
               item.pt === ptCode &&
               item.jenis === 'masuk' &&
               item.keterangan.toLowerCase().includes('sisa saldo');
      });

      const keterangan = `Sisa Saldo tanggal ${tanggal}`;

      if (existingSisaSaldo) {
        // Update existing Sisa Saldo transaction
        if (existingSisaSaldo.jumlah !== saldoAkhir) {
          console.log(`📝 Updating Sisa Saldo from ${existingSisaSaldo.jumlah} to ${saldoAkhir}`);
          await kasKecilService.update(existingSisaSaldo.id, {
            tanggal,
            pt: ptCode,
            jenis: 'masuk',
            jumlah: saldoAkhir,
            keterangan,
            kategori: 'SALDO'
          });
        }
      } else {
        // Create new Sisa Saldo transaction
        console.log(`✨ Creating new Sisa Saldo: ${saldoAkhir}`);
        await kasKecilService.create({
          tanggal,
          pt: ptCode,
          jenis: 'masuk',
          jumlah: saldoAkhir,
          keterangan,
          kategori: 'SALDO'
        });
      }

      console.log(`✅ Sisa Saldo synced successfully for ${tanggal}, PT ${ptCode}`);
    } catch (error) {
      console.error(`❌ Error syncing Sisa Saldo for ${tanggal}, PT ${ptCode}:`, error);
      // Don't throw error to prevent blocking the main operation
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
        localDate: getLocalDateString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      await kasKecilService.create(kasKecilData);

      // Refresh data
      await loadKasKecilData();

      // Auto-sync Sisa Saldo removed - backend transferSaldo handles this automatically
      // await syncSisaSaldoForDate(kasKecilData.tanggal, kasKecilData.pt);
      // await loadKasKecilData();

      // Reset form
      setFormKasKecil({ 
        tanggal: getLocalDateString(), 
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

    // Get the transaction data before deleting (for syncing Sisa Saldo)
    const deletedTransaction = kasKecilData.find(item => item.id === kasKecilId);

    setIsLoadingKasKecil(true);

    try {
      await kasKecilService.delete(kasKecilId);
      await loadKasKecilData();

      // Auto-sync Sisa Saldo removed - backend transferSaldo handles this automatically
      // if (deletedTransaction) {
      //   await syncSisaSaldoForDate(getLocalDateFromISO(deletedTransaction.tanggal), deletedTransaction.pt);
      //   await loadKasKecilData(); // Reload to get updated Sisa Saldo
      // }

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

      // Auto-sync Sisa Saldo removed - backend transferSaldo handles this automatically
      // await syncSisaSaldoForDate(kasKecilData.tanggal, kasKecilData.pt);
      // await loadKasKecilData();

      // Close modal and reset
      setShowEditKasKecilModal(false);
      setEditingKasKecil(null);
      setFormKasKecil({ 
        tanggal: getLocalDateString(), 
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

  // ==================== ARUS KAS HANDLERS ====================

  // Handler Save Arus Kas (No Approval)
  const handleSaveArusKas = async () => {
    if (!formArusKas.pt || !formArusKas.jumlah || !formArusKas.keterangan || !formArusKas.subKategoriId) {
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
        subKategoriId: parseInt(formArusKas.subKategoriId),
        metodeBayar: formArusKas.metodeBayar || 'cashless'
      };

      console.log('DEBUG Save Arus Kas:', arusKasData);

      await arusKasService.create(arusKasData);

      // Refresh data (filtering done on frontend)
      await loadArusKasData();

      // Reset form
      setFormArusKas({
        tanggal: getLocalDateString(),
        pt: '',
        jenis: 'keluar',
        jumlah: '',
        keterangan: '',
        subKategoriId: '',
        metodeBayar: 'cashless'
      });

      alert('Data arus kas berhasil disimpan!');
    } catch (error) {
      console.error('Error saving arus kas:', error);
      alert('Gagal menyimpan data arus kas: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingArusKas(false);
    }
  };

  // Handler Delete Arus Kas (No Date Restriction)
  const handleDeleteArusKas = async (arusKasId, keterangan) => {
    if (!window.confirm(`Yakin ingin menghapus transaksi "${keterangan}"?`)) return;

    setIsLoadingArusKas(true);

    try {
      await arusKasService.delete(arusKasId);
      await loadArusKasData();
      alert('Data arus kas berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting arus kas:', error);
      alert('Gagal menghapus data arus kas: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingArusKas(false);
    }
  };

  // Handler Update Arus Kas (No Date Restriction)
  const handleUpdateArusKas = async () => {
    if (!editingArusKas) return;

    if (!formArusKas.pt || !formArusKas.jumlah || !formArusKas.keterangan || !formArusKas.subKategoriId) {
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
        subKategoriId: parseInt(formArusKas.subKategoriId),
        metodeBayar: formArusKas.metodeBayar || 'cashless'
      };

      await arusKasService.update(editingArusKas.id, arusKasData);

      // Refresh data (filtering done on frontend)
      await loadArusKasData();

      // Close modal and reset
      setShowEditArusKasModal(false);
      setEditingArusKas(null);
      setFormArusKas({
        tanggal: getLocalDateString(),
        pt: '',
        jenis: 'keluar',
        jumlah: '',
        keterangan: '',
        subKategoriId: '',
        metodeBayar: 'cashless'
      });

      alert('Data arus kas berhasil diupdate!');
    } catch (error) {
      console.error('Error updating arus kas:', error);
      alert('Gagal mengupdate data arus kas: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingArusKas(false);
    }
  };

  // Get Filtered Arus Kas Data
  const getFilteredArusKasData = () => {
    return arusKasData.filter(item => {
      // Multi-select PT filter (array-based)
      const matchesPT = !filterArusKas.pt || filterArusKas.pt.length === 0 || filterArusKas.pt.includes(item.pt);

      // Daily date filter (exact match)
      const matchesDate = !filterArusKas.tanggal || getLocalDateFromISO(item.tanggal) === filterArusKas.tanggal;

      return matchesPT && matchesDate;
    });
  };

  // Print Arus Kas with Table Format (Like Kas Kecil)
  const handlePrintArusKas = () => {
    console.log('🖨️ TOMBOL PRINT DIKLIK! Starting print process...');

    // Get filtered data for PDF
    const displayData = getFilteredArusKasData();

    console.log('DEBUG Print Arus Kas - FULL DETAILS:', {
      totalArusKasData: arusKasData.length,
      displayDataLength: displayData.length,
      filterPT: filterArusKas.pt,
      sampleData: displayData.slice(0, 3),
      subKategoriData: subKategoriData
    });

    const tanggalOnly = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Generate PT Names with separator
    let ptNames = '';
    if (filterArusKas.pt && filterArusKas.pt.length > 0) {
      ptNames = filterArusKas.pt.map(code => {
        const pt = ptList?.find(p => p.code === code);
        return pt ? pt.name : code;
      }).join(' - ');
    } else {
      ptNames = 'Semua PT';
    }

    // Calculate totals
    const totalMasuk = displayData.filter(k => k.jenis === 'masuk').reduce((sum, k) => sum + (k.jumlah || 0), 0);
    const totalKeluar = displayData.filter(k => k.jenis === 'keluar').reduce((sum, k) => sum + (k.jumlah || 0), 0);
    const saldoAkhir = totalMasuk - totalKeluar;

    // Group data by sub_kategori_id
    const groupedData = {};
    displayData.forEach(item => {
      const subKatId = item.sub_kategori_id || 'uncategorized';
      if (!groupedData[subKatId]) {
        groupedData[subKatId] = [];
      }
      groupedData[subKatId].push(item);
    });

    // Generate rows grouped by kategori
    const generateGroupedRows = (jenis) => {
      const jenisLabel = jenis === 'masuk' ? 'pemasukan' : 'pengeluaran';
      const subKats = subKategoriData.filter(sk => sk.jenis === jenisLabel).sort((a, b) => a.urutan - b.urutan);

      let rows = '';
      let jenisTotal = 0;

      // Kategori Header
      rows += `
        <tr style="background: ${jenis === 'masuk' ? '#d1fae5' : '#fee2e2'}; border: 1px solid #333;">
          <td colspan="3" style="border: 1px solid #333; padding: 6px; font-weight: 700; font-size: 12px; text-transform: uppercase;">
            ${jenis === 'masuk' ? 'PEMASUKAN' : 'PENGELUARAN'}
          </td>
        </tr>
      `;

      // For each sub kategori
      subKats.forEach(subKat => {
        const transactions = groupedData[subKat.id] || [];
        const transactionsFiltered = transactions.filter(t => t.jenis === jenis);
        const subKatTotal = transactionsFiltered.reduce((sum, t) => sum + (t.jumlah || 0), 0);
        jenisTotal += subKatTotal;

        // Sub Kategori Header
        rows += `
          <tr style="background: #f3f4f6; border: 1px solid #333;">
            <td colspan="2" style="border: 1px solid #333; padding: 5px; padding-left: 20px; font-weight: 600; font-size: 10px;">
              ${subKat.nama}
            </td>
            <td style="border: 1px solid #333; padding: 5px; text-align: right; font-weight: 600; font-size: 10px;">
              ${subKatTotal > 0 ? `Rp ${subKatTotal.toLocaleString('id-ID')}` : '-'}
            </td>
          </tr>
        `;

        // Transactions under this sub kategori
        if (transactionsFiltered.length > 0) {
          transactionsFiltered.forEach(item => {
            rows += `
              <tr style="border: 1px solid #333;">
                <td style="border: 1px solid #333; padding: 4px; padding-left: 40px; width: 60%; font-size: 10px;">${item.keterangan}</td>
                <td style="border: 1px solid #333; padding: 2px 4px; width: 19%; text-align: center; font-size: 9px; vertical-align: middle;">
                  <span class="payment-badge ${item.metode_bayar === 'cash' ? 'payment-cash' : 'payment-cashless'}">
                    ${item.metode_bayar === 'cash' ? 'Cash' : 'Cashless'}
                  </span>
                </td>
                <td style="border: 1px solid #333; padding: 4px; text-align: right; width: 21%; font-size: 10px;">
                  Rp ${(item.jumlah || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            `;
          });
        } else {
          // Show empty row if no transactions
          rows += `
            <tr style="border: 1px solid #333;">
              <td colspan="3" style="border: 1px solid #333; padding: 4px; padding-left: 40px; font-style: italic; color: #999; font-size: 9px;">
                (Tidak ada transaksi)
              </td>
            </tr>
          `;
        }
      });

      // Total for this jenis
      rows += `
        <tr style="background: ${jenis === 'masuk' ? '#d1fae5' : '#fee2e2'}; border: 1px solid #333;">
          <td colspan="2" style="border: 1px solid #333; padding: 6px; font-weight: 700; color: #000; text-align: right; font-size: 11px;">
            TOTAL ${jenis === 'masuk' ? 'PEMASUKAN' : 'PENGELUARAN'}
          </td>
          <td style="border: 1px solid #333; padding: 6px; text-align: right; font-weight: 700; color: #000; font-size: 11px;">
            Rp ${jenisTotal.toLocaleString('id-ID')}
          </td>
        </tr>
      `;

      return rows;
    };

    // DEBUG: Alert untuk konfirmasi data sebelum print
    console.log('✅ PRINT START - Data Count:', displayData.length, 'Sub Kategori:', subKategoriData.length);

    try {
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        alert('Gagal membuka window baru. Mohon izinkan popup di browser Anda.');
        return;
      }

      // Generate HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>LAPORAN ARUS KAS - Sumber Jaya Grup</title>
            <meta charset="UTF-8">
            <style>
              @page {
                size: A4;
                margin: 15mm;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Segoe UI', 'Arial', sans-serif;
                padding: 20px;
                color: #1a1a1a;
                line-height: 1.5;
                background: white;
              }

              /* ========== HEADER SECTION ========== */
              .report-header {
                text-align: center;
                margin-bottom: 25px;
                padding: 20px;
                border-radius: 12px;
                color: black;
              }

              .report-title {
                font-size: 24px;
                font-weight: 700;
                letter-spacing: 2px;
                margin-bottom: 8px;
                text-transform: uppercase;
              }
              .report-subtitle {
                font-size: 13px;
                margin-bottom: 5px;
                font-weight: 400;
                opacity: 0.95;
              }

              .report-company {
                font-size: 11px;
                margin-top: 4px;
                opacity: 0.85;
                font-style: italic;
              }

              /* ========== TABLE SECTION ========== */
              .table-container {
                margin: 20px 0;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
              }

              thead {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: black;
              }

              th {
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: 0.5px;
                border: none;
              }

              th.text-center { text-align: center; }
              th.text-right { text-align: right; }

              tbody tr:hover {
                background-color: #f8f9fa;
              }

              tbody tr:nth-child(even) {
                background-color: #fafbfc;
              }

              td {
                padding: 10px 8px;
                border: none;
                color: #2d3748;
              }

              .text-right {
                text-align: right;
                font-family: 'Courier New', monospace;
                font-weight: 500;
              }

              .text-center { text-align: center; }

              /* ========== AMOUNT STYLING ========== */
              .amount-positive {
                color: #059669;
                font-weight: 600;
              }

              .amount-negative {
                color: #dc2626;
                font-weight: 600;
              }

              /* ========== PAYMENT BADGE ========== */
              .payment-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 8px;
                font-size: 8px;
                font-weight: 600;
                text-align: center;
                letter-spacing: 0.2px;
                line-height: 1.2;
              }
              .payment-cash {
                background-color: #fee2e2;
                color: #991b1b;
                border: 1px solid #fca5a5;
              }
              .payment-cashless {
                background-color: #dbeafe;
                color: #1e40af;
                border: 1px solid #93c5fd;
              }

              /* ========== SIGNATURE SECTION ========== */
              .signature-section {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
                gap: 20px;
              }

              .signature-box {
                flex: 1;
                text-align: center;
                padding: 15px;
                background: white;
                border-radius: 8px;
                border: 2px solid #e9ecef;
              }

              .signature-title {
                font-weight: 600;
                margin-bottom: 10px;
                padding: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 6px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .signature-space {
                height: 70px;
                border: 2px dashed #cbd5e0;
                margin: 15px 0;
                border-radius: 6px;
                background: white;
              }

              .signature-name {
                font-weight: 600;
                padding-top: 5px;
                font-size: 11px;
                color: #2d3748;
              }

              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .payment-badge {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .payment-cash {
                  background-color: #fee2e2 !important;
                  color: #991b1b !important;
                  border: 1px solid #fca5a5 !important;
                }
                .payment-cashless {
                  background-color: #dbeafe !important;
                  color: #1e40af !important;
                  border: 1px solid #93c5fd !important;
                }
              }
            </style>
          </head>
          <body>

              <!-- HEADER -->
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">LAPORAN ARUS KAS</div>
                <div style="font-size: 14px; font-weight: 700; color: #000;">${ptNames}</div>
              </div>

              <!-- INFO SECTION -->
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px;">
                <div><strong>Periode:</strong> ${tanggalOnly}</div>
                <div><strong>Dicetak Oleh:</strong> ${currentUserData?.name || 'User'}</div>
              </div>

              <!-- TABLE WITH GROUPED CATEGORIES -->
              <div class="table-container">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #333;">
                  <tbody>
                    ${generateGroupedRows('masuk')}
                    ${generateGroupedRows('keluar')}

                    <!-- GRAND TOTAL -->
                    <tr style="background: #fef08a; border: 1px solid #333;">
                      <td colspan="2" style="border: 1px solid #333; padding: 6px; font-weight: 700; color: #000; text-align: right; font-size: 11px;">
                        SALDO AKHIR
                      </td>
                      <td style="border: 1px solid #333; padding: 6px; text-align: right; font-weight: 700; color: #000; font-size: 11px;">
                        Rp ${saldoAkhir.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- SIGNATURE SECTION -->
              <div style="margin-top: 50px; display: flex; justify-content: space-between; gap: 20px;">
                <div style="flex: 1; text-align: center;">
                  <div style="font-weight: 600; margin-bottom: 10px;">Kasir,</div>
                  <div style="height: 60px;"></div>
                  <div style="border-bottom: 1px solid #333; display: inline-block; min-width: 150px; padding-bottom: 2px;">
                    ${currentUserData?.name || 'User'}
                  </div>
                </div>
                <div style="flex: 1; text-align: center;">
                  <div style="font-weight: 600; margin-bottom: 10px;">Manager Keuangan,</div>
                  <div style="height: 60px;"></div>
                  <div style="border-bottom: 1px solid #333; display: inline-block; min-width: 150px; padding-bottom: 2px;">
                    ( _________________ )
                  </div>
                </div>
                <div style="flex: 1; text-align: center;">
                  <div style="font-weight: 600; margin-bottom: 10px;">Direktur,</div>
                  <div style="height: 60px;"></div>
                  <div style="border-bottom: 1px solid #333; display: inline-block; min-width: 150px; padding-bottom: 2px;">
                    ( _________________ )
                  </div>
                </div>
              </div>
          </body>
        </html>
      `;

      // Write HTML to new window
      console.log('✅ HTML Content generated, length:', htmlContent.length);
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      console.log('✅ Document written and closed');

      // Wait for content to load before printing
      setTimeout(() => {
        console.log('✅ Triggering print dialog');
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('❌ ERROR in handlePrintArusKas:', error);
      alert('Error saat generate PDF: ' + error.message + '\n\nSilakan cek console untuk detail.');
    }
  };

  // ==================== DATA LISTS ====================

  const ptList = [
    { code: 'KSS', name: 'PT KHALISA SALMA SEJAHTERA' },
    { code: 'SJE', name: 'PT SUMBER JAYA ELPIJI' },
    { code: 'FAB', name: 'PT FADILLAH AMANAH BERSAMA' },
    { code: 'KBS', name: 'PT KHABITSA INDOGAS' },
    { code: 'SJS', name: 'PT SRI JOYO SHAKTI' }
  ];

  // Kategori Pengeluaran untuk Kas Kecil
  const kategoriPengeluaran = [
    'BIAYA OPERASIONAL',
    'BIAYA LAIN-LAIN',
    'BEBAN GAJI KARYAWAN',
    'BEBAN DIMUKA',
    'BIAYA SEWA',
    'KASBON KARYAWAN'
    
  ];

  const mainMenuItems = [
    { id: 'beranda', label: 'Beranda', shortLabel: 'Beranda', icon: Home },
    { id: 'kas-kecil', label: 'Kas Kecil', shortLabel: 'Kas', icon: BookOpen },
    { id: 'arus-kas', label: 'Arus Kas', shortLabel: 'Arus', icon: TrendingUp },
    { id: 'detail-kas', label: 'Detail Kas', shortLabel: 'Detail', icon: AlertCircle },
    { id: 'penjualan', label: 'Penjualan', shortLabel: 'Jual', icon: ShoppingCart },
    { id: 'laporan', label: 'Laporan', shortLabel: 'Laporan', icon: BarChart3 },
    { id: 'master-kategori', label: 'Master Kategori', shortLabel: 'Kategori', icon: Tags },
    { id: 'master-admin', label: 'Admin', shortLabel: 'Admin', icon: Users }
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
        tanggal: getLocalDateString(),
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

  const handleExportPDF = (type = 'kas') => {
    const content = document.getElementById('content-to-export');
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

    const monthYear = selectedMonth.split('-');
    const bulanNama = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long' });
    const tahun = monthYear[0];

    // Get filtered data for export
    const displayData = getFilteredKasKecilData();

    let headerTitle = '';
    let headerSubtitle = '';
    let ptInfo = '';

    if (type === 'kas') {
      headerTitle = 'LAPORAN KAS KECIL';

      // Get full PT names for subtitle
      const selectedPTNames = selectedPT.length > 0
        ? selectedPT.map(code => {
            const pt = ptList.find(p => p.code === code);
            return pt ? pt.name : code;
          }).join(' - ')
        : ptList.map(p => p.name).join(' - ');

      headerSubtitle = selectedPTNames; // PT names for display below title
      ptInfo = selectedPT.length > 0 ? selectedPT.join(' - ') : 'Semua PT'; // PT codes
    } else if (type === 'labarugi') {
      headerTitle = 'LAPORAN LABA RUGI';

      // Nama PT lengkap untuk laba rugi
      let ptNamesForLabaRugi = '';
      if (selectedPT.length > 0) {
        ptNamesForLabaRugi = selectedPT.map(code => {
          const pt = ptList.find(p => p.code === code);
          return pt ? pt.name : code;
        }).join(' - ');
        ptInfo = selectedPT.join(', ');
      } else {
        ptNamesForLabaRugi = 'Semua PT';
        ptInfo = 'Semua PT';
      }

      headerSubtitle = `${ptNamesForLabaRugi}`;
    }

    // Generate Laba Rugi data for PDF
    let labaRugiContent = '';
    if (type === 'labarugi') {
      // Hitung data Laba Rugi
      const [year, month] = selectedMonth.split('-');
      const arusKasFiltered = arusKasData.filter(item => {
        if (!selectedPT.includes(item.pt)) return false;
        const itemDate = new Date(item.tanggal);
        return itemDate.getFullYear() === parseInt(year) &&
               (itemDate.getMonth() + 1) === parseInt(month);
      });

      const pemasukanPerSubKategori = [];
      const pengeluaranPerSubKategori = [];
      const subKatIdsSet = new Set(arusKasFiltered.map(item => item.sub_kategori_id).filter(id => id));

      subKatIdsSet.forEach(subKatId => {
        const subKat = subKategoriData.find(sk => sk.id === subKatId);
        if (!subKat) return;

        const itemsForSubKat = arusKasFiltered.filter(item => item.sub_kategori_id === subKatId);
        const total = itemsForSubKat.reduce((sum, item) => sum + (item.jumlah || 0), 0);

        const subKatData = {
          id: subKat.id,
          nama: subKat.nama,
          total: total,
          urutan: subKat.urutan
        };

        if (subKat.jenis === 'pemasukan') {
          pemasukanPerSubKategori.push(subKatData);
        } else if (subKat.jenis === 'pengeluaran') {
          pengeluaranPerSubKategori.push(subKatData);
        }
      });

      pemasukanPerSubKategori.sort((a, b) => a.urutan - b.urutan);
      pengeluaranPerSubKategori.sort((a, b) => a.urutan - b.urutan);

      const totalPendapatan = pemasukanPerSubKategori.reduce((sum, item) => sum + item.total, 0);
      const totalPengeluaran = pengeluaranPerSubKategori.reduce((sum, item) => sum + item.total, 0);
      const labaBersih = totalPendapatan - totalPengeluaran;

      // Generate HTML untuk Laba Rugi
      labaRugiContent = `
        <div style="margin-bottom: 20px;">
          <div style="background: #16a34a; padding: 8px 12px; margin-bottom: 0;">
            <h3 style="color: white; font-weight: bold; font-size: 11px; margin: 0; text-transform: uppercase;">Pendapatan (Pemasukan)</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 0;">
            <tbody>
              ${pemasukanPerSubKategori.length > 0 ? pemasukanPerSubKategori.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#fff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 6px 12px; font-size: 9px; color: #374151;">${item.nama}</td>
                  <td style="padding: 6px 12px; text-align: right; font-weight: 600; font-size: 9px; color: #15803d;">Rp ${item.total.toLocaleString('id-ID')}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="2" style="padding: 6px 12px; text-align: center; font-size: 9px; color: #9ca3af; font-style: italic;">Tidak ada data pemasukan</td>
                </tr>
              `}
              <tr style="background: #dcfce7; border-top: 2px solid #16a34a;">
                <td style="padding: 8px 12px; font-weight: bold; font-size: 10px; color: #1f2937;">TOTAL PENDAPATAN</td>
                <td style="padding: 8px 12px; text-align: right; font-weight: bold; font-size: 11px; color: #15803d;">Rp ${totalPendapatan.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="background: #dc2626; padding: 8px 12px; margin-bottom: 0;">
            <h3 style="color: white; font-weight: bold; font-size: 11px; margin: 0; text-transform: uppercase;">Pengeluaran</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 0;">
            <tbody>
              ${pengeluaranPerSubKategori.length > 0 ? pengeluaranPerSubKategori.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#fff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 6px 12px; font-size: 9px; color: #374151;">${item.nama}</td>
                  <td style="padding: 6px 12px; text-align: right; font-weight: 600; font-size: 9px; color: #b91c1c;">Rp ${item.total.toLocaleString('id-ID')}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="2" style="padding: 6px 12px; text-align: center; font-size: 9px; color: #9ca3af; font-style: italic;">Tidak ada data pengeluaran</td>
                </tr>
              `}
              <tr style="background: #fee2e2; border-top: 2px solid #dc2626;">
                <td style="padding: 8px 12px; font-weight: bold; font-size: 10px; color: #1f2937;">TOTAL PENGELUARAN</td>
                <td style="padding: 8px 12px; text-align: right; font-weight: bold; font-size: 11px; color: #b91c1c;">Rp ${totalPengeluaran.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin: 20px 12px; border: 3px solid ${labaBersih >= 0 ? '#22c55e' : '#ef4444'}; border-radius: 6px; padding: 12px; background: ${labaBersih >= 0 ? '#f0fdf4' : '#fef2f2'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; font-size: 12px; color: #1f2937;">${labaBersih >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}</span>
            <span style="font-weight: bold; font-size: 16px; color: ${labaBersih >= 0 ? '#15803d' : '#b91c1c'};">Rp ${Math.abs(labaBersih).toLocaleString('id-ID')}</span>
          </div>
        </div>
      `;
    }

    if (content) {
      const printWindow = window.open('', '_blank');

      // Format date for filename
      let filenameDate = '';
      if (type === 'kas') {
        // For Kas Kecil: use DD-MM-YYYY format
        const todayDate = new Date();
        const day = String(todayDate.getDate()).padStart(2, '0');
        const month = String(todayDate.getMonth() + 1).padStart(2, '0');
        const year = todayDate.getFullYear();
        filenameDate = `${day}-${month}-${year}`;
      } else if (type === 'labarugi') {
        // For Laba Rugi: use MM-YYYY format
        const [year, month] = selectedMonth.split('-');
        filenameDate = `${month}-${year}`;
      }

      // Untuk Laporan Laba Rugi, tidak ada tanda tangan
      const signatureSection = type === 'kas' ? `
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
      ` : '';

      const documentTitle = type === 'kas'
        ? `Laporan Kas Kecil ${filenameDate}`
        : `Laporan Laba Rugi ${filenameDate}`;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${documentTitle}</title>
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
                margin-bottom: ${type === 'labarugi' ? '35px' : '25px'};
                padding-bottom: ${type === 'labarugi' ? '8px' : '15px'};
                border-bottom: ${type === 'labarugi' ? '4px' : '3px'} solid #000;
              }
              .report-title {
                font-size: ${type === 'labarugi' ? '17px' : '18px'};
                font-weight: bold;
                letter-spacing: ${type === 'labarugi' ? '1.5px' : '1px'};
                margin-bottom: ${type === 'labarugi' ? '3px' : '8px'};
                line-height: 1.2;
              }
              .report-subtitle {
                font-size: ${type === 'labarugi' ? '12px' : '14px'};
                color: #000;
                margin-bottom: ${type === 'labarugi' ? '2px' : '10px'};
                font-weight: bold;
                line-height: 1.3;
              }
              .report-period {
                font-size: 11px;
                color: #000;
                margin-top: 5px;
                font-weight: normal;
                line-height: 1.3;
              }
              .report-company {
                font-size: 9px;
                color: #666;
                margin-top: 2px;
              }
              
              .info-section {
                display: flex;
                justify-content: flex-start;
                gap: 40px;
                margin-bottom: 15px;
                font-size: 11px;
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
                margin-top: ${type === 'labarugi' ? '60px' : '30px'}; 
                padding-top: ${type === 'labarugi' ? '15px' : '15px'};
                border-top: ${type === 'labarugi' ? '1px' : '2px'} solid ${type === 'labarugi' ? '#bbb' : '#ddd'};
                text-align: center; 
                font-size: ${type === 'labarugi' ? '7px' : '8px'}; 
                color: #888;
                line-height: ${type === 'labarugi' ? '1.8' : '1.6'};
              }
              
              .report-footer p {
                margin: ${type === 'labarugi' ? '4px 0' : '3px 0'};
              }
              
              .no-print {
                display: table-cell;
              }
              
              /* Styling khusus untuk Laba Rugi */
              .labarugi-section {
                margin-bottom: 35px;
              }
              
              .labarugi-title {
                font-size: 10px;
                font-weight: 600;
                color: #555;
                letter-spacing: 0.8px;
                margin-bottom: 15px;
              }
              
              .labarugi-item {
                display: table;
                width: 100%;
                padding: 6px 0;
                font-size: 11px;
              }
              
              .labarugi-item-label {
                display: table-cell;
                color: #333;
                width: 60%;
              }
              
              .labarugi-item-value {
                display: table-cell;
                font-weight: 600;
                color: #000;
                text-align: right;
                width: 40%;
                white-space: nowrap;
              }
              
              .labarugi-total {
                display: table;
                width: 100%;
                padding: 12px 0 8px 0;
                margin-top: 10px;
                border-top: 2px solid #999;
                font-weight: bold;
                font-size: 11px;
              }
              
              .labarugi-total-label {
                display: table-cell;
                font-weight: bold;
                color: #000;
                width: 60%;
              }
              
              .labarugi-total-value {
                display: table-cell;
                font-size: 12px;
                text-align: right;
                width: 40%;
                font-weight: bold;
                white-space: nowrap;
              }
              
              .labarugi-nett {
                background: #e6f9e6;
                border: 2px solid #a8e6a8;
                border-radius: 6px;
                padding: 15px 20px;
                margin-top: 35px;
                display: table;
                width: 100%;
              }
              
              .labarugi-nett-label {
                display: table-cell;
                font-weight: bold;
                font-size: 12px;
                color: #000;
                width: 60%;
              }
              
              .labarugi-nett-value {
                display: table-cell;
                font-weight: bold;
                font-size: 15px;
                color: #2d8659;
                text-align: right;
                width: 40%;
                white-space: nowrap;
              }
              
              @media print {
                body { 
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print { 
                  display: none !important; 
                }
                .no-print-row {
                  display: none !important;
                }
                .labarugi-nett {
                  background: #e6f9e6 !important;
                  border: 2px solid #a8e6a8 !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <div class="report-title">${headerTitle}</div>
              <div class="report-subtitle">${headerSubtitle}</div>
              ${type === 'labarugi' ? `<div class="report-period">Periode ${bulanNama} ${tahun}</div>` : ''}
            </div>

            ${type === 'kas' ? `
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Periode</span>
                <span class="info-value">: ${bulanNama} ${tahun}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Dicetak Oleh</span>
                <span class="info-value">: ${currentUserData?.name || 'User'}</span>
              </div>
            </div>
            ` : ''}

            ${type === 'kas' ? `
            <table>
              <thead>
                <tr>
                  <th class="text-center" style="color: #000; font-weight: bold;">No</th>
                  <th style="color: #000; font-weight: bold;">Keterangan</th>
                  <th class="text-right" style="color: #000; font-weight: bold;">Masuk</th>
                  <th class="text-right" style="color: #000; font-weight: bold;">Keluar</th>
                  <th class="text-right" style="color: #000; font-weight: bold;">Saldo</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  let saldo = 0;
                  return displayData.map((item, index) => {
                    const masuk = item.jenis === 'masuk' && item.status === 'approved' ? (item.jumlah || 0) : 0;
                    const keluar = item.jenis === 'keluar' && item.status === 'approved' ? (item.jumlah || 0) : 0;
                    saldo = saldo + masuk - keluar;
                    return `
                      <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>${item.keterangan}</td>
                        <td class="text-right">${masuk > 0 ? `Rp ${masuk.toLocaleString('id-ID')}` : '-'}</td>
                        <td class="text-right">${keluar > 0 ? `Rp ${keluar.toLocaleString('id-ID')}` : '-'}</td>
                        <td class="text-right">Rp ${saldo.toLocaleString('id-ID')}</td>
                      </tr>
                    `;
                  }).join('');
                })()}
              </tbody>
            </table>
            ` : labaRugiContent}

            ${signatureSection}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      printWindow.onload = function() {
        printWindow.print();
      };
    } else {
      alert('Tidak ada konten untuk di-export');
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
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="bg-white bg-opacity-20 w-20 h-20 rounded-full items-center justify-center hidden">
                <Lock size={40} />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">SUMBER JAYA GRUP</h1>
            <p className="text-gray-300">Sistem Sumber Jaya Grup Official</p>
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
                <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan password"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className={`w-full py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl ${
                  isLoggingIn 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900'
                }`}
              >
                {isLoggingIn ? 'Loading...' : 'Login'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-gray-600 text-center">
                © 2025 Sumber Jaya Grup Official | Powered by Rigeel One Click
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderBeranda = () => {
    return (
      <BerandaPage
        currentUserData={currentUserData}
        dashboardStats={dashboardStats}
        isLoadingStats={isLoadingStats}
        kasKecilData={kasKecilData}
        penjualanData={penjualanData}
        arusKasData={arusKasData}
        onSetActiveMenu={setActiveMenu}
        onApprove={handleApproveKas}
        onReject={handleRejectKas}
      />
    );
  };


  // Search Results Modal
  const renderSearchResults = () => {
    return (
      <SearchResultsModal
        showSearchResults={showSearchResults}
        searchResults={searchResults}
        searchDate={searchDate}
        onClose={handleCloseSearchResults}
      />
    );
  };

  const renderPenjualan = () => (
    <div className="space-y-5 md:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Entri Penjualan Gas LPG 3 Kg</h2>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 sm:p-5 md:p-6 border-l-4 border-green-500">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-green-100 p-3 sm:p-4 rounded-lg">
            <ShoppingCart className="text-green-600" size={32} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Gas LPG 3 Kg</h3>
            <p className="text-2xl font-bold text-green-600">Refil Pertamina</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 shadow-md">
        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Form Input Penjualan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tanggal</label>
            <input 
              type="date" 
              value={formPenjualan.tanggal}
              onChange={(e) => setFormPenjualan({...formPenjualan, tanggal: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">PT</label>
            <select 
              value={formPenjualan.pt}
              onChange={(e) => setFormPenjualan({...formPenjualan, pt: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Pilih PT</option>
              {currentUserData?.accessPT?.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pangkalan</label>
            <select 
              value={formPenjualan.pangkalan}
              onChange={(e) => setFormPenjualan({...formPenjualan, pangkalan: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Pilih Pangkalan</option>
              <option>Pangkalan Jaya</option>
              <option>Pangkalan Makmur</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Jumlah Tabung</label>
            <input 
              type="number" 
              value={formPenjualan.qty}
              onChange={(e) => setFormPenjualan({...formPenjualan, qty: e.target.value})}
              placeholder="0" 
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Harga per Tabung (Rp)</label>
            <input 
              type="number" 
              value={formPenjualan.harga}
              onChange={(e) => setFormPenjualan({...formPenjualan, harga: parseFloat(e.target.value) || 0})}
              placeholder="16000" 
              min="0"
              step="100"
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">PPN (%)</label>
            <input 
              type="number" 
              value={formPenjualan.ppnPercent}
              onChange={(e) => setFormPenjualan({...formPenjualan, ppnPercent: parseFloat(e.target.value) || 0})}
              placeholder="11" 
              min="0"
              max="100"
              step="0.1"
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">PPN Type</label>
            <select 
              value={formPenjualan.ppnType}
              onChange={(e) => setFormPenjualan({...formPenjualan, ppnType: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="include">Include PPN (Sudah termasuk)</option>
              <option value="exclude">Exclude PPN (Ditambahkan)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
            <select 
              value={formPenjualan.metodeBayar}
              onChange={(e) => setFormPenjualan({...formPenjualan, metodeBayar: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="cash">Cash (Masuk Kas Kecil)</option>
              <option value="cashless">Cashless (Langsung Laba Rugi)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtotal (Qty × Harga)</label>
            <input 
              type="text" 
              value={`${formPenjualan.qty || 0} × Rp ${(formPenjualan.harga || 16000).toLocaleString('id-ID')} = Rp ${hitungTotalPenjualan().subtotal.toLocaleString('id-ID')}`}
              readOnly 
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 font-bold text-green-600" 
            />
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">
              {formPenjualan.ppnType === 'include' ? 'Harga Dasar:' : 'Subtotal:'}
            </span>
            <span className="font-semibold">Rp {hitungTotalPenjualan().subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-700">
              PPN ({formPenjualan.ppnPercent}%) {formPenjualan.ppnType === 'include' ? '(Sudah termasuk)' : '(Ditambahkan)'}:
            </span>
            <span className="font-semibold">Rp {hitungTotalPenjualan().ppn.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-base mt-2 pt-2 border-t border-blue-300">
            <span className="font-bold text-gray-800">Total Pembayaran:</span>
            <span className="font-bold text-blue-600">Rp {hitungTotalPenjualan().displayTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button 
            onClick={handleSavePenjualan}
            disabled={isLoadingPenjualan}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
              isLoadingPenjualan 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            <Plus size={18} />
            {isLoadingPenjualan ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button 
            onClick={() => setFormPenjualan({ tanggal: getTodayDate(), pt: '', pangkalan: '', qty: '', harga: 16000, ppnPercent: 11, ppnType: 'include', metodeBayar: 'cash' })}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Riwayat Penjualan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">PT</th>
                <th className="px-4 py-3 text-left">Pangkalan</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">PPN</th>
                <th className="px-4 py-3 text-center">Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {penjualanData.map(penjualan => (
                <tr key={penjualan.id}>
                  <td className="px-4 py-3">{penjualan.tanggal}</td>
                  <td className="px-4 py-3 font-semibold">{penjualan.pt}</td>
                  <td className="px-4 py-3">{penjualan.pangkalan}</td>
                  <td className="px-4 py-3 text-right">{penjualan.qty} tabung</td>
                  <td className="px-4 py-3 text-right">Rp {penjualan.harga.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    Rp {penjualan.total.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    Rp {penjualan.ppn.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      penjualan.metodeBayar === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {penjualan.metodeBayar === 'cash' ? 'Cash' : 'Cashless'}
                    </span>
                  </td>
                </tr>
              ))}
              {penjualanData.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    Belum ada data penjualan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLaporan = () => {
    return (
      <LaporanPage
        arusKasData={arusKasData}
        subKategoriData={subKategoriData}
        currentUserData={currentUserData}
        selectedPT={selectedPT}
        selectedMonth={selectedMonth}
        onPTChange={setSelectedPT}
        onMonthChange={setSelectedMonth}
        onExportPDF={handleExportPDF}
      />
    );
  };

  const renderMasterKategori = () => {
    return (
      <MasterKategoriPage
        subKategoriData={subKategoriData}
        isLoadingSubKategori={isLoadingSubKategori}
        showAddSubKategoriModal={showAddSubKategoriModal}
        showEditSubKategoriModal={showEditSubKategoriModal}
        editingSubKategori={editingSubKategori}
        formSubKategori={formSubKategori}
        onAddClick={() => {
          setFormSubKategori({ jenis: 'pengeluaran', nama: '', urutan: 0 });
          setShowAddSubKategoriModal(true);
        }}
        onEditClick={(sk) => {
          setEditingSubKategori(sk);
          setFormSubKategori({
            jenis: sk.jenis,
            nama: sk.nama,
            urutan: sk.urutan
          });
          setShowEditSubKategoriModal(true);
        }}
        onDeleteClick={handleDeleteSubKategori}
        onAddSubmit={handleAddSubKategori}
        onUpdateSubmit={handleUpdateSubKategori}
        onFormChange={setFormSubKategori}
        onCancelAdd={() => {
          setShowAddSubKategoriModal(false);
          setFormSubKategori({ jenis: 'pengeluaran', nama: '', urutan: 0 });
        }}
        onCancelEdit={() => {
          setShowEditSubKategoriModal(false);
          setEditingSubKategori(null);
          setFormSubKategori({ jenis: 'pengeluaran', nama: '', urutan: 0 });
        }}
      />
    );
  };

  const renderMasterAdmin = () => {
    return (
      <MasterAdminPage
        userList={userList}
        currentUserData={currentUserData}
        formUser={formUser}
        showAddUserModal={showAddUserModal}
        showEditUserModal={showEditUserModal}
        mainMenuItems={mainMenuItems}
        onAddClick={() => setShowAddUserModal(true)}
        onEditClick={handleOpenEditUser}
        onDeleteClick={handleDeleteUser}
        onSaveUser={handleSaveUser}
        onUpdateUser={handleUpdateUser}
        onFormChange={setFormUser}
        onCloseAddModal={() => setShowAddUserModal(false)}
        onCloseEditModal={() => setShowEditUserModal(false)}
      />
    );
  };

  // Render Kas Kecil Page (untuk pembukuan kasir tunai - Cash Only)
  const renderKasKecil = () => {
    const handlePTChange = (ptCode) => {
      setSelectedPT(prev => {
        if (prev.includes(ptCode)) {
          return prev.filter(p => p !== ptCode);
        } else {
          return [...prev, ptCode];
        }
      });
    };

    // Calculate totals from kas kecil data
    const hitungKasKecil = (pts = []) => {
      const filtered = pts.length > 0 ? kasKecilData.filter(k => pts.includes(k.pt)) : kasKecilData;
      const masuk = filtered.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0);
      const keluar = filtered.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0);
      return { masuk, keluar, saldo: masuk - keluar };
    };

    // Calculate yesterday's closing balance (Saldo Awal)
    // Find the "Sisa Saldo" transaction from yesterday ONLY, not cumulative
    const hitungSaldoAwal = () => {
      const selectedDate = filterKasKecil.tanggal || getLocalDateString();
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');

      // Get yesterday's date
      const yesterday = new Date(selectedDateObj);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

      // Find "Sisa Saldo" transaction from yesterday
      const sisaSaldoTransactions = kasKecilData.filter(item => {
        if (!item.tanggal) return false;

        // Check if transaction is from yesterday
        const itemDate = new Date(item.tanggal);
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        if (itemDateOnly.getTime() !== yesterdayDateOnly.getTime()) return false;

        // Check if it's a "Sisa Saldo" transaction (masuk, approved, keterangan contains "Sisa Saldo")
        if (item.jenis !== 'masuk') return false;
        if (item.status !== 'approved') return false;
        if (!item.keterangan || !item.keterangan.toLowerCase().includes('sisa saldo')) return false;

        // Filter by PT if selected
        if (filterKasKecil.pt.length > 0 && !filterKasKecil.pt.includes(item.pt)) return false;

        return true;
      });

      // Return the sum of "Sisa Saldo" transactions from yesterday
      // Usually should be only 1 transaction per PT
      const saldoAwal = sisaSaldoTransactions.reduce((sum, item) => sum + (item.jumlah || 0), 0);

      return saldoAwal;
    };

    // Use auto-filtered data (real-time)
    const displayData = getFilteredKasKecilData();

    // Calculate totals based on display data
    const masuk = displayData.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0);
    const keluar = displayData.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + (k.jumlah || 0), 0);

    // Get opening balance (yesterday's closing balance)
    const saldoAwal = hitungSaldoAwal();

    // Calculate closing balance = today's masuk - today's keluar only
    const saldo = masuk - keluar;

    // Add running balance to display data
    // Start from 0 because "Sisa Saldo" transaction is already in displayData
    let runningBalance = 0;
    const dataWithBalance = displayData.map((item) => {
      // Only count approved transactions for balance
      if (item.status === 'approved') {
        if (item.jenis === 'masuk') {
          runningBalance += item.jumlah || 0;
        } else if (item.jenis === 'keluar') {
          runningBalance -= item.jumlah || 0;
        }
      }
      return {
        ...item,
        saldo: runningBalance
      };
    });

    // Check if transaction is from today for edit/delete
    const isToday = (createdAt) => {
      if (!createdAt) return false;
      const today = new Date();
      const transDate = new Date(createdAt);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return transDate >= todayStart;
    };

    return (
      <div id="kas-kecil-content" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Kas Kecil</h2>
            <p className="text-sm text-gray-600">Pembukuan Kas Kecil Tunai di Kasir</p>
          </div>
        </div>


        {/* Input Form */}
        <div className="bg-white rounded-lg p-6 shadow-md no-print">
          <h3 className="text-lg font-bold mb-4">Input Transaksi Kas Kecil</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal *</label>
              <input 
                type="date" 
                value={formKasKecil.tanggal}
                onChange={(e) => setFormKasKecil({...formKasKecil, tanggal: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PT *</label>
              <select 
                value={formKasKecil.pt}
                onChange={(e) => setFormKasKecil({...formKasKecil, pt: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Pilih PT</option>
                {currentUserData?.accessPT?.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jenis *</label>
              <select 
                value={formKasKecil.jenis}
                onChange={(e) => setFormKasKecil({...formKasKecil, jenis: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="keluar">Pengeluaran</option>
                <option value="masuk">Pemasukan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jumlah (Rp) *</label>
              <input 
                type="number" 
                value={formKasKecil.jumlah}
                onChange={(e) => setFormKasKecil({...formKasKecil, jumlah: e.target.value})}
                placeholder="0" 
                className="w-full px-4 py-2 border rounded-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Kategori *</label>
              <select 
                value={formKasKecil.kategori}
                onChange={(e) => setFormKasKecil({...formKasKecil, kategori: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Pilih Kategori</option>
                {kategoriPengeluaran.map(kategori => (
                  <option key={kategori} value={kategori}>{kategori}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Keterangan *</label>
              <textarea
                value={formKasKecil.keterangan}
                onChange={(e) => setFormKasKecil({...formKasKecil, keterangan: e.target.value})}
                placeholder="Masukkan keterangan transaksi" 
                className="w-full px-4 py-2 border rounded-lg"
                rows={1}
              />
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={handleSaveKasKecil}
              disabled={isLoadingKasKecil}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoadingKasKecil ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </div>

        {/* Filter & Print Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 no-print">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filter Laporan</h3>
            <button
              onClick={handlePrintKasKecil}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              title="Print Laporan"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* PT Filter - Multi Select */}
            <div>
              <label className="block text-sm font-medium mb-2">Filter PT (bisa lebih dari 1)</label>
              <div className="flex flex-wrap gap-2">
                {currentUserData?.accessPT?.map(ptCode => (
                  <button
                    key={ptCode}
                    onClick={() => {
                      setFilterKasKecil(prev => ({
                        ...prev,
                        pt: prev.pt.includes(ptCode)
                          ? prev.pt.filter(p => p !== ptCode)
                          : [...prev.pt, ptCode]
                      }));
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterKasKecil.pt.includes(ptCode)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {ptCode}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filterKasKecil.pt.length === 0 ? 'Semua PT ditampilkan' : `${filterKasKecil.pt.length} PT dipilih`}
              </p>
            </div>

            {/* Date Filter - Single Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Filter Tanggal</label>
              <input
                type="date"
                value={filterKasKecil.tanggal}
                onChange={(e) => {
                  setFilterKasKecil(prev => ({
                    ...prev,
                    tanggal: e.target.value
                  }));
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Menampilkan transaksi pada tanggal yang dipilih
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Awal</p>
                <p className="text-2xl font-bold text-purple-600">Rp {saldoAwal.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Masuk</p>
                <p className="text-2xl font-bold text-green-600">Rp {masuk.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Keluar</p>
                <p className="text-2xl font-bold text-red-600">Rp {keluar.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Akhir</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  Rp {saldo.toLocaleString('id-ID')}
                </p>
              </div>
              <div className={`p-3 rounded-full ${saldo >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <DollarSign className={`w-6 h-6 ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">Riwayat Transaksi Kas Kecil</h3>
              <p className="text-sm text-gray-600">Transaksi tunai (cash) di kasir</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Masuk</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Keluar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase no-print">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataWithBalance.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.pt}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.kategori || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.keterangan}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.jenis === 'masuk' ? (
                        <span className="text-green-600 font-medium">
                          Rp {(item.jumlah || 0).toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.jenis === 'keluar' ? (
                        <span className="text-red-600 font-medium">
                          Rp {(item.jumlah || 0).toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-semibold ${item.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        Rp {(item.saldo || 0).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center no-print">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'approved' ? 'bg-green-100 text-green-700' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status === 'approved' ? 'Approved' : item.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center no-print">
                      {isToday(item.created_at) && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingKasKecil(item);
                              setFormKasKecil({
                                tanggal: getLocalDateFromISO(item.tanggal),
                                pt: item.pt,
                                jenis: item.jenis,
                                jumlah: item.jumlah.toString(),
                                keterangan: item.keterangan,
                                kategori: item.kategori || ''
                              });
                              setShowEditKasKecilModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteKasKecil(item.id, item.keterangan)}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-right">Total Hari Ini (Approved)</td>
                  <td className="px-4 py-3 text-right text-green-600">Rp {masuk.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-red-600">Rp {keluar.toLocaleString('id-ID')}</td>
                  <td colSpan="3" className="px-4 py-3"></td>
                </tr>
                <tr className="bg-blue-50">
                  <td colSpan="4" className="px-4 py-3 text-right">Saldo Akhir</td>
                  <td colSpan="5" className="px-4 py-3 text-right text-blue-600 text-lg">
                    Rp {saldo.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingKasKecil && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span>Memuat data kas kecil...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Arus Kas Page (Comprehensive Cash Flow - Cash + Cashless)

  const renderDetailKas = () => {
    return (
      <DetailKasPage
        kasKecilData={kasKecilData}
        currentUserData={currentUserData}
        filterDetailKas={filterDetailKas}
        selectedPT={selectedPT}
        onFilterChange={setFilterDetailKas}
        onPTChange={setSelectedPT}
        onApprove={handleApproveKas}
        onReject={handleRejectKas}
      />
    );
  };

  // ==================== RENDER ARUS KAS ====================
  const renderArusKas = () => {
    const handlePTChange = (ptCode) => {
      setFilterArusKas(prev => ({
        ...prev,
        pt: prev.pt.includes(ptCode)
          ? prev.pt.filter(p => p !== ptCode)
          : [...prev.pt, ptCode]
      }));
    };

    // Calculate totals from arus kas data
    const displayData = getFilteredArusKasData();
    const masuk = displayData.filter(k => k.jenis === 'masuk').reduce((sum, k) => sum + (k.jumlah || 0), 0);
    const keluar = displayData.filter(k => k.jenis === 'keluar').reduce((sum, k) => sum + (k.jumlah || 0), 0);
    const saldo = masuk - keluar;

    return (
      <div id="arus-kas-content" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Arus Kas</h2>
            <p className="text-sm text-gray-600">Pencatatan Arus Kas (Cash & Cashless)</p>
          </div>
        </div>


        {/* Input Form */}
        <div className="bg-white rounded-lg p-6 shadow-md no-print">
          <h3 className="text-lg font-bold mb-4">Input Transaksi Arus Kas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal *</label>
              <input
                type="date"
                value={formArusKas.tanggal}
                onChange={(e) => setFormArusKas({...formArusKas, tanggal: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PT *</label>
              <select
                value={formArusKas.pt}
                onChange={(e) => setFormArusKas({...formArusKas, pt: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Pilih PT</option>
                {currentUserData?.accessPT?.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jenis *</label>
              <select
                value={formArusKas.jenis}
                onChange={(e) => setFormArusKas({...formArusKas, jenis: e.target.value, subKategoriId: ''})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="keluar">Pengeluaran</option>
                <option value="masuk">Pemasukan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sub Kategori *</label>
              <select
                value={formArusKas.subKategoriId}
                onChange={(e) => setFormArusKas({...formArusKas, subKategoriId: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Pilih Sub Kategori</option>
                {formArusKas.jenis === 'masuk' ? (
                  <>
                    <optgroup label="PEMASUKAN">
                      {subKategoriData
                        .filter(sk => sk.jenis === 'pemasukan')
                        .sort((a, b) => a.urutan - b.urutan)
                        .map(sk => (
                          <option key={sk.id} value={sk.id}>{sk.nama}</option>
                        ))
                      }
                    </optgroup>
                  </>
                ) : (
                  <>
                    <optgroup label="PENGELUARAN">
                      {subKategoriData
                        .filter(sk => sk.jenis === 'pengeluaran')
                        .sort((a, b) => a.urutan - b.urutan)
                        .map(sk => (
                          <option key={sk.id} value={sk.id}>{sk.nama}</option>
                        ))
                      }
                    </optgroup>
                  </>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Kategori berubah otomatis sesuai jenis transaksi
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Metode Bayar *</label>
              <select
                value={formArusKas.metodeBayar}
                onChange={(e) => setFormArusKas({...formArusKas, metodeBayar: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="cashless">Cashless (Transfer/Non-Tunai)</option>
                <option value="cash">Cash (Tunai)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jumlah (Rp) *</label>
              <input
                type="number"
                value={formArusKas.jumlah}
                onChange={(e) => setFormArusKas({...formArusKas, jumlah: e.target.value})}
                placeholder="0"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Keterangan *</label>
              <textarea
                value={formArusKas.keterangan}
                onChange={(e) => setFormArusKas({...formArusKas, keterangan: e.target.value})}
                placeholder="Masukkan keterangan transaksi"
                className="w-full px-4 py-2 border rounded-lg"
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleSaveArusKas}
              disabled={isLoadingArusKas}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoadingArusKas ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </div>

        {/* Filter & Print Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 no-print">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filter Laporan</h3>
            <button
              onClick={handlePrintArusKas}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              title="Print Laporan"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>

          <div className="space-y-4">
            {/* Date Filter - Single Date for Daily Report */}
            <div>
              <label className="block text-sm font-medium mb-2">Filter Tanggal (Laporan Harian)</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filterArusKas.tanggal}
                  onChange={(e) => setFilterArusKas({...filterArusKas, tanggal: e.target.value})}
                  className="px-4 py-2 border rounded-lg"
                />
                {filterArusKas.tanggal && (
                  <button
                    onClick={() => setFilterArusKas({...filterArusKas, tanggal: ''})}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Reset
                  </button>
                )}
                <p className="text-xs text-gray-500">
                  {filterArusKas.tanggal
                    ? `Menampilkan data tanggal: ${new Date(filterArusKas.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Semua tanggal ditampilkan'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {/* PT Filter - Multi Select */}
              <div>
                <label className="block text-sm font-medium mb-2">Filter PT (bisa lebih dari 1)</label>
                <div className="flex flex-wrap gap-2">
                  {currentUserData?.accessPT?.map(ptCode => (
                    <button
                      key={ptCode}
                      onClick={() => handlePTChange(ptCode)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterArusKas.pt && filterArusKas.pt.includes(ptCode)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {ptCode}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {!filterArusKas.pt || filterArusKas.pt.length === 0 ? 'Semua PT ditampilkan' : `${filterArusKas.pt.length} PT dipilih`}
                </p>
              </div>

              {/* Info Text */}
              <div className="flex items-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Arus Kas menampilkan transaksi tunai & non-tunai untuk laporan keuangan lengkap.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Masuk</p>
                <p className="text-2xl font-bold text-green-600">Rp {masuk.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Keluar</p>
                <p className="text-2xl font-bold text-red-600">Rp {keluar.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Akhir</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  Rp {saldo.toLocaleString('id-ID')}
                </p>
              </div>
              <div className={`p-3 rounded-full ${saldo >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <DollarSign className={`w-6 h-6 ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Riwayat Transaksi Arus Kas</h3>
            <p className="text-sm text-gray-600">Transaksi cash & cashless</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Metode</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Masuk</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Keluar</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.pt}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.kategori || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.keterangan}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.metode_bayar === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.metode_bayar === 'cash' ? 'Cash' : 'Cashless'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.jenis === 'masuk' ? (
                        <span className="text-green-600 font-medium">
                          Rp {(item.jumlah || 0).toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.jenis === 'keluar' ? (
                        <span className="text-red-600 font-medium">
                          Rp {(item.jumlah || 0).toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingArusKas(item);
                            setFormArusKas({
                              tanggal: getLocalDateFromISO(item.tanggal),
                              pt: item.pt,
                              jenis: item.jenis,
                              jumlah: item.jumlah.toString(),
                              keterangan: item.keterangan,
                              subKategoriId: item.sub_kategori_id?.toString() || '',
                              metodeBayar: item.metode_bayar || 'cashless'
                            });
                            setShowEditArusKasModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteArusKas(item.id, item.keterangan)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-right">Total</td>
                  <td className="px-4 py-3 text-right text-green-600">Rp {masuk.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-red-600">Rp {keluar.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3"></td>
                </tr>
                <tr className="bg-blue-50">
                  <td colSpan="5" className="px-4 py-3 text-right">Saldo Akhir</td>
                  <td colSpan="3" className="px-4 py-3 text-right text-blue-600 text-lg">
                    Rp {saldo.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditArusKasModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Edit Transaksi Arus Kas</h3>
                  <button
                    onClick={() => {
                      setShowEditArusKasModal(false);
                      setEditingArusKas(null);
                      setFormArusKas({
                        tanggal: getLocalDateString(),
                        pt: '',
                        jenis: 'keluar',
                        jumlah: '',
                        keterangan: '',
                        subKategoriId: '',
                        metodeBayar: 'cashless'
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tanggal *</label>
                    <input
                      type="date"
                      value={formArusKas.tanggal}
                      onChange={(e) => setFormArusKas({...formArusKas, tanggal: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">PT *</label>
                    <select
                      value={formArusKas.pt}
                      onChange={(e) => setFormArusKas({...formArusKas, pt: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Pilih PT</option>
                      {currentUserData?.accessPT?.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Jenis *</label>
                    <select
                      value={formArusKas.jenis}
                      onChange={(e) => setFormArusKas({...formArusKas, jenis: e.target.value, subKategoriId: ''})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="keluar">Pengeluaran</option>
                      <option value="masuk">Pemasukan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sub Kategori *</label>
                    <select
                      value={formArusKas.subKategoriId}
                      onChange={(e) => setFormArusKas({...formArusKas, subKategoriId: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Pilih Sub Kategori</option>
                      {formArusKas.jenis === 'masuk' ? (
                        <>
                          <optgroup label="PEMASUKAN">
                            {subKategoriData
                              .filter(sk => sk.jenis === 'pemasukan')
                              .sort((a, b) => a.urutan - b.urutan)
                              .map(sk => (
                                <option key={sk.id} value={sk.id}>{sk.nama}</option>
                              ))
                            }
                          </optgroup>
                        </>
                      ) : (
                        <>
                          <optgroup label="PENGELUARAN">
                            {subKategoriData
                              .filter(sk => sk.jenis === 'pengeluaran')
                              .sort((a, b) => a.urutan - b.urutan)
                              .map(sk => (
                                <option key={sk.id} value={sk.id}>{sk.nama}</option>
                              ))
                            }
                          </optgroup>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Metode Bayar *</label>
                    <select
                      value={formArusKas.metodeBayar}
                      onChange={(e) => setFormArusKas({...formArusKas, metodeBayar: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="cashless">Cashless</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Jumlah (Rp) *</label>
                    <input
                      type="number"
                      value={formArusKas.jumlah}
                      onChange={(e) => setFormArusKas({...formArusKas, jumlah: e.target.value})}
                      placeholder="0"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Keterangan *</label>
                    <textarea
                      value={formArusKas.keterangan}
                      onChange={(e) => setFormArusKas({...formArusKas, keterangan: e.target.value})}
                      placeholder="Masukkan keterangan transaksi"
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleUpdateArusKas}
                    disabled={isLoadingArusKas}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoadingArusKas ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditArusKasModal(false);
                      setEditingArusKas(null);
                      setFormArusKas({
                        tanggal: getLocalDateString(),
                        pt: '',
                        jenis: 'keluar',
                        jumlah: '',
                        keterangan: '',
                        subKategoriId: '',
                        metodeBayar: 'cashless'
                      });
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingArusKas && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span>Memuat data arus kas...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'beranda': return renderBeranda();
      case 'kas-kecil': return renderKasKecil();
      case 'arus-kas': return renderArusKas();
      case 'detail-kas': return renderDetailKas();
      case 'penjualan': return renderPenjualan();
      case 'laporan': return renderLaporan();
      case 'master-kategori': return renderMasterKategori();
      case 'master-admin': return renderMasterAdmin();
      default: return renderBeranda();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="min-h-screen flex flex-col md:pb-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
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

              <div className="flex items-center gap-4 ml-auto">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{currentUserData?.name || 'User'}</p>
                  <p className="text-xs text-gray-600">{currentUserData?.role || 'Role'}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold hover:shadow-lg transition-all"
                  >
                    {currentUserData?.name?.charAt(0) || 'U'}
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-800">{currentUserData?.name}</p>
                        <p className="text-xs text-gray-600">{currentUserData?.role}</p>
                        <p className="text-xs text-gray-500 mt-1">@{currentUserData?.username}</p>
                      </div>
                      <button 
                        onClick={handleOpenEditProfile}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <Users size={16} />
                        <span>Edit Profil</span>
                      </button>
                      <button 
                        onClick={handleOpenChangePassword}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                      >
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

        <header className="md:hidden bg-white/95 backdrop-blur shadow-sm sticky top-0 z-30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="w-11 h-11 object-contain rounded-lg bg-white p-1"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg items-center justify-center text-white font-bold text-xl shadow-lg hidden">
                  SJ
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800 leading-tight">SUMBER JAYA GRUP</h1>
                  <p className="text-[11px] text-gray-500">Sistem Manajemen Keuangan</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold hover:shadow-lg transition-all"
                >
                  {currentUserData?.name?.charAt(0) || 'U'}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-800">{currentUserData?.name}</p>
                      <p className="text-xs text-gray-600">{currentUserData?.role}</p>
                      <p className="text-xs text-gray-500 mt-1">@{currentUserData?.username}</p>
                    </div>
                    <button 
                      onClick={handleOpenEditProfile}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                    >
                      <Users size={16} />
                      <span>Edit Profil</span>
                    </button>
                    <button 
                      onClick={handleOpenChangePassword}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                    >
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
        </header>

        <main className="flex-1 pb-24 md:pb-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-5 md:space-y-6 mobile-content">
            {renderContent()}
          </div>
        </main>

        <nav className="md:hidden fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur border-t shadow-lg z-50">
          <div className="flex justify-around items-end px-2 py-2 gap-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
            {(() => {
              const filteredItems = mainMenuItems.filter(item =>
                currentUserData?.fiturAkses?.includes(item.id) || currentUserData?.role === 'Master User'
              );

              // Dynamic icon size based on number of features
              const iconSize = filteredItems.length <= 3 ? 26 :
                              filteredItems.length <= 5 ? 24 : 22;

              return filteredItems.map(item => {
                const ItemIcon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    type="button"
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <ItemIcon size={iconSize} strokeWidth={2.5} />
                    <span className="mt-1 text-[11px] font-semibold leading-none">
                      {item.shortLabel || item.label}
                    </span>
                  </button>
                );
              });
            })()}
          </div>
        </nav>

        {/* Modal Edit Profile */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800">Edit Profil</h3>
                <button 
                  onClick={() => setShowEditProfileModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={currentUserData?.username || ''}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Username tidak dapat diubah</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formEditProfile.nama}
                    onChange={(e) => setFormEditProfile({...formEditProfile, nama: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Jabatan</label>
                  <input
                    type="text"
                    value={formEditProfile.jabatan}
                    onChange={(e) => setFormEditProfile({...formEditProfile, jabatan: e.target.value})}
                    placeholder="Masukkan jabatan"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Simpan Perubahan
                </button>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Change Password */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800">Ganti Password</h3>
                <button 
                  onClick={() => setShowChangePasswordModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Password Lama</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={formChangePassword.oldPassword}
                      onChange={(e) => setFormChangePassword({...formChangePassword, oldPassword: e.target.value})}
                      placeholder="Masukkan password lama"
                      className="w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={formChangePassword.newPassword}
                      onChange={(e) => setFormChangePassword({...formChangePassword, newPassword: e.target.value})}
                      placeholder="Masukkan password baru (min. 6 karakter)"
                      className="w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formChangePassword.confirmPassword}
                      onChange={(e) => setFormChangePassword({...formChangePassword, confirmPassword: e.target.value})}
                      placeholder="Konfirmasi password baru"
                      className="w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Catatan:</strong> Password baru minimal 6 karakter
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={handleSavePassword}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Ubah Password
                </button>
                <button
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit Kas */}
        {showEditKasModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Edit Transaksi Kas</h3>
                <button 
                  onClick={() => {
                    setShowEditKasModal(false);
                    setEditingKas(null);
                    setFormKas({ tanggal: getTodayDate(), pt: '', jenis: 'keluar', jumlah: '', keterangan: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Hanya transaksi hari ini yang bisa diedit.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                    <label className="block text-sm font-medium mb-2">PT *</label>
                    <select 
                      value={formKas.pt}
                      onChange={(e) => setFormKas({...formKas, pt: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Pilih PT</option>
                      {currentUserData?.accessPT?.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Jenis Transaksi *</label>
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
                    <label className="block text-sm font-medium mb-2">Jumlah (Rp) *</label>
                    <input 
                      type="number" 
                      value={formKas.jumlah}
                      onChange={(e) => setFormKas({...formKas, jumlah: e.target.value})}
                      placeholder="0" 
                      className="w-full px-4 py-2 border rounded-lg" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Keterangan *</label>
                    <textarea 
                      rows={3}
                      value={formKas.keterangan}
                      onChange={(e) => setFormKas({...formKas, keterangan: e.target.value})}
                      placeholder="Masukkan keterangan transaksi" 
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
                    <select 
                      value={formKas.metodeBayar}
                      onChange={(e) => setFormKas({...formKas, metodeBayar: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="cash">Cash (Tunai)</option>
                      <option value="cashless">Cashless (Non-Tunai)</option>
                    </select>
                  </div>
                  {formKas.metodeBayar === 'cashless' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Kategori Pengeluaran</label>
                      <select 
                        value={formKas.kategori}
                        onChange={(e) => setFormKas({...formKas, kategori: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        required={formKas.metodeBayar === 'cashless'}
                      >
                        <option value="">Pilih Kategori</option>
                        {kategoriPengeluaran.map(kategori => (
                          <option key={kategori} value={kategori}>{kategori}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={handleUpdateKas}
                  disabled={isLoadingKas}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400"
                >
                  {isLoadingKas ? 'Menyimpan...' : 'Update Transaksi'}
                </button>
                <button
                  onClick={() => {
                    setShowEditKasModal(false);
                    setEditingKas(null);
                    setFormKas({ tanggal: getTodayDate(), pt: '', jenis: 'keluar', jumlah: '', keterangan: '' });
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Kas Kecil */}
        {showEditKasKecilModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingKasKecil ? 'Edit Transaksi Kas Kecil' : 'Tambah Transaksi Kas Kecil'}
                </h3>
                <button 
                  onClick={() => {
                    setShowEditKasKecilModal(false);
                    setEditingKasKecil(null);
                    setFormKasKecil({ 
                      tanggal: getTodayDate(), 
                      pt: '', 
                      jenis: 'keluar', 
                      jumlah: '', 
                      keterangan: '', 
                      kategori: '', 
                      metodeBayar: 'cash' 
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Kas Kecil untuk pembukuan kasir tunai. Hanya transaksi hari ini yang bisa diedit.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tanggal</label>
                    <input 
                      type="date" 
                      value={formKasKecil.tanggal}
                      onChange={(e) => setFormKasKecil({...formKasKecil, tanggal: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">PT *</label>
                    <select 
                      value={formKasKecil.pt}
                      onChange={(e) => setFormKasKecil({...formKasKecil, pt: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Pilih PT</option>
                      {currentUserData?.accessPT?.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Jenis Transaksi *</label>
                    <select 
                      value={formKasKecil.jenis}
                      onChange={(e) => setFormKasKecil({...formKasKecil, jenis: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="keluar">Pengeluaran</option>
                      <option value="masuk">Pemasukan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Jumlah (Rp) *</label>
                    <input 
                      type="number" 
                      value={formKasKecil.jumlah}
                      onChange={(e) => setFormKasKecil({...formKasKecil, jumlah: e.target.value})}
                      placeholder="0" 
                      className="w-full px-4 py-2 border rounded-lg" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Keterangan *</label>
                    <textarea 
                      rows={3}
                      value={formKasKecil.keterangan}
                      onChange={(e) => setFormKasKecil({...formKasKecil, keterangan: e.target.value})}
                      placeholder="Masukkan keterangan transaksi" 
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Kategori *</label>
                    <select 
                      value={formKasKecil.kategori}
                      onChange={(e) => setFormKasKecil({...formKasKecil, kategori: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      {kategoriPengeluaran.map(kategori => (
                        <option key={kategori} value={kategori}>{kategori}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={editingKasKecil ? handleUpdateKasKecil : handleSaveKasKecil}
                  disabled={isLoadingKasKecil}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400"
                >
                  {isLoadingKasKecil ? 'Menyimpan...' : (editingKasKecil ? 'Update Transaksi' : 'Simpan Transaksi')}
                </button>
                <button
                  onClick={() => {
                    setShowEditKasKecilModal(false);
                    setEditingKasKecil(null);
                    setFormKasKecil({ 
                      tanggal: getTodayDate(), 
                      pt: '', 
                      jenis: 'keluar', 
                      jumlah: '', 
                      keterangan: '', 
                      kategori: '', 
                      metodeBayar: 'cash' 
                    });
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Modal */}
        {renderSearchResults()}
      </div>
    </div>
  );
};

export default SumberJayaApp;
