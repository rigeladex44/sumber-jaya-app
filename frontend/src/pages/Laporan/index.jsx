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
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <button
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2"
              onClick={() => document.getElementById('pt-dropdown-laporan').classList.toggle('hidden')}
            >
              {selectedPT.length > 0 ? `${selectedPT.length} PT Dipilih` : 'Pilih PT'}
              <span className="text-xs">▼</span>
            </button>
            <div id="pt-dropdown-laporan" className="hidden absolute top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[200px]">
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
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
          <button
            onClick={() => onExportPDF('labarugi')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div id="content-to-export" className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* PENDAPATAN Section */}
        <div className="mb-6">
          <div className="bg-green-600 px-6 py-3">
            <h3 className="text-white font-bold text-lg uppercase">Pendapatan (Pemasukan)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {laporanData.pemasukan.length > 0 ? (
                  laporanData.pemasukan.map((item, index) => (
                    <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors`}>
                      <td className="px-6 py-4 text-gray-800">{item.nama}</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-700">
                        Rp {item.total.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-400 italic">
                      Tidak ada data pemasukan
                    </td>
                  </tr>
                )}
                <tr className="bg-green-100 border-t-2 border-green-600">
                  <td className="px-6 py-4 font-bold text-gray-800">TOTAL PENDAPATAN</td>
                  <td className="px-6 py-4 text-right font-bold text-green-700 text-lg">
                    Rp {laporanData.totalPendapatan.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* PENGELUARAN Section */}
        <div className="mb-6">
          <div className="bg-red-600 px-6 py-3">
            <h3 className="text-white font-bold text-lg uppercase">Pengeluaran</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {laporanData.pengeluaran.length > 0 ? (
                  laporanData.pengeluaran.map((item, index) => (
                    <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-red-50 transition-colors`}>
                      <td className="px-6 py-4 text-gray-800">{item.nama}</td>
                      <td className="px-6 py-4 text-right font-semibold text-red-700">
                        Rp {item.total.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-gray-400 italic">
                      Tidak ada data pengeluaran
                    </td>
                  </tr>
                )}
                <tr className="bg-red-100 border-t-2 border-red-600">
                  <td className="px-6 py-4 font-bold text-gray-800">TOTAL PENGELUARAN</td>
                  <td className="px-6 py-4 text-right font-bold text-red-700 text-lg">
                    Rp {laporanData.totalPengeluaran.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* LABA/RUGI BERSIH */}
        <div className={`mx-6 mb-6 border-4 rounded-lg p-6 ${laporanData.labaBersih >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-800">
              {laporanData.labaBersih >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}
            </span>
            <span className={`text-3xl font-bold ${laporanData.labaBersih >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Rp {Math.abs(laporanData.labaBersih).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
