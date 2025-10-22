import React, { useState, useEffect } from 'react';
import { 
  Home, DollarSign, ShoppingCart, BarChart3, Users, LogOut, 
  Download, Calendar, Plus, AlertCircle, Lock, X, Eye, EyeOff, TrendingDown
} from 'lucide-react';
import { 
  authService, 
  kasKecilService, 
  penjualanService, 
  dashboardService,
  userService,
  profileService
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

  const [userList, setUserList] = useState([]);
  const [penjualanData, setPenjualanData] = useState([]);
  
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
  
  // Load Kas Kecil Data from API
  const loadKasKecilData = async (filters = {}) => {
    if (!isLoggedIn) return;
    
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
      setKasKecilData(data);
    } catch (error) {
      console.error('Error loading kas kecil:', error);
      // Don't alert on load error, just log it
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
  
  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadKasKecilData();
      loadPenjualanData();
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
    tanggal: getTodayDate(),
    pt: '',
    jenis: 'keluar',
    jumlah: '',
    keterangan: ''
  });

  const [showEditKasModal, setShowEditKasModal] = useState(false);
  const [editingKas, setEditingKas] = useState(null);

  const [formUser, setFormUser] = useState({
    nama: '',
    username: '',
    password: '',
    jabatan: '',
    fiturAkses: [],
    aksesPT: []
  });
  
  const [formPenjualan, setFormPenjualan] = useState({
    tanggal: getTodayDate(),
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
        ppnPercent: parseFloat(formPenjualan.ppnPercent),
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
      setFormPenjualan({ tanggal: getTodayDate(), pt: '', pangkalan: '', qty: '', ppnPercent: 11, metodeBayar: 'cash' });
    alert('Data penjualan berhasil disimpan!');
    } catch (error) {
      console.error('Error saving penjualan:', error);
      alert('Gagal menyimpan data penjualan: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingPenjualan(false);
    }
  };

  const ptList = [
    { code: 'KSS', name: 'PT KHALISA SALMA SEJAHTERA' },
    { code: 'SJE', name: 'PT SUMBER JAYA ELPIJI' },
    { code: 'FAB', name: 'PT FADILLAH AMANAH BERSAMA' },
    { code: 'KBS', name: 'PT KHABITSA INDOGAS' },
    { code: 'SJS', name: 'PT SRI JOYO SHAKTI' }
  ];

  const mainMenuItems = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'arus-kas', label: 'Kas Kecil', icon: DollarSign },
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
    
    let headerTitle = '';
    let headerSubtitle = '';
    let ptInfo = '';

    if (type === 'kas') {
      headerTitle = 'LAPORAN ARUS KAS KECIL';
      
      if (selectedPT.length > 0) {
        ptInfo = selectedPT.join(' - ');
      } else {
        ptInfo = 'Semua PT';
      }
      
      const selectedPTNames = selectedPT.length > 0 
        ? selectedPT.map(code => {
            const pt = ptList.find(p => p.code === code);
            return pt ? pt.name : code;
          }).join(' - ')
        : ptList.map(p => p.name).join(' - ');
      
      headerSubtitle = selectedPTNames;
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
    
    if (content) {
      const printWindow = window.open('', '_blank');
      
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
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${headerTitle} - Sumber Jaya Grup</title>
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
                font-family: 'Arial', sans-serif; 
                padding: 20px;
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
                font-size: ${type === 'labarugi' ? '12px' : '12px'};
                color: #333;
                margin-bottom: ${type === 'labarugi' ? '2px' : '3px'};
                font-weight: bold;
                line-height: 1.3;
              }
              .report-period {
                font-size: 10px;
                color: #666;
                margin-top: 0px;
                font-weight: normal;
                line-height: 1.3;
              }
              .report-company {
                font-size: 9px;
                color: #666;
                margin-top: 5px;
              }
              
              .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                font-size: 10px;
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
                font-size: 9px;
              }
              th { 
                background: #000;
                color: white;
                padding: 8px 6px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #000;
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
                background: #f0f0f0 !important;
                font-weight: bold;
                border-top: 2px solid #000 !important;
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
                background: #000;
                color: white;
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
              ${type === 'labarugi' ? `<div class="report-period">Periode ${bulanNama} ${tahun}</div>` : '<div class="report-company">Sistem Sumber Jaya Grup Official</div>'}
            </div>
            
            ${type === 'kas' ? `
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
            ` : ''}
            
            ${content.innerHTML}
            
            ${signatureSection}
            
            <div class="report-footer">
              <p><strong>© 2025 Sumber Jaya Grup Official | Powered by Rigeel One Click</strong></p>
              <p>Dicetak pada: ${tanggal} oleh ${currentUserData?.name || 'User'} (${currentUserData?.role || 'Role'})</p>
              <p>Dokumen ini adalah salinan resmi dan sah untuk keperluan administrasi</p>
            </div>
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
    // Filter menu berdasarkan akses user
    const filteredMenuItems = mainMenuItems.filter(item => 
      currentUserData?.role === 'Master User' || currentUserData?.fiturAkses?.includes(item.id)
    );

    return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 md:p-8 text-white shadow-lg">
          <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-1">Selamat Datang, {currentUserData?.name}!</h2>
          <p className="text-gray-300 text-base md:text-lg">{currentUserData?.role} - SUMBER JAYA GRUP</p>
          </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Rabu, 15 Oktober 2025</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-gray-900">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Kas Kecil</p>
            <DollarSign className="text-gray-900" size={28} />
          </div>
          {isLoadingStats ? (
            <p className="text-2xl font-bold text-gray-400">Loading...</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-800">
                Rp {dashboardStats.kasHarian.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-2">Saldo kas tunai</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Penjualan Hari Ini</p>
            <ShoppingCart className="text-gray-700" size={28} />
          </div>
          {isLoadingStats ? (
            <p className="text-2xl font-bold text-gray-400">Loading...</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-800">
                {dashboardStats.penjualanQty.toLocaleString('id-ID')} Tabung
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Rp {dashboardStats.penjualanNilai.toLocaleString('id-ID')}
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <AlertCircle className="text-yellow-500" size={28} />
          </div>
          {isLoadingStats ? (
            <p className="text-2xl font-bold text-gray-400">...</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-800">{dashboardStats.pendingApproval}</p>
              <p className="text-xs text-yellow-600 mt-2 font-medium">
                {dashboardStats.pendingApproval > 0 ? 'Perlu persetujuan' : 'Semua sudah disetujui'}
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Pengeluaran 7 Hari</p>
            <TrendingDown className="text-red-500" size={28} />
          </div>
          {isLoadingStats ? (
            <p className="text-2xl font-bold text-gray-400">Loading...</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-800">
                Rp {dashboardStats.pengeluaran7Hari.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-red-600 mt-2 font-medium">Seminggu terakhir</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">PT Yang Dapat Diakses</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentUserData?.accessPT?.map(code => {
            const pt = ptList.find(p => p.code === code);
            return (
              <div key={code} className="border-2 border-gray-300 bg-gray-50 rounded-lg p-4 hover:border-gray-900 hover:bg-gray-100 transition-all">
                <p className="font-bold text-gray-800 text-lg">{pt?.code}</p>
                <p className="text-xs text-gray-600 mt-1">{pt?.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  };

  const renderArusKas = () => {
    const handlePTChange = (ptCode) => {
      setSelectedPT(prev => {
        if (prev.includes(ptCode)) {
          return prev.filter(p => p !== ptCode);
        } else {
          return [...prev, ptCode];
        }
      });
    };

    const { masuk, keluar, saldo } = hitungSaldoKas(selectedPT);

    return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Arus Kas Kecil</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <button 
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
              onClick={() => document.getElementById('pt-dropdown').classList.toggle('hidden')}
            >
              {selectedPT.length > 0 ? `${selectedPT.length} PT Dipilih` : 'Pilih PT'}
              <span className="text-xs">▼</span>
            </button>
            <div id="pt-dropdown" className="hidden absolute top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[200px]">
              {currentUserData?.accessPT?.map(code => (
                <label key={code} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedPT.includes(code)}
                    onChange={() => handlePTChange(code)}
                    className="mr-2"
                  />
                  <span className="text-sm">{code}</span>
                </label>
              ))}
            </div>
          </div>
          <input type="date" className="px-4 py-2 border rounded-lg" />
          <button 
            onClick={() => handleExportPDF('kas')}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>
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
              {currentUserData?.accessPT?.map(code => (
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
            disabled={isLoadingKas}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
              isLoadingKas 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            <Plus size={18} />
            {isLoadingKas ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
          <button 
            onClick={() => setFormKas({ tanggal: getTodayDate(), pt: '', jenis: 'keluar', jumlah: '', keterangan: '' })}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Reset
          </button>
        </div>
      </div>

      <div id="content-to-export" className="bg-white rounded-lg p-6 shadow-md">
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
                <th className="px-4 py-3 text-center no-print">Status</th>
                <th className="px-4 py-3 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {getFilteredKasData(selectedPT).map(kas => {
                // Check if transaction was created today (based on created_at timestamp)
                const now = new Date();
                const createdDate = kas.created_at ? new Date(kas.created_at) : null;
                
                // Check if created today (within last 24 hours and same day in local timezone)
                let isToday = false;
                if (createdDate) {
                  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  isToday = createdDate >= todayStart;
                }
                
                // Hide non-approved transactions in print/export
                const rowClass = kas.status !== 'approved' ? 'no-print-row' : '';
                
                return (
                <tr key={kas.id} className={rowClass}>
                  <td className="px-4 py-3">{kas.tanggal}</td>
                  <td className="px-4 py-3">{kas.pt}</td>
                  <td className="px-4 py-3">{kas.keterangan}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">
                    {kas.jenis === 'masuk' ? `Rp ${kas.jumlah.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-semibold">
                    {kas.jenis === 'keluar' ? `Rp ${kas.jumlah.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center no-print">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      kas.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      kas.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {kas.status === 'approved' ? 'Approved' : kas.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center no-print">
                    {isToday && (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleOpenEditKas(kas)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteKas(kas.id, kas.keterangan)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
              <tr className="grand-total-row bg-gray-100 font-bold border-t-2 border-gray-800">
                <td colSpan="3" className="px-4 py-3 text-right">Total</td>
                <td className="px-4 py-3 text-right text-green-600">Rp {masuk.toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-right text-red-600">Rp {keluar.toLocaleString('id-ID')}</td>
                <td colSpan="2" className="px-4 py-3 no-print"></td>
              </tr>
              <tr className="grand-total-row bg-blue-50 font-bold">
                <td colSpan="3" className="px-4 py-3 text-right">Saldo Akhir</td>
                <td colSpan="2" className="px-4 py-3 text-right text-blue-600 text-lg">Rp {saldo.toLocaleString('id-ID')}</td>
                <td colSpan="2" className="no-print"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

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
            <label className="block text-sm font-medium mb-2">Total</label>
            <input 
              type="text" 
              value={`Rp ${hitungTotalPenjualan().total.toLocaleString('id-ID')}`}
              readOnly 
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 font-bold text-green-600" 
            />
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold">Rp {hitungTotalPenjualan().total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-700">PPN ({formPenjualan.ppnPercent}%):</span>
            <span className="font-semibold">Rp {hitungTotalPenjualan().ppn.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-base mt-2 pt-2 border-t border-blue-300">
            <span className="font-bold text-gray-800">Total + PPN:</span>
            <span className="font-bold text-blue-600">Rp {(hitungTotalPenjualan().total + hitungTotalPenjualan().ppn).toLocaleString('id-ID')}</span>
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
            onClick={() => setFormPenjualan({ tanggal: getTodayDate(), pt: '', pangkalan: '', qty: '', ppnPercent: 11, metodeBayar: 'cash' })}
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
    const handlePTChange = (ptCode) => {
      setSelectedPT(prev => {
        if (prev.includes(ptCode)) {
          return prev.filter(p => p !== ptCode);
        } else {
          return [...prev, ptCode];
        }
      });
      setShowLaporanPreview(false); // Reset preview saat PT berubah
    };

    const handleTampilkanLaporan = () => {
      if (selectedPT.length === 0) {
        alert('Mohon pilih minimal 1 PT terlebih dahulu!');
        return;
      }
      setShowLaporanPreview(true);
    };

    // Hitung Laba Rugi dari data real
    const hitungLabaRugi = () => {
      // Filter data berdasarkan PT dan bulan yang dipilih
      const [year, month] = selectedMonth.split('-');
      
      // Penjualan Gas LPG (hanya yang approved)
      const penjualanFiltered = penjualanData.filter(item => {
        if (!selectedPT.includes(item.pt)) return false;
        const itemDate = new Date(item.tanggal);
        return itemDate.getFullYear() === parseInt(year) && 
               (itemDate.getMonth() + 1) === parseInt(month);
      });
      const totalPenjualan = penjualanFiltered.reduce((sum, item) => 
        sum + (item.jumlah_tabung * item.harga_per_tabung), 0
      );

      // Pendapatan Lain & Pengeluaran dari Kas Kecil (hanya yang approved)
      const kasFiltered = kasKecilData.filter(item => {
        if (!selectedPT.includes(item.pt)) return false;
        if (item.status !== 'approved') return false;
        const itemDate = new Date(item.tanggal);
        return itemDate.getFullYear() === parseInt(year) && 
               (itemDate.getMonth() + 1) === parseInt(month);
      });

      const pendapatanLain = kasFiltered
        .filter(item => item.jenis === 'masuk')
        .reduce((sum, item) => sum + item.jumlah, 0);

      const totalPengeluaran = kasFiltered
        .filter(item => item.jenis === 'keluar')
        .reduce((sum, item) => sum + item.jumlah, 0);

      const totalPendapatan = totalPenjualan + pendapatanLain;
      const labaBersih = totalPendapatan - totalPengeluaran;

      return {
        penjualanGas: totalPenjualan,
        pendapatanLain,
        totalPendapatan,
        totalPengeluaran,
        labaBersih
      };
    };

    const laporanData = hitungLabaRugi();

    return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Laporan Laba Rugi</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <button 
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
              onClick={() => document.getElementById('pt-dropdown-laporan').classList.toggle('hidden')}
            >
              {selectedPT.length > 0 ? `${selectedPT.length} PT Dipilih` : 'Pilih PT'}
              <span className="text-xs">▼</span>
            </button>
            <div id="pt-dropdown-laporan" className="hidden absolute top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[200px]">
              {currentUserData?.accessPT?.map(code => (
                <label key={code} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedPT.includes(code)}
                    onChange={() => handlePTChange(code)}
                    className="mr-2"
                  />
                  <span className="text-sm">{code}</span>
                </label>
              ))}
            </div>
          </div>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setShowLaporanPreview(false); // Reset preview saat bulan berubah
            }}
            className="px-4 py-2 border rounded-lg" 
          />
          <button 
            onClick={handleTampilkanLaporan}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <BarChart3 size={18} />
            Tampilkan Laporan
          </button>
          {showLaporanPreview && (
          <button 
            onClick={() => handleExportPDF('labarugi')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>
          )}
        </div>
      </div>

      {!showLaporanPreview && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-12 shadow-md border-2 border-blue-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
              <BarChart3 className="text-blue-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Siap Membuat Laporan Laba Rugi</h3>
            <p className="text-gray-600 mb-6">
              Pilih PT dan periode bulan, kemudian klik tombol "Tampilkan Laporan" untuk melihat rincian laba rugi
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <AlertCircle size={16} />
              <span>Pastikan PT sudah dipilih sebelum menampilkan laporan</span>
            </div>
          </div>
        </div>
      )}

      {showLaporanPreview && (
      <div id="content-to-export" className="bg-white rounded-lg p-6 shadow-md">
          <div className="labarugi-section mb-8">
            <div className="labarugi-title">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">PENDAPATAN</p>
          </div>
          
            <div className="mb-4">
              <div className="labarugi-item">
                <span className="labarugi-item-label">Penjualan Gas LPG</span>
                <span className="labarugi-item-value">Rp {laporanData.penjualanGas.toLocaleString('id-ID')}</span>
          </div>
          
              <div className="labarugi-item">
                <span className="labarugi-item-label">Pendapatan Lain (Kas Masuk)</span>
                <span className="labarugi-item-value">Rp {laporanData.pendapatanLain.toLocaleString('id-ID')}</span>
          </div>
        </div>

            <div className="labarugi-total">
              <span className="labarugi-total-label">Total Pendapatan</span>
              <span className="labarugi-total-value" style={{color: '#059669'}}>Rp {laporanData.totalPendapatan.toLocaleString('id-ID')}</span>
          </div>
          </div>
          
          <div className="labarugi-section mb-8">
            <div className="labarugi-title">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">PENGELUARAN</p>
          </div>
          
            <div className="mb-4">
              <div className="labarugi-item">
                <span className="labarugi-item-label">Total Pengeluaran (Kas Keluar)</span>
                <span className="labarugi-item-value">Rp {laporanData.totalPengeluaran.toLocaleString('id-ID')}</span>
          </div>
        </div>

            <div className="labarugi-total">
              <span className="labarugi-total-label">Total Pengeluaran</span>
              <span className="labarugi-total-value" style={{color: '#dc2626'}}>Rp {laporanData.totalPengeluaran.toLocaleString('id-ID')}</span>
          </div>
        </div>

          <div className={`labarugi-nett border-2 rounded-lg p-5 ${laporanData.labaBersih >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <span className="labarugi-nett-label">{laporanData.labaBersih >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</span>
            <span className="labarugi-nett-value" style={{color: laporanData.labaBersih >= 0 ? '#059669' : '#dc2626'}}>
              Rp {Math.abs(laporanData.labaBersih).toLocaleString('id-ID')}
            </span>
      </div>
        </div>
      )}
    </div>
    );
  };

  const renderMasterAdmin = () => {
    const handleFiturChange = (fiturId) => {
      setFormUser(prev => {
        const newFitur = prev.fiturAkses.includes(fiturId)
          ? prev.fiturAkses.filter(f => f !== fiturId)
          : [...prev.fiturAkses, fiturId];
        return { ...prev, fiturAkses: newFitur };
      });
    };

    const handlePTAccessChange = (ptCode) => {
      setFormUser(prev => {
        const newPT = prev.aksesPT.includes(ptCode)
          ? prev.aksesPT.filter(p => p !== ptCode)
          : [...prev.aksesPT, ptCode];
        return { ...prev, aksesPT: newPT };
      });
    };

    return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Master Admin</h2>
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
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
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {userList.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {user.accessPT && user.accessPT.length === ptList.length ? 'Semua PT' : user.accessPT?.join(', ') || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Aktif</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Tambah User Baru</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formUser.nama}
                    onChange={(e) => setFormUser({...formUser, nama: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={formUser.username}
                    onChange={(e) => setFormUser({...formUser, username: e.target.value})}
                    placeholder="Masukkan username"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={formUser.password}
                    onChange={(e) => setFormUser({...formUser, password: e.target.value})}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Jabatan</label>
                  <input
                    type="text"
                    value={formUser.jabatan}
                    onChange={(e) => setFormUser({...formUser, jabatan: e.target.value})}
                    placeholder="Contoh: Manager, Staff, dll"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Akses Fitur Aplikasi</label>
                <div className="grid grid-cols-2 gap-3">
                  {mainMenuItems.map(item => (
                    <label key={item.id} className="flex items-center px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUser.fiturAkses.includes(item.id)}
                        onChange={() => handleFiturChange(item.id)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Akses PT</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ptList.map(pt => (
                    <label key={pt.code} className="flex items-center px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUser.aksesPT.includes(pt.code)}
                        onChange={() => handlePTAccessChange(pt.code)}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-sm font-bold block">{pt.code}</span>
                        <span className="text-xs text-gray-500">{pt.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleSaveUser}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Simpan User
              </button>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Edit User</h3>
              <button 
                onClick={() => setShowEditUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formUser.nama}
                    onChange={(e) => setFormUser({...formUser, nama: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={formUser.username}
                    onChange={(e) => setFormUser({...formUser, username: e.target.value})}
                    placeholder="Masukkan username"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={formUser.password}
                    onChange={(e) => setFormUser({...formUser, password: e.target.value})}
                    placeholder="Kosongkan jika tidak diubah"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Jabatan</label>
                  <input
                    type="text"
                    value={formUser.jabatan}
                    onChange={(e) => setFormUser({...formUser, jabatan: e.target.value})}
                    placeholder="Contoh: Manager, Staff, dll"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Akses Fitur Aplikasi</label>
                <div className="grid grid-cols-2 gap-3">
                  {mainMenuItems.map(item => (
                    <label key={item.id} className="flex items-center px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUser.fiturAkses.includes(item.id)}
                        onChange={() => handleFiturChange(item.id)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Akses PT</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ptList.map(pt => (
                    <label key={pt.code} className="flex items-center px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUser.aksesPT.includes(pt.code)}
                        onChange={() => handlePTAccessChange(pt.code)}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-sm font-bold block">{pt.code}</span>
                        <span className="text-xs text-gray-500">{pt.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleUpdateUser}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Update User
              </button>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderDetailKas = () => {
    const handlePTChange = (ptCode) => {
      setSelectedPT(prev => {
        if (prev.includes(ptCode)) {
          return prev.filter(p => p !== ptCode);
        } else {
          return [...prev, ptCode];
        }
      });
    };

    const { masuk, keluar, saldo } = hitungSaldoKas(selectedPT);
    const hasApprovalAccess = currentUserData?.fiturAkses?.includes('detail-kas') || currentUserData?.role === 'Master User';

    return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Detail Kas Kecil</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <button 
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
              onClick={() => document.getElementById('pt-dropdown-detail').classList.toggle('hidden')}
            >
              {selectedPT.length > 0 ? `${selectedPT.length} PT Dipilih` : 'Pilih PT'}
              <span className="text-xs">▼</span>
            </button>
            <div id="pt-dropdown-detail" className="hidden absolute top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[200px]">
              {currentUserData?.accessPT?.map(code => (
                <label key={code} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedPT.includes(code)}
                    onChange={() => handlePTChange(code)}
                    className="mr-2"
                  />
                  <span className="text-sm">{code}</span>
                </label>
              ))}
            </div>
          </div>
          <input type="date" className="px-4 py-2 border rounded-lg" />
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Informasi Fitur Detail Kas</h4>
            <p className="text-sm text-blue-800">
              Fitur ini khusus untuk melihat detail transaksi kas kecil dan melakukan approval/reject transaksi di atas Rp 300.000. 
              {hasApprovalAccess ? ' Anda memiliki akses untuk approve/reject transaksi.' : ' Anda hanya bisa melihat data tanpa approval.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Detail Transaksi Kas Kecil</h3>
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
                {hasApprovalAccess && (
                  <th className="px-4 py-3 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {getFilteredKasData(selectedPT).map(kas => (
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
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      kas.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      kas.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {kas.status === 'approved' ? 'Approved' : kas.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  {hasApprovalAccess && (
                    <td className="px-4 py-3 text-center">
                      {kas.status === 'pending' && currentUserData?.accessPT?.includes(kas.pt) && (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleApproveKas(kas.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectKas(kas.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {kas.status === 'pending' && !currentUserData?.accessPT?.includes(kas.pt) && (
                        <span className="text-xs text-gray-500 italic">No access</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              <tr className="grand-total-row bg-gray-100 font-bold border-t-2 border-gray-800">
                <td colSpan="3" className="px-4 py-3 text-right">Total</td>
                <td className="px-4 py-3 text-right text-green-600">Rp {masuk.toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-right text-red-600">Rp {keluar.toLocaleString('id-ID')}</td>
                <td colSpan={hasApprovalAccess ? "2" : "1"} className="px-4 py-3"></td>
              </tr>
              <tr className="grand-total-row bg-blue-50 font-bold">
                <td colSpan="3" className="px-4 py-3 text-right">Saldo Akhir</td>
                <td colSpan={hasApprovalAccess ? "4" : "3"} className="px-4 py-3 text-right text-blue-600 text-lg">Rp {saldo.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'beranda': return renderBeranda();
      case 'arus-kas': return renderArusKas();
      case 'detail-kas': return renderDetailKas();
      case 'penjualan': return renderPenjualan();
      case 'laporan': return renderLaporan();
      case 'master-admin': return renderMasterAdmin();
      default: return renderBeranda();
    }
  };

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

        <header className="md:hidden bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 py-4">
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

        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {renderContent()}
          </div>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="flex justify-around items-center py-2">
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
      </div>
    </div>
  );
};

export default SumberJayaApp;