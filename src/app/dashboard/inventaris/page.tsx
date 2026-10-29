'use client';
import React, { useState } from 'react';
import { 
  IconBox,
  IconPlus,
  IconDownload,
  IconSearch,
  IconFilter,
  IconEdit,
  IconTrash,
  IconAlertTriangle
} from '@tabler/icons-react';

const initialInventory = [
  { id: 1, name: 'Beras Premium 5kg', category: 'Bahan Pokok', stock: 45, unit: 'Sak', price: 75000, status: 'Aman' },
  { id: 2, name: 'Minyak Goreng 2L', category: 'Bahan Pokok', stock: 12, unit: 'Pouch', price: 34000, status: 'Menipis' },
  { id: 3, name: 'Gula Pasir 1kg', category: 'Bahan Pokok', stock: 8, unit: 'Kg', price: 16000, status: 'Kritis' },
  { id: 4, name: 'Telur Ayam', category: 'Bahan Mentah', stock: 120, unit: 'Kg', price: 28000, status: 'Aman' },
  { id: 5, name: 'Tepung Terigu 1kg', category: 'Bahan Pokok', stock: 35, unit: 'Bungkus', price: 12000, status: 'Aman' },
  { id: 6, name: 'Ayam Potong', category: 'Bahan Mentah', stock: 5, unit: 'Ekor', price: 35000, status: 'Kritis' },
];

export default function InventarisPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = initialInventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <IconBox className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f172a]">Inventaris & Stok</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Kelola persediaan barang dan pantau pergerakan stok secara real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <IconDownload className="w-4 h-4 text-gray-500" />
            Ekspor Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <IconPlus className="w-4 h-4" />
            Tambah Barang
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:border-blue-200 transition-colors">
          <span className="text-gray-500 font-medium text-sm mb-2">Total Barang</span>
          <span className="text-2xl font-bold text-[#0f172a]">156</span>
          <span className="text-xs text-gray-400 mt-2">Terdiri dari 12 Kategori</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-red-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <IconAlertTriangle className="w-20 h-20 text-red-500 -mt-4 -mr-4" />
          </div>
          <span className="text-gray-500 font-medium text-sm mb-2 relative z-10">Stok Menipis</span>
          <span className="text-2xl font-bold text-red-600 relative z-10">8 Item</span>
          <span className="text-xs text-red-400 mt-2 relative z-10">Perlu segera restock</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:border-blue-200 transition-colors">
          <span className="text-gray-500 font-medium text-sm mb-2">Nilai Inventori</span>
          <span className="text-2xl font-bold text-blue-600">Rp 12.450.000</span>
          <span className="text-xs text-gray-400 mt-2">Total estimasi modal</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:border-blue-200 transition-colors">
          <span className="text-gray-500 font-medium text-sm mb-2">Barang Masuk</span>
          <span className="text-2xl font-bold text-[#0f172a]">24 Transaksi</span>
          <span className="text-xs text-blue-500 mt-2 flex items-center gap-1">
             +15% dari bulan lalu
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div className="relative w-80">
            <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nama barang atau kategori..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <IconFilter className="w-4 h-4 text-gray-500" />
            Filter Status
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm">
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">Nama Barang</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">Kategori</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">Harga Satuan</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">Stok</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">Status</th>
                <th className="py-4 px-6 font-semibold text-gray-500 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <p className="font-semibold text-[#0f172a]">{item.name}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200/50">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-medium">
                    Rp {item.price.toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 px-6 font-medium text-[#0f172a]">
                    {item.stock} <span className="text-gray-400 font-normal text-sm ml-0.5">{item.unit}</span>
                  </td>
                  <td className="py-4 px-6">
                    {item.status === 'Aman' && (
                      <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 w-max px-2.5 py-1 rounded-lg text-xs font-semibold border border-blue-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        Aman
                      </div>
                    )}
                    {item.status === 'Menipis' && (
                      <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 w-max px-2.5 py-1 rounded-lg text-xs font-semibold border border-orange-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        Menipis
                      </div>
                    )}
                    {item.status === 'Kritis' && (
                      <div className="flex items-center gap-1.5 text-red-700 bg-red-50 w-max px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        Kritis
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="py-16 text-center flex flex-col items-center">
              <IconBox className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-[#0f172a] font-semibold text-lg">Tidak ada barang yang ditemukan</p>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">Coba gunakan kata kunci pencarian yang berbeda atau tambahkan barang baru ke inventaris.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
