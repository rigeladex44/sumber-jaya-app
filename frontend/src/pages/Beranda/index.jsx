/**
 * Beranda (Home) Page Component
 * Dashboard with stats and recent transactions widgets
 * UI/UX revamped for a premium fintech feel
 */
import React, { useState, useMemo } from 'react';
import {
  Wallet, Package, ArrowDownCircle, Clock, Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle
} from 'lucide-react';
import { PT_LIST } from '../../utils/constants';
import { getLocalDateString, getLocalDateFromISO } from '../../utils/dateHelpers';

const Beranda = ({
  currentUserData,
  dashboardStats,
  isLoadingStats,
  kasKecilData,
  penjualanData,
  arusKasData,
  onSetActiveMenu,
  onApprove,
  onReject
}) => {
  // Check user access for widgets
  const hasKasKecilAccess = currentUserData?.role === 'Master User' || currentUserData?.fiturAkses?.includes('kas-kecil');
  const hasDetailKasAccess = currentUserData?.role === 'Master User' || currentUserData?.fiturAkses?.includes('detail-kas');
  const hasPenjualanAccess = currentUserData?.role === 'Master User' || currentUserData?.fiturAkses?.includes('penjualan');
  const hasArusKasAccess = currentUserData?.role === 'Master User' || currentUserData?.fiturAkses?.includes('arus-kas');

  const accessPT = useMemo(() => {
    return Array.isArray(currentUserData?.accessPT) ? currentUserData.accessPT : [];
  }, [currentUserData?.accessPT]);

  // Sort accessPT based on transaction count in Arus Kas (descending)
  const sortedAccessPT = useMemo(() => {
    if (accessPT.length <= 1 || !Array.isArray(arusKasData)) return accessPT;
    
    const counts = {};
    accessPT.forEach(pt => {
      counts[pt] = arusKasData.filter(item => item && item.pt === pt).length;
    });
    
    return [...accessPT].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  }, [accessPT, arusKasData]);

  const [activeChartIndex, setActiveChartIndex] = useState(0);

  const handlePrevChart = () => {
    setActiveChartIndex(prev => (prev === 0 ? sortedAccessPT.length - 1 : prev - 1));
  };

  const handleNextChart = () => {
    setActiveChartIndex(prev => (prev === sortedAccessPT.length - 1 ? 0 : prev + 1));
  };

  const activePTCode = sortedAccessPT[activeChartIndex] || '';

  const getChartDataForPT = (ptCode) => {
    if (!Array.isArray(arusKasData)) return [];
    
    // Filter Arus Kas for this PT
    const ptData = arusKasData.filter(item => item && item.pt === ptCode);
    
    // Group by date
    const grouped = {};
    ptData.forEach(item => {
      if (!item.tanggal) return;
      const dateStr = new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, rawDate: new Date(item.tanggal), masuk: 0, keluar: 0 };
      }
      if (item.jenis === 'masuk') {
        grouped[dateStr].masuk += parseFloat(item.jumlah) || 0;
      } else if (item.jenis === 'keluar') {
        grouped[dateStr].keluar += parseFloat(item.jumlah) || 0;
      }
    });
    
    // Sort by date ascending
    const sortedData = Object.values(grouped)
      .sort((a, b) => a.rawDate - b.rawDate)
      .slice(-7); // Take last 7 days of transactions
      
    return sortedData;
  };

  const renderChart = (chartData) => {
    if (chartData.length === 0) {
      return (
        <div className="h-[180px] flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <span>Belum ada transaksi Arus Kas untuk PT {activePTCode}</span>
        </div>
      );
    }
    
    const maxVal = Math.max(
      ...chartData.map(d => Math.max(d.masuk, d.keluar)),
      100000 // default minimum scale
    );
    
    const height = 160;
    const width = 500;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const barWidth = Math.max(6, Math.min(16, chartWidth / (chartData.length * 3.5)));
    
    return (
      <div className="w-full overflow-x-auto select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[450px] h-auto">
          {/* Grid lines & Y Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = maxVal * ratio;
            return (
              <g key={idx} className="opacity-60">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#F8FAFC" strokeDasharray="3 3" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[8px] fill-slate-400 font-semibold">
                  {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : `Rp ${val}`}
                </text>
              </g>
            );
          })}
          
          {/* Bars */}
          {chartData.map((d, i) => {
            const xGroup = paddingLeft + (i * chartWidth) / chartData.length + chartWidth / (chartData.length * 4.5);
            const yMasuk = paddingTop + chartHeight * (1 - d.masuk / maxVal);
            const hMasuk = chartHeight * (d.masuk / maxVal);
            const yKeluar = paddingTop + chartHeight * (1 - d.keluar / maxVal);
            const hKeluar = chartHeight * (d.keluar / maxVal);
            
            return (
              <g key={i} className="group">
                {/* Pemasukan (Green Bar) */}
                {d.masuk > 0 && (
                  <rect
                    x={xGroup}
                    y={yMasuk}
                    width={barWidth}
                    height={hMasuk}
                    rx="1.5"
                    className="fill-emerald-500 hover:fill-emerald-600 transition-colors cursor-pointer"
                  >
                    <title>{`Pemasukan: Rp ${d.masuk.toLocaleString('id-ID')}`}</title>
                  </rect>
                )}
                {/* Pengeluaran (Red Bar) */}
                {d.keluar > 0 && (
                  <rect
                    x={xGroup + barWidth + 3}
                    y={yKeluar}
                    width={barWidth}
                    height={hKeluar}
                    rx="1.5"
                    className="fill-rose-500 hover:fill-rose-600 transition-colors cursor-pointer"
                  >
                    <title>{`Pengeluaran: Rp ${d.keluar.toLocaleString('id-ID')}`}</title>
                  </rect>
                )}
                
                {/* X Axis Label */}
                <text
                  x={xGroup + barWidth + 1.5}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[8px] fill-slate-400 font-semibold"
                >
                  {d.date}
                </text>
              </g>
            );
          })}
          
          {/* X Axis Line */}
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#E2E8F0" />
        </svg>
      </div>
    );
  };

  // Get recent transactions for each widget (safeguarded against null data)
  const getRecentKasKecil = () => {
    if (!Array.isArray(kasKecilData)) return [];
    return kasKecilData
      .filter(item => item && (accessPT.length === 0 || accessPT.includes(item.pt)))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  };

  const getPendingApprovals = () => {
    if (!Array.isArray(kasKecilData)) return [];
    return kasKecilData
      .filter(item =>
        item && item.status === 'pending' && (accessPT.length === 0 || accessPT.includes(item.pt))
      )
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  };

  const getRecentPenjualan = () => {
    if (!Array.isArray(penjualanData)) return [];
    const today = getLocalDateString();
    return penjualanData
      .filter(item => {
        if (!item) return false;
        const itemDate = getLocalDateFromISO(item.tanggal);
        return itemDate === today && (accessPT.length === 0 || accessPT.includes(item.pt));
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  };

  const getRecentArusKas = () => {
    if (!Array.isArray(arusKasData)) return [];
    return arusKasData
      .filter(item => item && (accessPT.length === 0 || accessPT.includes(item.pt)))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10 pt-2">
      {/* Welcome Header (Premium Dark Card) */}
      <div className="relative bg-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-lg overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500 opacity-[0.15] blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500 opacity-[0.15] blur-3xl pointer-events-none"></div>
        
        {/* Transparent Logo Watermark */}
        <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 opacity-30 pointer-events-none z-0 flex items-center justify-center">
          <img 
            src={accessPT.length === 1 ? `/images/logo_${accessPT[0].toLowerCase()}.png` : '/images/logo_grup.png'} 
            alt="Watermark Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              const filePrefix = accessPT.length === 1 ? accessPT[0].toLowerCase() : 'grup';
              const currentSrc = e.target.src;
              const base = `${window.location.origin}/images/logo_${filePrefix}`;
              
              if (currentSrc.endsWith('.png')) {
                e.target.src = `${base}.jpeg`;
              } else if (currentSrc.endsWith('.jpeg')) {
                e.target.src = `${base}.jpg`;
              } else if (currentSrc.endsWith('.jpg')) {
                e.target.src = `${base}.webp`;
              } else {
                e.target.onerror = null;
                e.target.src = '/images/logo.png';
              }
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1 tracking-tight">Selamat Datang, {currentUserData?.name} 👋</h2>
            <p className="text-slate-400 text-sm md:text-base font-medium mb-3">{currentUserData?.role}</p>
            <div className="inline-flex items-center gap-2 bg-slate-800/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/50">
              <Calendar size={15} className="text-blue-400" />
              <span className="text-xs md:text-sm font-medium text-slate-300">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Summary Stats Cards (Clean layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {hasDetailKasAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:border-amber-200 transition-colors"
               onClick={() => onSetActiveMenu('detail-kas')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 md:p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">Pending Approval</p>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-100 rounded w-full mt-auto"></div>
            ) : (
              <div className="mt-auto">
                <p className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{dashboardStats.pendingApproval} <span className="text-sm font-medium text-gray-400">Trx</span></p>
              </div>
            )}
          </div>
        )}

        {hasPenjualanAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:border-indigo-200 transition-colors"
               onClick={() => onSetActiveMenu('penjualan')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 md:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Package size={20} strokeWidth={2.5} />
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Penjualan Hari Ini</p>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-100 rounded w-1/3"></div>
            ) : (
              <div className="flex items-baseline gap-2 sm:gap-4 mt-auto flex-wrap">
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                  {dashboardStats.penjualanQty.toLocaleString('id-ID')} <span className="text-sm md:text-base font-semibold text-gray-500">Tabung</span>
                </p>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <p className="text-lg sm:text-xl font-bold text-indigo-600">
                  Rp {dashboardStats.penjualanNilai.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Section (Carousel of Arus Kas charts) */}
      {sortedAccessPT.length > 0 && hasArusKasAccess && (
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          {/* Header Carousel */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base md:text-lg font-bold text-slate-800">Tren Arus Kas (7 Hari Terakhir)</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  PT {activePTCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">Perbandingan pemasukan dan pengeluaran harian arus kas</p>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-4">
              {/* Legend */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                  <span>Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <div className="w-2.5 h-2.5 rounded bg-rose-500"></div>
                  <span>Pengeluaran</span>
                </div>
              </div>

              {/* Navigasi Slide */}
              {sortedAccessPT.length > 1 && (
                <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                  <button 
                    onClick={handlePrevChart}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-slate-600"
                    title="PT Sebelumnya"
                  >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-bold text-slate-600 min-w-[36px] text-center">
                    {activeChartIndex + 1} / {sortedAccessPT.length}
                  </span>
                  <button 
                    onClick={handleNextChart}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-slate-600"
                    title="PT Selanjutnya"
                  >
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Chart SVG */}
          {renderChart(getChartDataForPT(activePTCode))}
          
          {/* Slide Dots / Indicators */}
          {sortedAccessPT.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {sortedAccessPT.map((ptCode, idx) => (
                <button
                  key={ptCode}
                  onClick={() => setActiveChartIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeChartIndex ? 'bg-blue-600 w-3' : 'bg-gray-200 hover:bg-gray-300'}`}
                  title={`Tampilkan PT ${ptCode}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Widgets (Compact Lists without heavy borders) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* Widget: Pending Approvals (Highlighted) */}
        {hasDetailKasAccess && getPendingApprovals().length > 0 && (
          <div className="bg-amber-50/50 rounded-2xl p-4 md:p-6 shadow-sm border border-amber-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock size={16} strokeWidth={2.5} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-amber-900">Menunggu Persetujuan</h3>
              </div>
              <button onClick={() => onSetActiveMenu('detail-kas')} className="text-xs md:text-sm text-amber-600 hover:text-amber-800 font-bold flex items-center">
                Lihat Semua <ChevronRight size={14} className="ml-0.5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {getPendingApprovals().map(kas => (
                <div key={kas.id} className="bg-white rounded-xl p-3 shadow-sm border border-amber-100/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-sm text-gray-900">{kas.pt}</span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[11px] font-medium text-gray-500">{new Date(kas.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-1">{kas.keterangan}</p>
                    </div>
                    <p className={`text-sm font-bold whitespace-nowrap ${kas.jenis === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {kas.jenis === 'keluar' ? '-' : '+'} Rp {(kas.jumlah || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button onClick={() => onApprove(kas.id)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => onReject(kas.id)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-500 hover:text-white transition-colors">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Widget: Kas Kecil - Recent Transactions */}
        {hasKasKecilAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet size={16} strokeWidth={2.5} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800">Kas Kecil Terbaru</h3>
              </div>
              <button onClick={() => onSetActiveMenu('kas-kecil')} className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center">
                Lihat Semua <ChevronRight size={14} className="ml-0.5" />
              </button>
            </div>
            <div className="flex flex-col">
              {getRecentKasKecil().length > 0 ? (
                getRecentKasKecil().map((kas, idx) => (
                  <div key={kas.id} className={`flex justify-between items-center py-3 ${idx !== getRecentKasKecil().length -1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-sm text-gray-900">{kas.pt}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          kas.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                          kas.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {kas.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{kas.keterangan}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold whitespace-nowrap ${kas.jenis === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {kas.jenis === 'keluar' ? '-' : '+'} Rp {(kas.jumlah || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(kas.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">Belum ada transaksi</p>
              )}
            </div>
          </div>
        )}

        {/* Widget: Penjualan - Today's Sales */}
        {hasPenjualanAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package size={16} strokeWidth={2.5} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800">Penjualan Hari Ini</h3>
              </div>
              <button onClick={() => onSetActiveMenu('penjualan')} className="text-xs md:text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center">
                Lihat Semua <ChevronRight size={14} className="ml-0.5" />
              </button>
            </div>
            <div className="flex flex-col">
              {getRecentPenjualan().length > 0 ? (
                getRecentPenjualan().map((item, idx) => (
                  <div key={item.id} className={`flex justify-between items-center py-3 ${idx !== getRecentPenjualan().length -1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-sm text-gray-900">{item.pt}</span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-xs font-semibold text-gray-700">{item.pangkalan}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{item.qty} Tabung × Rp {(item.harga || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600 whitespace-nowrap">
                        Rp {(item.total || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {item.metode_bayar === 'cash' ? 'Cash' : 'Cashless'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">Belum ada penjualan hari ini</p>
              )}
            </div>
          </div>
        )}

        {/* Widget: Arus Kas - Recent Transactions */}
        {hasArusKasAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ArrowDownCircle size={16} strokeWidth={2.5} />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800">Arus Kas Terbaru</h3>
              </div>
              <button onClick={() => onSetActiveMenu('arus-kas')} className="text-xs md:text-sm text-purple-600 hover:text-purple-800 font-bold flex items-center">
                Lihat Semua <ChevronRight size={14} className="ml-0.5" />
              </button>
            </div>
            <div className="flex flex-col">
              {getRecentArusKas().length > 0 ? (
                getRecentArusKas().map((item, idx) => (
                  <div key={item.id} className={`flex justify-between items-center py-3 ${idx !== getRecentArusKas().length -1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-sm text-gray-900">{item.pt}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                          {item.metode === 'cash' ? 'Cash' : 'Cashless'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.keterangan}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold whitespace-nowrap ${item.jenis === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.jenis === 'keluar' ? '-' : '+'} Rp {(item.jumlah || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(item.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">Belum ada transaksi</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PT Access List */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">PT Yang Dapat Diakses</h3>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {currentUserData?.accessPT?.map(code => {
            const pt = PT_LIST.find(p => p.code === code);
            return (
              <div key={code} className="inline-flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default">
                <span className="font-bold text-gray-900 text-sm">{pt?.code}</span>
                <span className="text-[11px] text-gray-500 hidden sm:inline-block max-w-[120px] truncate">{pt?.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Beranda;
