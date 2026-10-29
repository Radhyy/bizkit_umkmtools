'use client';
import React, { useState } from 'react';
import { 
  IconReport,
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileTypeCsv,
  IconCalendarEvent,
  IconCheck,
  IconHistory,
  IconFileDescription,
  IconUsers,
  IconBox,
  IconTruckDelivery
} from '@tabler/icons-react';

export default function ExportDataPage() {
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [dateRange, setDateRange] = useState('bulan_ini');

  const [selections, setSelections] = useState({
    keuangan: true,
    inventaris: true,
    pelanggan: false,
    supplier: false
  });

  const toggleSelection = (key: keyof typeof selections) => {
    setSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = () => {
    // Simulasi proses export
    alert(`Mengekspor data dalam format ${selectedFormat.toUpperCase()}...`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <IconReport className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a]">Export Data</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Unduh data bisnis Anda secara kustom untuk keperluan laporan, audit, atau pencadangan (backup).
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column: Configuration */}
        <div className="col-span-2 flex flex-col gap-6">
          
          {/* Modul Data Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-[#0f172a] mb-5">Pilih Modul Data</h2>
            <div className="grid grid-cols-2 gap-4">
              
              <div 
                onClick={() => toggleSelection('keuangan')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  selections.keuangan ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${selections.keuangan ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <IconFileDescription className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0f172a] mb-1 flex items-center justify-between">
                    Keuangan & Transaksi
                    {selections.keuangan && <IconCheck className="w-4 h-4 text-blue-600" />}
                  </h3>
                  <p className="text-xs text-gray-500">Pemasukan, pengeluaran, dan riwayat pesanan.</p>
                </div>
              </div>

              <div 
                onClick={() => toggleSelection('inventaris')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  selections.inventaris ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${selections.inventaris ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <IconBox className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0f172a] mb-1 flex items-center justify-between">
                    Inventaris & Stok
                    {selections.inventaris && <IconCheck className="w-4 h-4 text-blue-600" />}
                  </h3>
                  <p className="text-xs text-gray-500">Daftar barang, stok tersisa, dan valuasi.</p>
                </div>
              </div>

              <div 
                onClick={() => toggleSelection('pelanggan')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  selections.pelanggan ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${selections.pelanggan ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <IconUsers className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0f172a] mb-1 flex items-center justify-between">
                    Data Pelanggan
                    {selections.pelanggan && <IconCheck className="w-4 h-4 text-blue-600" />}
                  </h3>
                  <p className="text-xs text-gray-500">Informasi kontak dan riwayat pembelian.</p>
                </div>
              </div>

              <div 
                onClick={() => toggleSelection('supplier')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  selections.supplier ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${selections.supplier ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <IconTruckDelivery className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0f172a] mb-1 flex items-center justify-between">
                    Data Supplier
                    {selections.supplier && <IconCheck className="w-4 h-4 text-blue-600" />}
                  </h3>
                  <p className="text-xs text-gray-500">Daftar vendor dan rekap hutang/tagihan.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Pengaturan Tambahan */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-[#0f172a] mb-4">Rentang Waktu</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="date" value="bulan_ini" checked={dateRange === 'bulan_ini'} onChange={() => setDateRange('bulan_ini')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Bulan Ini (Mei 2025)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="date" value="bulan_lalu" checked={dateRange === 'bulan_lalu'} onChange={() => setDateRange('bulan_lalu')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Bulan Lalu (Apr 2025)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="date" value="tahun_ini" checked={dateRange === 'tahun_ini'} onChange={() => setDateRange('tahun_ini')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Tahun Ini (2025)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="date" value="kustom" checked={dateRange === 'kustom'} onChange={() => setDateRange('kustom')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Pilih Tanggal Kustom...</span>
                </label>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-[#0f172a] mb-4">Format File</h2>
              <div className="grid grid-cols-1 gap-3">
                <div 
                  onClick={() => setSelectedFormat('excel')}
                  className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedFormat === 'excel' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <IconFileSpreadsheet className={`w-5 h-5 ${selectedFormat === 'excel' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Microsoft Excel (.xlsx)</span>
                  {selectedFormat === 'excel' && <IconCheck className="w-4 h-4 ml-auto" />}
                </div>
                <div 
                  onClick={() => setSelectedFormat('csv')}
                  className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedFormat === 'csv' ? 'border-blue-500 bg-blue-50/50 text-blue-700' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <IconFileTypeCsv className={`w-5 h-5 ${selectedFormat === 'csv' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Data CSV (.csv)</span>
                  {selectedFormat === 'csv' && <IconCheck className="w-4 h-4 ml-auto" />}
                </div>
                <div 
                  onClick={() => setSelectedFormat('pdf')}
                  className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedFormat === 'pdf' ? 'border-red-500 bg-red-50/50 text-red-700' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <IconFileTypePdf className={`w-5 h-5 ${selectedFormat === 'pdf' ? 'text-red-500' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Dokumen PDF (.pdf)</span>
                  {selectedFormat === 'pdf' && <IconCheck className="w-4 h-4 ml-auto" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Action */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full sticky top-8">
            <h2 className="text-lg font-bold text-[#0f172a] mb-6">Ringkasan Export</h2>
            
            <div className="space-y-4 mb-8 flex-1">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">Modul Dipilih</span>
                <span className="text-sm font-bold text-[#0f172a]">
                  {Object.values(selections).filter(Boolean).length} Modul
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">Periode Data</span>
                <span className="text-sm font-bold text-[#0f172a]">
                  {dateRange === 'bulan_ini' ? 'Mei 2025' : 
                   dateRange === 'bulan_lalu' ? 'April 2025' : 
                   dateRange === 'tahun_ini' ? 'Tahun 2025' : 'Kustom'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">Format File</span>
                <span className="text-sm font-bold text-blue-600 uppercase">
                  {selectedFormat}
                </span>
              </div>
            </div>

            <button 
              onClick={handleExport}
              disabled={Object.values(selections).filter(Boolean).length === 0}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm shadow-blue-200 mb-4"
            >
              <IconDownload className="w-5 h-5" />
              Mulai Export Data
            </button>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-3">
                <IconHistory className="w-4 h-4" /> Riwayat Terakhir
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#0f172a]">Data_Keuangan_Apr2025.xlsx</span>
                  <span className="text-[11px] text-gray-400">1 Mei 2025 • 42kb</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700">
                  <IconDownload className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
