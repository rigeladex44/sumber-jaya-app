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
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 lg:p-8 text-white shadow-lg">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1">Selamat Datang, {currentUserData?.name}!</h2>
          <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg">{currentUserData?.role}</p>
        </div>

        <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="md:hidden" />
            <Calendar size={16} className="hidden md:block" />
            <span className="text-xs md:text-sm">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {hasKasKecilAccess && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-600">Kas Kecil</p>
              <DollarSign className="text-blue-600" size={20} />
            </div>
            {isLoadingStats ? (
              <p className="text-lg md:text-2xl font-bold text-gray-400">Loading...</p>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">
                  Rp {dashboardStats.kasKecilSaldoAkhir.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500 mt-1 md:mt-2">Saldo akhir hari ini</p>
              </>
            )}
          </div>
        )}

        {hasKasKecilAccess && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-600">Pemasukan Hari Ini</p>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            {isLoadingStats ? (
              <p className="text-lg md:text-2xl font-bold text-gray-400">Loading...</p>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
                  Rp {dashboardStats.kasKecilPemasukanHariIni.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-green-600 mt-1 md:mt-2 font-medium">Kas Kecil approved</p>
              </>
            )}
          </div>
        )}

        {hasPenjualanAccess && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md border-l-4 border-gray-700">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-600">Penjualan Hari Ini</p>
              <ShoppingCart className="text-gray-700" size={20} />
            </div>
            {isLoadingStats ? (
              <p className="text-lg md:text-2xl font-bold text-gray-400">Loading...</p>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">
                  {dashboardStats.penjualanQty.toLocaleString('id-ID')} Tabung
                </p>
                <p className="text-xs text-gray-500 mt-1 md:mt-2">
                  Rp {dashboardStats.penjualanNilai.toLocaleString('id-ID')}
                </p>
              </>
            )}
          </div>
        )}

        {hasDetailKasAccess && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => onSetActiveMenu('detail-kas')}>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-600">Pending Approval</p>
              <AlertCircle className="text-yellow-500" size={20} />
            </div>
            {isLoadingStats ? (
              <p className="text-lg md:text-2xl font-bold text-gray-400">...</p>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{dashboardStats.pendingApproval}</p>
                <p className="text-xs text-yellow-600 mt-1 md:mt-2 font-medium">
                  {dashboardStats.pendingApproval > 0 ? 'Klik untuk approve/reject' : 'Semua sudah disetujui'}
                </p>
              </>
            )}
          </div>
        )}

        {hasKasKecilAccess && (
          <div className="bg-white rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-600">Pengeluaran Hari Ini</p>
              <TrendingDown className="text-red-500" size={20} />
            </div>
            {isLoadingStats ? (
              <p className="text-lg md:text-2xl font-bold text-gray-400">Loading...</p>
            ) : (
              <>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600">
                  Rp {dashboardStats.kasKecilPengeluaranHariIni.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-red-600 mt-1 md:mt-2 font-medium">Kas Kecil approved</p>
              </>
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
