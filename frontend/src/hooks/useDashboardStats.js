/**
 * Dashboard Statistics Hook
 * Manages dashboard stats fetching and state
 */
import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';

export const useDashboardStats = (isLoggedIn, activeMenu) => {
  const [dashboardStats, setDashboardStats] = useState({
    kasKecilSaldoAkhir: 0,
    kasKecilPemasukanHariIni: 0,
    kasKecilPengeluaranHariIni: 0,
    penjualanQty: 0,
    penjualanNilai: 0,
    pendingApproval: 0
  });
  
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || activeMenu !== 'beranda') return;

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
  }, [isLoggedIn, activeMenu]);

  return {
    dashboardStats,
    isLoadingStats
  };
};
