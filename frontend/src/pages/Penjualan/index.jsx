/**
 * Penjualan Page Component
 * Sales entry form for LPG 3 Kg Gas
 */
import React from 'react';
import { ShoppingCart, Plus } from 'lucide-react';

const Penjualan = ({
  formPenjualan,
  penjualanData,
  currentUserData,
  isLoadingPenjualan,
  onFormChange,
  onSavePenjualan,
  onResetForm,
  calculateTotal
}) => {
  const hitungTotalPenjualan = calculateTotal;

  return (
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
              onChange={(e) => onFormChange({...formPenjualan, tanggal: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">PT</label>
            <select 
              value={formPenjualan.pt}
              onChange={(e) => onFormChange({...formPenjualan, pt: e.target.value})}
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
              onChange={(e) => onFormChange({...formPenjualan, pangkalan: e.target.value})}
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
              onChange={(e) => onFormChange({...formPenjualan, qty: e.target.value})}
              placeholder="0" 
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Harga per Tabung (Rp)</label>
            <input 
              type="number" 
              value={formPenjualan.harga}
              onChange={(e) => onFormChange({...formPenjualan, harga: parseFloat(e.target.value) || 0})}
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
              onChange={(e) => onFormChange({...formPenjualan, ppnPercent: parseFloat(e.target.value) || 0})}
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
              onChange={(e) => onFormChange({...formPenjualan, ppnType: e.target.value})}
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
              onChange={(e) => onFormChange({...formPenjualan, metodeBayar: e.target.value})}
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
            onClick={onSavePenjualan}
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
            onClick={onResetForm}
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
                      penjualan.metode_bayar === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {penjualan.metode_bayar === 'cash' ? 'Cash' : 'Cashless'}
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
};

export default Penjualan;
