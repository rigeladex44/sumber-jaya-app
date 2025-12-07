/**
 * Master Kategori Page Component
 * Manages sub-categories for income and expenses
 */
import React from 'react';
import { Plus, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';

const MasterKategori = ({
  subKategoriData,
  isLoadingSubKategori,
  showAddSubKategoriModal,
  showEditSubKategoriModal,
  editingSubKategori,
  formSubKategori,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onAddSubmit,
  onUpdateSubmit,
  onFormChange,
  onCancelAdd,
  onCancelEdit
}) => {
  const subKategoriPemasukan = subKategoriData.filter(sk => sk.jenis === 'pemasukan');
  const subKategoriPengeluaran = subKategoriData.filter(sk => sk.jenis === 'pengeluaran');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Master Kategori</h2>
        <p className="text-gray-600 mb-6">
          Kelola sub kategori untuk pemasukan dan pengeluaran. Sub kategori ini akan digunakan di menu Kas Kecil dan Arus Kas.
        </p>

        {/* Add Sub Kategori Button */}
        <div className="mb-6">
          <button
            onClick={onAddClick}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            Tambah Sub Kategori
          </button>
        </div>

        {isLoadingSubKategori ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data sub kategori...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PEMASUKAN */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
                <TrendingUp size={24} />
                PEMASUKAN
              </h3>
              <div className="space-y-2">
                {subKategoriPemasukan.length === 0 ? (
                  <p className="text-gray-500 italic">Belum ada sub kategori pemasukan</p>
                ) : (
                  subKategoriPemasukan.map((sk) => (
                    <div key={sk.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100">
                      <div>
                        <p className="font-semibold text-gray-800">{sk.nama}</p>
                        <p className="text-xs text-gray-500">Urutan: {sk.urutan}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditClick(sk)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteClick(sk.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PENGELUARAN */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">
                <TrendingDown size={24} />
                PENGELUARAN
              </h3>
              <div className="space-y-2">
                {subKategoriPengeluaran.length === 0 ? (
                  <p className="text-gray-500 italic">Belum ada sub kategori pengeluaran</p>
                ) : (
                  subKategoriPengeluaran.map((sk) => (
                    <div key={sk.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100">
                      <div>
                        <p className="font-semibold text-gray-800">{sk.nama}</p>
                        <p className="text-xs text-gray-500">Urutan: {sk.urutan}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditClick(sk)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteClick(sk.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Sub Kategori Modal */}
        {showAddSubKategoriModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Tambah Sub Kategori</h3>
              <form onSubmit={onAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Jenis *</label>
                  <select
                    value={formSubKategori.jenis}
                    onChange={(e) => onFormChange({...formSubKategori, jenis: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="pemasukan">PEMASUKAN</option>
                    <option value="pengeluaran">PENGELUARAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nama Sub Kategori *</label>
                  <input
                    type="text"
                    value={formSubKategori.nama}
                    onChange={(e) => onFormChange({...formSubKategori, nama: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Contoh: BIAYA OPERASIONAL"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Urutan (Opsional)</label>
                  <input
                    type="number"
                    value={formSubKategori.urutan}
                    onChange={(e) => onFormChange({...formSubKategori, urutan: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Urutan tampilan (0 = paling atas)</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={onCancelAdd}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Sub Kategori Modal */}
        {showEditSubKategoriModal && editingSubKategori && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Edit Sub Kategori</h3>
              <form onSubmit={onUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Jenis *</label>
                  <select
                    value={formSubKategori.jenis}
                    onChange={(e) => onFormChange({...formSubKategori, jenis: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="pemasukan">PEMASUKAN</option>
                    <option value="pengeluaran">PENGELUARAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nama Sub Kategori *</label>
                  <input
                    type="text"
                    value={formSubKategori.nama}
                    onChange={(e) => onFormChange({...formSubKategori, nama: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Contoh: BIAYA OPERASIONAL"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Urutan (Opsional)</label>
                  <input
                    type="number"
                    value={formSubKategori.urutan}
                    onChange={(e) => onFormChange({...formSubKategori, urutan: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Urutan tampilan (0 = paling atas)</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterKategori;
