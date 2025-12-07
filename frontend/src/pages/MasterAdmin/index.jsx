/**
 * Master Admin Page Component
 * User management interface
 */
import React from 'react';
import { Plus, X } from 'lucide-react';
import { PT_LIST } from '../../utils/constants';

const MasterAdmin = ({
  userList,
  currentUserData,
  formUser,
  showAddUserModal,
  showEditUserModal,
  mainMenuItems,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onSaveUser,
  onUpdateUser,
  onFormChange,
  onCloseAddModal,
  onCloseEditModal
}) => {
  const handleFiturChange = (fiturId) => {
    const newFitur = formUser.fiturAkses.includes(fiturId)
      ? formUser.fiturAkses.filter(f => f !== fiturId)
      : [...formUser.fiturAkses, fiturId];
    onFormChange({ ...formUser, fiturAkses: newFitur });
  };

  const handlePTAccessChange = (ptCode) => {
    const newPT = formUser.aksesPT.includes(ptCode)
      ? formUser.aksesPT.filter(p => p !== ptCode)
      : [...formUser.aksesPT, ptCode];
    onFormChange({ ...formUser, aksesPT: newPT });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Master Admin</h2>
        <button 
          onClick={onAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Daftar User</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Jabatan</th>
                <th className="px-4 py-3 text-left">Akses PT</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {userList.map(user => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {user.accessPT && user.accessPT.length === PT_LIST.length ? 'Semua PT' : user.accessPT?.join(', ') || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Aktif</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => onEditClick(user)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteClick(user.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Tambah User Baru</h3>
              <button 
                onClick={onCloseAddModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formUser.nama}
                    onChange={(e) => onFormChange({...formUser, nama: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={formUser.username}
                    onChange={(e) => onFormChange({...formUser, username: e.target.value})}
                    placeholder="Masukkan username"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={formUser.password}
                    onChange={(e) => onFormChange({...formUser, password: e.target.value})}
                    placeholder="Password"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Jabatan</label>
                  <input
                    type="text"
                    value={formUser.jabatan}
                    onChange={(e) => onFormChange({...formUser, jabatan: e.target.value})}
                    placeholder="Contoh: Manager, Staff, dll"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Akses Fitur Aplikasi</label>
                <div className="grid grid-cols-2 gap-3">
                  {mainMenuItems.map(item => (
                    <label key={item.id} className="flex items-center px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUser.fiturAkses.includes(item.id)}
                        onChange={() => handleFiturChange(item.id)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Akses PT</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PT_LIST.map(pt => (
                    <label key={pt.code} className="flex items-center px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUser.aksesPT.includes(pt.code)}
                        onChange={() => handlePTAccessChange(pt.code)}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-sm font-bold block">{pt.code}</span>
                        <span className="text-xs text-gray-500">{pt.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={onSaveUser}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Simpan User
              </button>
              <button
                onClick={onCloseAddModal}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Edit User</h3>
              <button 
                onClick={onCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formUser.nama}
                    onChange={(e) => onFormChange({...formUser, nama: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={formUser.username}
                    onChange={(e) => onFormChange({...formUser, username: e.target.value})}
                    placeholder="Username"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={formUser.password}
                    onChange={(e) => onFormChange({...formUser, password: e.target.value})}
                    placeholder="Kosongkan jika tidak diubah"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Jabatan</label>
                  <input
                    type="text"
                    value={formUser.jabatan}
                    onChange={(e) => onFormChange({...formUser, jabatan: e.target.value})}
                    placeholder="Contoh: Manager, Staff, dll"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Akses Fitur Aplikasi</label>
                <div className="grid grid-cols-2 gap-3">
                  {mainMenuItems.map(item => (
                    <label key={item.id} className="flex items-center px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUser.fiturAkses.includes(item.id)}
                        onChange={() => handleFiturChange(item.id)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Akses PT</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PT_LIST.map(pt => (
                    <label key={pt.code} className="flex items-center px-4 py-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUser.aksesPT.includes(pt.code)}
                        onChange={() => handlePTAccessChange(pt.code)}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-sm font-bold block">{pt.code}</span>
                        <span className="text-xs text-gray-500">{pt.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={onUpdateUser}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Update User
              </button>
              <button
                onClick={onCloseEditModal}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAdmin;
