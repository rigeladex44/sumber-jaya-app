/**
 * Beranda (Home) Page Component
 * Dashboard with stats and recent transactions widgets
 */
import React from 'react';
import {
  DollarSign, ShoppingCart, TrendingUp, TrendingDown, AlertCircle, Calendar
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
    <div className="space-y-5 md:space-y-6">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 lg:p-8 text-white shadow-xl overflow-hidden border border-gray-800">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500 opacity-10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-purple-500 opacity-10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight">Selamat Datang, {currentUserData?.name}!</h2>
          <p className="text-gray-400 text-sm md:text-base font-medium">{currentUserData?.role}</p>
        </div>

        <div className="relative z-10 mt-6 md:mt-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-sm">
            <Calendar size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-gray-100">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {hasKasKecilAccess && (
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-blue-600"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Kas Kecil</p>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <DollarSign size={20} strokeWidth={2.5} />
              </div>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2"></div>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-gray-800" title={`Rp ${dashboardStats.kasKecilSaldoAkhir.toLocaleString('id-ID')}`}>
                  Rp {dashboardStats.kasKecilSaldoAkhir.toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium">Saldo akhir hari ini</p>
              </>
            )}
          </div>
        )}

        {hasKasKecilAccess && (
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-green-400 to-green-600"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Pemasukan Hari Ini</p>
              <div className="p-2.5 bg-green-50 text-green-500 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2"></div>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-gray-800" title={`Rp ${dashboardStats.kasKecilPemasukanHariIni.toLocaleString('id-ID')}`}>
                  Rp {dashboardStats.kasKecilPemasukanHariIni.toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-green-700 mt-2 font-semibold bg-green-50 inline-block px-2.5 py-1 rounded-md">Kas Kecil approved</p>
              </>
            )}
          </div>
        )}

        {hasKasKecilAccess && (
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-400 to-red-600"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Pengeluaran Hari Ini</p>
              <div className="p-2.5 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                <TrendingDown size={20} strokeWidth={2.5} />
              </div>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2"></div>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-gray-800" title={`Rp ${dashboardStats.kasKecilPengeluaranHariIni.toLocaleString('id-ID')}`}>
                  Rp {dashboardStats.kasKecilPengeluaranHariIni.toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-red-700 mt-2 font-semibold bg-red-50 inline-block px-2.5 py-1 rounded-md">Kas Kecil approved</p>
              </>
            )}
          </div>
        )}

        {hasDetailKasAccess && (
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-pointer"
               onClick={() => onSetActiveMenu('detail-kas')}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-yellow-400 to-yellow-600"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Pending Approval</p>
              <div className="p-2.5 bg-yellow-50 text-yellow-500 rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
                <AlertCircle size={20} strokeWidth={2.5} />
              </div>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-1/4"></div>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{dashboardStats.pendingApproval}</p>
                <p className={`text-xs sm:text-sm mt-2 font-semibold inline-block px-2.5 py-1 rounded-md ${dashboardStats.pendingApproval > 0 ? 'text-yellow-700 bg-yellow-50' : 'text-gray-600 bg-gray-50'}`}>
                  {dashboardStats.pendingApproval > 0 ? 'Klik untuk approve/reject' : 'Semua sudah disetujui'}
                </p>
              </>
            )}
          </div>
        )}

        {hasPenjualanAccess && (
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group xl:col-span-2">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gray-600 to-gray-800"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Penjualan Hari Ini</p>
              <div className="p-2.5 bg-gray-100 text-gray-700 rounded-xl group-hover:bg-gray-800 group-hover:text-white transition-colors duration-300">
                <ShoppingCart size={20} strokeWidth={2.5} />
              </div>
            </div>
            {isLoadingStats ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2"></div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {dashboardStats.penjualanQty.toLocaleString('id-ID')} <span className="text-sm font-semibold text-gray-500">Tabung</span>
                </p>
                <div className="hidden sm:block w-px h-6 bg-gray-200 mb-1"></div>
                <p className="text-lg sm:text-xl font-bold text-gray-600">
                  Rp {dashboardStats.penjualanNilai.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Widgets Based on User Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* Widget: Detail Kas - Pending Approvals */}
        {hasDetailKasAccess && getPendingApprovals().length > 0 && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border-t-4 border-yellow-500">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle className="text-yellow-500" size={18} />
                <span className="text-sm md:text-base">Menunggu Persetujuan</span>
              </h3>
              <button
                onClick={() => onSetActiveMenu('detail-kas')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Lihat Semua →
              </button>
            </div>
            <div className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
              {getPendingApprovals().map(kas => (
                <div key={kas.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 md:p-4 hover:bg-yellow-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm md:text-base text-gray-800">{kas.pt}</span>
                        <span className="text-xs px-2 py-0.5 md:py-1 bg-yellow-200 text-yellow-800 rounded-full whitespace-nowrap">
                          {kas.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">{kas.keterangan}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(kas.tanggal).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm md:text-base font-bold ${kas.jenis === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                        Rp {(kas.jumlah || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-yellow-300">
                    <button
                      onClick={() => onApprove(kas.id)}
                      className="flex-1 px-3 py-1.5 md:py-2 bg-green-600 text-white rounded-lg text-xs md:text-sm hover:bg-green-700 font-medium transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => onReject(kas.id)}
                      className="flex-1 px-3 py-1.5 md:py-2 bg-red-600 text-white rounded-lg text-xs md:text-sm hover:bg-red-700 font-medium transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Widget: Kas Kecil - Recent Transactions */}
        {hasKasKecilAccess && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="text-green-500" size={18} />
                <span className="text-sm md:text-base">Kas Kecil Terbaru</span>
              </h3>
              <button
                onClick={() => onSetActiveMenu('kas-kecil')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Lihat Semua →
              </button>
            </div>
            <div className="space-y-2 max-h-80 md:max-h-96 overflow-y-auto">
              {getRecentKasKecil().length > 0 ? (
                getRecentKasKecil().map(kas => (
                  <div key={kas.id} className="border rounded-lg p-2.5 md:p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-xs md:text-sm text-gray-800">{kas.pt}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                            kas.status === 'approved' ? 'bg-green-100 text-green-700' :
                            kas.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {kas.status === 'approved' ? 'Approved' : kas.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{kas.keterangan}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(kas.tanggal).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <p className={`text-xs md:text-sm font-bold flex-shrink-0 ${kas.jenis === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                        {kas.jenis === 'masuk' ? '+' : '-'} Rp {(kas.jumlah || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8 text-sm">Belum ada transaksi</p>
              )}
            </div>
          </div>
        )}

        {/* Widget: Penjualan - Today's Sales */}
        {hasPenjualanAccess && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="text-blue-500" size={18} />
                <span className="text-sm md:text-base">Penjualan Hari Ini</span>
              </h3>
              <button
                onClick={() => onSetActiveMenu('penjualan')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Lihat Semua →
              </button>
            </div>
            <div className="space-y-2 max-h-80 md:max-h-96 overflow-y-auto">
              {getRecentPenjualan().length > 0 ? (
                getRecentPenjualan().map(item => (
                  <div key={item.id} className="border rounded-lg p-2.5 md:p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-xs md:text-sm text-gray-800">{item.pt}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                            {item.pangkalan}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{item.qty} Tabung × Rp {(item.harga || 0).toLocaleString('id-ID')}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.metode_bayar === 'cash' ? '💵 Cash' : '💳 Cashless'}
                        </p>
                      </div>
                      <p className="text-xs md:text-sm font-bold text-blue-600 flex-shrink-0">
                        Rp {(item.total || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8 text-sm">Belum ada penjualan hari ini</p>
              )}
            </div>
          </div>
        )}

        {/* Widget: Arus Kas - Recent Transactions */}
        {hasArusKasAccess && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-md border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-purple-500" size={18} />
                <span className="text-sm md:text-base">Arus Kas Terbaru</span>
              </h3>
              <button
                onClick={() => onSetActiveMenu('arus-kas')}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Lihat Semua →
              </button>
            </div>
            <div className="space-y-2 max-h-80 md:max-h-96 overflow-y-auto">
              {getRecentArusKas().length > 0 ? (
                getRecentArusKas().map(item => (
                  <div key={item.id} className="border rounded-lg p-2.5 md:p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-xs md:text-sm text-gray-800">{item.pt}</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full whitespace-nowrap">
                            {item.metode === 'cash' ? 'Cash' : 'Cashless'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{item.keterangan}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(item.tanggal).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <p className={`text-xs md:text-sm font-bold flex-shrink-0 ${item.jenis === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.jenis === 'masuk' ? '+' : '-'} Rp {(item.jumlah || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8 text-sm">Belum ada transaksi</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PT Access List */}
      <div className="bg-white rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md">
        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4">PT Yang Dapat Diakses</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {currentUserData?.accessPT?.map(code => {
            const pt = PT_LIST.find(p => p.code === code);
            return (
              <div key={code} className="border-2 border-gray-300 bg-gray-50 rounded-lg p-3 sm:p-4 hover:border-gray-900 hover:bg-gray-100 transition-all">
                <p className="font-bold text-gray-800 text-sm sm:text-base md:text-lg">{pt?.code}</p>
                <p className="text-[11px] sm:text-xs text-gray-600 mt-1 leading-snug">{pt?.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Beranda;
