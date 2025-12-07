/**
 * Detail Kas Page Component
 * Displays transaction details with approval/rejection functionality
 */
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

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
  const handlePTChange = (ptCode) => {
    const newSelectedPT = selectedPT.includes(ptCode)
      ? selectedPT.filter(p => p !== ptCode)
      : [...selectedPT, ptCode];
    onPTChange(newSelectedPT);
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

  // Calculate totals from FILTERED data (per day, not all time)
  const filteredData = getFilteredKasData(selectedPT);
  const masuk = filteredData.filter(k => k.jenis === 'masuk' && k.status === 'approved').reduce((sum, k) => sum + k.jumlah, 0);
  const keluar = filteredData.filter(k => k.jenis === 'keluar' && k.status === 'approved').reduce((sum, k) => sum + k.jumlah, 0);
  const saldo = masuk - keluar;
  const hasApprovalAccess = currentUserData?.fiturAkses?.includes('detail-kas') || currentUserData?.role === 'Master User';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Approval Kas Kecil</h2>
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
          <input
            type="date"
            value={filterDetailKas.tanggal}
            onChange={(e) => onFilterChange({ tanggal: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
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
                <th className="px-4 py-3 text-left">Metode</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-right">Masuk</th>
                <th className="px-4 py-3 text-right">Keluar</th>
                <th className="px-4 py-3 text-center">Status</th>
                {hasApprovalAccess && (
                  <th className="px-4 py-3 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.map(kas => (
                <tr key={kas.id}>
                  <td className="px-4 py-3">{new Date(kas.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3">{kas.pt}</td>
                  <td className="px-4 py-3">{kas.keterangan}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      kas.metodeBayar === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {kas.metodeBayar === 'cash' ? 'Cash' : 'Cashless'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {kas.kategori ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {kas.kategori}
                      </span>
                    ) : '-'}
                  </td>
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
                            onClick={() => onApprove(kas.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(kas.id)}
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
                <td colSpan="5" className="px-4 py-3 text-right">Total</td>
                <td className="px-4 py-3 text-right text-green-600">Rp {masuk.toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-right text-red-600">Rp {keluar.toLocaleString('id-ID')}</td>
                <td colSpan={hasApprovalAccess ? "2" : "1"} className="px-4 py-3"></td>
              </tr>
              <tr className="grand-total-row bg-blue-50 font-bold">
                <td colSpan="5" className="px-4 py-3 text-right">Saldo Akhir</td>
                <td colSpan={hasApprovalAccess ? "4" : "3"} className="px-4 py-3 text-right text-blue-600 text-lg">Rp {saldo.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetailKas;
