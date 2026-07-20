/**
 * Beranda (Home) Page Component
 * Dashboard with stats and recent transactions widgets
 * UI/UX revamped for a premium fintech feel
 */
import React from 'react';
import {
  DollarSign, ShoppingCart, TrendingUp, TrendingDown, AlertCircle, Calendar, ChevronRight, CheckCircle, XCircle
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

  // Get recent transactions for each widget
  const getRecentKasKecil = () => {
    return kasKecilData
      .filter(item => currentUserData?.accessPT?.includes(item.pt))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  };

  const getPendingApprovals = () => {
    return kasKecilData
      .filter(item =>
        item.status === 'pending' &&
        currentUserData?.accessPT?.includes(item.pt)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  };

  const getRecentPenjualan = () => {
    const today = getLocalDateString();
    return penjualanData
      .filter(item => {
        const itemDate = getLocalDateFromISO(item.tanggal);
        return itemDate === today && currentUserData?.accessPT?.includes(item.pt);
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  };

  const getRecentArusKas = () => {
    return arusKasData
      .filter(item => currentUserData?.accessPT?.includes(item.pt))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-10 pt-2">
      {/* Welcome Header (Premium Dark Card) */}
      <div className="relative bg-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-lg overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500 opacity-[0.15] blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500 opacity-[0.15] blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1 tracking-tight">Selamat Datang, {currentUserData?.name} 👋</h2>
            <p className="text-slate-400 text-sm md:text-base font-medium">{currentUserData?.role}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/50 self-start md:self-auto">
            <Calendar size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-slate-200">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards (2 Columns on Mobile, clean layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {hasKasKecilAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 md:p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">Saldo Kas Kecil</p>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-100 rounded w-full mt-auto"></div>
            ) : (
              <div className="mt-auto">
                <p className="text-base sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight" title={`Rp ${dashboardStats.kasKecilSaldoAkhir.toLocaleString('id-ID')}`}>
                  Rp {dashboardStats.kasKecilSaldoAkhir.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        )}

        {hasKasKecilAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 md:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">Pemasukan Hari Ini</p>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-100 rounded w-full mt-auto"></div>
            ) : (
              <div className="mt-auto">
                <p className="text-base sm:text-xl md:text-2xl font-black text-emerald-600 tracking-tight" title={`Rp ${dashboardStats.kasKecilPemasukanHariIni.toLocaleString('id-ID')}`}>
                  Rp {dashboardStats.kasKecilPemasukanHariIni.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        )}

        {hasKasKecilAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 md:p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingDown size={20} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">Pengeluaran Hari Ini</p>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-100 rounded w-full mt-auto"></div>
            ) : (
              <div className="mt-auto">
                <p className="text-base sm:text-xl md:text-2xl font-black text-rose-600 tracking-tight" title={`Rp ${dashboardStats.kasKecilPengeluaranHariIni.toLocaleString('id-ID')}`}>
                  Rp {dashboardStats.kasKecilPengeluaranHariIni.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        )}

        {hasDetailKasAccess && (
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:border-amber-200 transition-colors"
               onClick={() => onSetActiveMenu('detail-kas')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 md:p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle size={20} strokeWidth={2.5} />
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
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col col-span-2 lg:col-span-4 cursor-pointer hover:border-indigo-200 transition-colors"
               onClick={() => onSetActiveMenu('penjualan')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 md:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShoppingCart size={20} strokeWidth={2.5} />
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

      {/* Dynamic Widgets (Compact Lists without heavy borders) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* Widget: Pending Approvals (Highlighted) */}
        {hasDetailKasAccess && getPendingApprovals().length > 0 && (
          <div className="bg-amber-50/50 rounded-2xl p-4 md:p-6 shadow-sm border border-amber-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertCircle size={16} strokeWidth={2.5} />
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
                  <DollarSign size={16} strokeWidth={2.5} />
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
                  <ShoppingCart size={16} strokeWidth={2.5} />
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
                  <TrendingUp size={16} strokeWidth={2.5} />
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
