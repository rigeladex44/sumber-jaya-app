/**
 * Search Results Modal Component
 * Displays search results for transactions by date
 */
import React from 'react';
import { X } from 'lucide-react';

const SearchResultsModal = ({
  showSearchResults,
  searchResults,
  searchDate,
  onClose
}) => {
  if (!showSearchResults) return null;

  const { masuk, keluar } = searchResults.reduce((acc, item) => {
    if (item.jenis === 'masuk') {
      acc.masuk += item.jumlah;
    } else {
      acc.keluar += item.jumlah;
    }
    return acc;
  }, { masuk: 0, keluar: 0 });

  const totalSaldo = masuk - keluar;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            Hasil Pencarian - {searchDate}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Ditemukan <strong>{searchResults.length}</strong> transaksi pada tanggal <strong>{searchDate}</strong>
            </p>
          </div>

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
                </tr>
              </thead>
              <tbody className="divide-y">
                {searchResults.map(kas => (
                  <tr key={kas.id}>
                    <td className="px-4 py-3">{kas.tanggal}</td>
                    <td className="px-4 py-3 font-semibold">{kas.pt}</td>
                    <td className="px-4 py-3">{kas.keterangan}</td>
                    <td className="px-4 py-3 text-right">
                      {kas.jenis === 'masuk' ? (
                        <span className="text-green-600 font-semibold">
                          Rp {kas.jumlah.toLocaleString('id-ID')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {kas.jenis === 'keluar' ? (
                        <span className="text-red-600 font-semibold">
                          Rp {kas.jumlah.toLocaleString('id-ID')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        kas.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : kas.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {kas.status === 'approved' ? 'Approved' : 
                         kas.status === 'pending' ? 'Pending' : 'Rejected'}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {/* Total Row */}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan="3" className="px-4 py-3 text-right">Total</td>
                  <td className="px-4 py-3 text-right text-green-600">Rp {masuk.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-red-600">Rp {keluar.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3"></td>
                </tr>
                <tr className="bg-blue-50 font-bold">
                  <td colSpan="3" className="px-4 py-3 text-right">Saldo Akhir</td>
                  <td colSpan="2" className="px-4 py-3 text-right text-blue-600 text-lg">Rp {totalSaldo.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsModal;
