/**
 * Laporan Page Component
 * Displays profit/loss report (Laporan Laba Rugi)
 */
import React from 'react';
import { Download } from 'lucide-react';
import { PT_LIST } from '../../utils/constants';

const Laporan = ({
  arusKasData,
  subKategoriData,
  currentUserData,
  selectedPT,
  selectedMonth,
  onPTChange,
  onMonthChange,
  onExportPDF
}) => {
  const handlePTChange = (ptCode) => {
    if (selectedPT.includes(ptCode)) {
      onPTChange(selectedPT.filter(p => p !== ptCode));
    } else {
      onPTChange([...selectedPT, ptCode]);
    }
  };

  // Hitung Laba Rugi dari Arus Kas (dikelompokkan per Sub Kategori)
  const hitungLabaRugi = () => {
    console.log('🔍 DEBUG Laba Rugi - START:', {
      totalArusKasData: arusKasData.length,
      totalSubKategoriData: subKategoriData.length,
      selectedPT: selectedPT,
      selectedMonth: selectedMonth,
      sampleArusKasData: arusKasData.slice(0, 3).map(item => ({
        id: item.id,
        pt: item.pt,
        tanggal: item.tanggal,
        sub_kategori_id: item.sub_kategori_id,
        jenis: item.jenis,
        jumlah: item.jumlah
      })),
      sampleSubKategori: subKategoriData.slice(0, 3)
    });

    // Filter data Arus Kas berdasarkan PT dan bulan yang dipilih
    const [year, month] = selectedMonth.split('-');

    // Filter Arus Kas berdasarkan PT dan bulan
    const arusKasFiltered = arusKasData.filter(item => {
      if (!selectedPT.includes(item.pt)) return false;
      const itemDate = new Date(item.tanggal);
      return itemDate.getFullYear() === parseInt(year) &&
             (itemDate.getMonth() + 1) === parseInt(month);
    });

    console.log('📊 DEBUG Laba Rugi - Data Filtered:', {
      filteredCount: arusKasFiltered.length,
      yearMonthFilter: `${year}-${month}`,
      allFilteredData: arusKasFiltered.map(item => ({
        id: item.id,
        pt: item.pt,
        tanggal: item.tanggal,
        sub_kategori_id: item.sub_kategori_id,
        sub_kategori_nama: item.sub_kategori_nama,
        jenis: item.jenis,
        jumlah: item.jumlah
      }))
    });

    // Kelompokkan per sub kategori untuk pemasukan
    const pemasukanPerSubKategori = [];
    const pengeluaranPerSubKategori = [];

    // Get unique sub kategori IDs from filtered data
    const subKatIdsSet = new Set(arusKasFiltered.map(item => item.sub_kategori_id).filter(id => id));

    console.log('🏷️ DEBUG Laba Rugi - Sub Kategori IDs:', {
      uniqueSubKatIds: Array.from(subKatIdsSet),
      subKategoriDataIds: subKategoriData.map(sk => ({ id: sk.id, nama: sk.nama, jenis: sk.jenis }))
    });

    // Process each sub kategori
    subKatIdsSet.forEach(subKatId => {
      const subKat = subKategoriData.find(sk => sk.id === subKatId);

      console.log(`🔎 Processing SubKat ID ${subKatId}:`, {
        found: !!subKat,
        subKat: subKat
      });

      if (!subKat) {
        console.warn(`⚠️ Sub kategori ID ${subKatId} tidak ditemukan di subKategoriData!`);
        return;
      }

      const itemsForSubKat = arusKasFiltered.filter(item => item.sub_kategori_id === subKatId);
      const total = itemsForSubKat.reduce((sum, item) => sum + (item.jumlah || 0), 0);

      console.log(`💰 SubKat "${subKat.nama}" (${subKat.jenis}):`, {
        itemCount: itemsForSubKat.length,
        items: itemsForSubKat,
        total: total
      });

      const subKatData = {
        id: subKat.id,
        nama: subKat.nama,
        total: total,
        urutan: subKat.urutan
      };

      if (subKat.jenis === 'pemasukan') {
        pemasukanPerSubKategori.push(subKatData);
      } else if (subKat.jenis === 'pengeluaran') {
        pengeluaranPerSubKategori.push(subKatData);
      }
    });

    // Sort by urutan
    pemasukanPerSubKategori.sort((a, b) => a.urutan - b.urutan);
    pengeluaranPerSubKategori.sort((a, b) => a.urutan - b.urutan);

    // Hitung total pendapatan dan pengeluaran
    const totalPendapatan = pemasukanPerSubKategori.reduce((sum, item) => sum + item.total, 0);
    const totalPengeluaran = pengeluaranPerSubKategori.reduce((sum, item) => sum + item.total, 0);
    const labaBersih = totalPendapatan - totalPengeluaran;

    console.log('✅ DEBUG Laba Rugi - HASIL AKHIR:', {
      pemasukanCount: pemasukanPerSubKategori.length,
      pengeluaranCount: pengeluaranPerSubKategori.length,
      pemasukan: pemasukanPerSubKategori,
      pengeluaran: pengeluaranPerSubKategori,
      totalPendapatan,
      totalPengeluaran,
      labaBersih,
      statusMessage: pemasukanPerSubKategori.length === 0 && pengeluaranPerSubKategori.length === 0
        ? '❌ TIDAK ADA DATA - Cek filter PT dan bulan!'
        : '✅ DATA DITEMUKAN'
    });

    return {
      pemasukan: pemasukanPerSubKategori,
      pengeluaran: pengeluaranPerSubKategori,
      totalPendapatan,
      totalPengeluaran,
      labaBersih
    };
  };

  const laporanData = hitungLabaRugi();

  // Format bulan untuk display
  const bulanNama = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Get PT names
  const ptNames = selectedPT.map(code => {
    const pt = PT_LIST.find(p => p.code === code);
    return pt ? pt.name : code;
  }).join(' - ') || 'Semua PT';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Laba Rugi</h2>
          <p className="text-sm text-gray-600 mt-1">Periode: {bulanNama}</p>
          <p className="text-xs text-gray-500 mt-0.5">{ptNames}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <button
              className="w-full sm:w-auto px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between sm:justify-start gap-2 shadow-sm"
              onClick={() => document.getElementById('pt-dropdown-laporan').classList.toggle('hidden')}
            >
              <span className="font-medium text-gray-700">
                {selectedPT.length > 0 ? `${selectedPT.length} PT Dipilih` : 'Pilih PT'}
              </span>
              <span className="text-xs text-gray-500">▼</span>
            </button>
            <div id="pt-dropdown-laporan" className="hidden absolute top-full mt-1 w-full sm:w-auto min-w-[200px] bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {currentUserData?.accessPT?.map(code => (
                  <label key={code} className="flex items-center px-4 py-3 sm:py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedPT.includes(code)}
                      onChange={() => handlePTChange(code)}
                      className="mr-3 sm:mr-2 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{code}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
          />
          <button
            onClick={() => onExportPDF('labarugi')}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-colors font-medium"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div id="content-to-export" className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* PENDAPATAN Section */}
        <div className="mb-6">
          <div className="bg-emerald-600 px-4 sm:px-6 py-3">
            <h3 className="text-white font-bold text-sm sm:text-lg uppercase tracking-wide">Pendapatan (Pemasukan)</h3>
          </div>
          <div className="flex flex-col">
            {laporanData.pemasukan.length > 0 ? (
              laporanData.pemasukan.map((item, index) => (
                <div key={item.id} className={`flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-emerald-50/50 transition-colors`}>
                  <span className="text-sm sm:text-base font-medium text-gray-800">{item.nama}</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-600">Rp {item.total.toLocaleString('id-ID')}</span>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-8 text-center text-gray-400 text-sm italic">
                Tidak ada data pemasukan
              </div>
            )}
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 bg-emerald-50 border-t-2 border-emerald-500">
              <span className="text-sm sm:text-base font-bold text-gray-800 uppercase tracking-wide">Total Pendapatan</span>
              <span className="text-lg sm:text-xl font-black text-emerald-700">
                Rp {laporanData.totalPendapatan.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* PENGELUARAN Section */}
        <div className="mb-6">
          <div className="bg-rose-600 px-4 sm:px-6 py-3">
            <h3 className="text-white font-bold text-sm sm:text-lg uppercase tracking-wide">Pengeluaran</h3>
          </div>
          <div className="flex flex-col">
            {laporanData.pengeluaran.length > 0 ? (
              laporanData.pengeluaran.map((item, index) => (
                <div key={item.id} className={`flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-rose-50/50 transition-colors`}>
                  <span className="text-sm sm:text-base font-medium text-gray-800">{item.nama}</span>
                  <span className="text-sm sm:text-base font-bold text-rose-600">Rp {item.total.toLocaleString('id-ID')}</span>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-8 text-center text-gray-400 text-sm italic">
                Tidak ada data pengeluaran
              </div>
            )}
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 bg-rose-50 border-t-2 border-rose-500">
              <span className="text-sm sm:text-base font-bold text-gray-800 uppercase tracking-wide">Total Pengeluaran</span>
              <span className="text-lg sm:text-xl font-black text-rose-700">
                Rp {laporanData.totalPengeluaran.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* LABA/RUGI BERSIH */}
        <div className={`mx-4 sm:mx-6 mb-6 rounded-xl p-4 sm:p-6 border-l-4 sm:border-l-0 sm:border-t-4 shadow-sm ${laporanData.labaBersih >= 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
            <span className="text-sm sm:text-xl font-bold text-gray-800 uppercase tracking-wider">
              {laporanData.labaBersih >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
            </span>
            <span className={`text-2xl sm:text-3xl font-black tracking-tight ${laporanData.labaBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              Rp {Math.abs(laporanData.labaBersih).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
