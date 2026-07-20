/**
 * Detail Kas Page Component
 * Displays transaction details with approval/rejection functionality
 * UI/UX revamped for mobile-first & premium desktop feel.
 */
import React, { useState } from 'react';
import { AlertCircle, Calendar, ChevronDown, CheckCircle, XCircle, CreditCard, Banknote, Clock } from 'lucide-react';
import { filterKasData, calculateKasTotals } from '../../utils/dataFilters';

const DetailKas = ({
  kasKecilData,
  currentUserData,
  filterDetailKas,
  selectedPT,
  onFilterChange,
  onPTChange,
  onApprove,
  onReject
}) => {
  const [showPTDropdown, setShowPTDropdown] = useState(false);
  
  const handlePTChange = (ptCode) => {
    const newSelectedPT = selectedPT.includes(ptCode)
      ? selectedPT.filter(p => p !== ptCode)
      : [...selectedPT, ptCode];
    onPTChange(newSelectedPT);
  };

  // Filter and calculate totals using shared utilities
  const filteredData = filterKasData(kasKecilData, selectedPT, filterDetailKas.tanggal);
  const { masuk, keluar, saldo } = calculateKasTotals(filteredData);
  const hasApprovalAccess = currentUserData?.fiturAkses?.includes('detail-kas') || currentUserData?.role === 'Master User';

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle size={12}/> Approved</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200"><XCircle size={12}/> Rejected</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><Clock size={12}/> Pending</span>;
    }
  };

  const getMethodBadge = (method) => {
    return method === 'cash' 
      ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><Banknote size={12}/> Cash</span>
      : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><CreditCard size={12}/> Cashless</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header & Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Approval Kas Kecil</h2>
          <p className="text-sm text-gray-500 mt-1">Review dan verifikasi transaksi harian</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* PT Filter Dropdown */}
          <div className="relative">
            <button
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white flex items-center justify-between gap-3 transition-all text-sm font-medium text-gray-700"
              onClick={() => setShowPTDropdown(!showPTDropdown)}
            >
              <span>{selectedPT.length > 0 ? `${selectedPT.length} PT Dipilih` : 'Semua PT'}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showPTDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showPTDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPTDropdown(false)}></div>
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-20 min-w-[200px] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-xs font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider">Filter PT</div>
                  {currentUserData?.accessPT?.map(code => (
                    <label key={code} className="flex items-center px-3 py-2 hover:bg-blue-50 rounded-lg cursor-pointer group transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedPT.includes(code)}
                        onChange={() => handlePTChange(code)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-blue-700 font-medium">{code}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date Filter */}
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              value={filterDetailKas.tanggal}
              onChange={(e) => onFilterChange({ tanggal: e.target.value })}
              className="w-full sm:w-auto pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Informasi Approval</h4>
          <p className="text-sm text-blue-800/80 mt-1 leading-relaxed">
            Fitur ini khusus untuk melihat detail transaksi kas kecil dan melakukan approval/reject.
            {hasApprovalAccess ? ' Anda memiliki hak akses penuh untuk melakukan approval.' : ' Akun Anda saat ini hanya dalam mode pantau (Read-Only).'}
          </p>
        </div>
      </div>

      {/* Mobile-First Card View (Hidden on md and up) */}
      <div className="md:hidden space-y-4">
        {filteredData.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-sm">
            <p className="text-gray-500 font-medium">Tidak ada transaksi pada tanggal ini.</p>
          </div>
        ) : (
          filteredData.map(kas => (
            <div key={kas.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gray-200 to-gray-100"></div>
              
              {/* Card Header */}
              <div className="flex justify-between items-start pl-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{kas.pt}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-medium text-gray-500">{new Date(kas.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})}</span>
                  </div>
                  {kas.kategori && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold uppercase tracking-wider">
                      {kas.kategori}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(kas.status)}
                  {getMethodBadge(kas.metodeBayar)}
                </div>
              </div>

              {/* Card Body */}
              <div className="pl-2">
                <p className="text-sm text-gray-700 leading-relaxed">{kas.keterangan}</p>
              </div>

              {/* Card Nominal & Actions */}
              <div className="pt-4 mt-2 border-t border-gray-50 flex items-center justify-between pl-2">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Nominal</p>
                  <p className={`text-lg font-bold ${kas.jenis === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kas.jenis === 'keluar' ? '-' : '+'} Rp {kas.jumlah.toLocaleString('id-ID')}
                  </p>
                </div>
                
                {hasApprovalAccess && kas.status === 'pending' && currentUserData?.accessPT?.includes(kas.pt) && (
                  <div className="flex gap-2">
                    <button onClick={() => onApprove(kas.id)} className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 active:scale-90 transition-all shadow-sm">
                      <CheckCircle size={18} />
                    </button>
                    <button onClick={() => onReject(kas.id)} className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 active:scale-90 transition-all shadow-sm">
                      <XCircle size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Mobile Grand Total Card */}
        {filteredData.length > 0 && (
          <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg mt-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Ringkasan Hari Ini</h4>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-300">Total Masuk</span>
              <span className="text-sm font-semibold text-emerald-400">Rp {masuk.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
              <span className="text-sm text-gray-300">Total Keluar</span>
              <span className="text-sm font-semibold text-rose-400">Rp {keluar.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">Saldo Akhir</span>
              <span className="text-xl font-bold text-white">Rp {saldo.toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Premium Desktop Table View (Hidden on Mobile) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-5 py-4 font-semibold text-gray-600">Tanggal</th>
                <th className="px-5 py-4 font-semibold text-gray-600">PT</th>
                <th className="px-5 py-4 font-semibold text-gray-600 max-w-xs">Keterangan</th>
                <th className="px-5 py-4 font-semibold text-gray-600">Metode & Kategori</th>
                <th className="px-5 py-4 font-semibold text-gray-600 text-right">Masuk</th>
                <th className="px-5 py-4 font-semibold text-gray-600 text-right">Keluar</th>
                <th className="px-5 py-4 font-semibold text-gray-600 text-center">Status</th>
                {hasApprovalAccess && (
                  <th className="px-5 py-4 font-semibold text-gray-600 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={hasApprovalAccess ? 8 : 7} className="px-5 py-12 text-center text-gray-500">
                    Tidak ada transaksi pada tanggal ini.
                  </td>
                </tr>
              ) : (
                filteredData.map(kas => (
                  <tr key={kas.id} className="hover:bg-gray-50/80 transition-colors duration-150 group">
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                      {new Date(kas.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-800">{kas.pt}</td>
                    <td className="px-5 py-4 text-gray-700 leading-relaxed max-w-xs truncate group-hover:whitespace-normal group-hover:break-words">
                      {kas.keterangan}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap space-y-2">
                      <div className="flex flex-col items-start gap-1.5">
                        {getMethodBadge(kas.metodeBayar)}
                        {kas.kategori && (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kas.kategori}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-semibold text-emerald-600">
                      {kas.jenis === 'masuk' ? `Rp ${kas.jumlah.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-semibold text-rose-600">
                      {kas.jenis === 'keluar' ? `Rp ${kas.jumlah.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(kas.status)}
                    </td>
                    {hasApprovalAccess && (
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {kas.status === 'pending' && currentUserData?.accessPT?.includes(kas.pt) ? (
                          <div className="flex gap-1.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onApprove(kas.id)}
                              title="Approve"
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all active:scale-95 border border-emerald-100 hover:border-emerald-500"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => onReject(kas.id)}
                              title="Reject"
                              className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-100 hover:border-rose-500"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : kas.status === 'pending' ? (
                          <span className="text-xs text-gray-400 font-medium">No Access</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-gray-50/50">
                <tr className="border-t border-gray-200">
                  <td colSpan="4" className="px-5 py-4 text-right font-bold text-gray-600 uppercase tracking-wider text-xs">Total Hari Ini</td>
                  <td className="px-5 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">Rp {masuk.toLocaleString('id-ID')}</td>
                  <td className="px-5 py-4 text-right font-bold text-rose-600 whitespace-nowrap">Rp {keluar.toLocaleString('id-ID')}</td>
                  <td colSpan={hasApprovalAccess ? 2 : 1}></td>
                </tr>
                <tr className="bg-gray-900 border-t border-gray-800">
                  <td colSpan="4" className="px-5 py-5 text-right font-bold text-white uppercase tracking-widest text-xs">Saldo Akhir</td>
                  <td colSpan={hasApprovalAccess ? 4 : 3} className="px-5 py-5 text-right font-black text-white text-lg whitespace-nowrap">
                    Rp {saldo.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetailKas;
