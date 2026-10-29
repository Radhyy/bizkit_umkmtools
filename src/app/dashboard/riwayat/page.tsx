'use client';
import React, { useState } from 'react';
import { 
  IconReceipt2,
  IconSearch,
  IconFilter,
  IconCalendarEvent,
  IconDownload,
  IconPrinter,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconFileInvoice,
  IconWallet,
  IconTrendingUp,
  IconClockHour4
} from '@tabler/icons-react';

const mockTransactions = [
  { id: 'TRX-250530-001', date: '30 Mei 2025', time: '14:30', name: 'Pesanan Katering Pernikahan', category: 'Pemasukan', type: 'in', amount: 3500000, status: 'Berhasil' },
  { id: 'TRX-250530-002', date: '30 Mei 2025', time: '10:15', name: 'Pembelian Bahan Baku (Supplier A)', category: 'Pengeluaran', type: 'out', amount: 850000, status: 'Berhasil' },
  { id: 'TRX-250529-001', date: '29 Mei 2025', time: '16:45', name: 'Penjualan Kasir - Shift Siang', category: 'Pemasukan', type: 'in', amount: 1250000, status: 'Berhasil' },
  { id: 'TRX-250529-002', date: '29 Mei 2025', time: '09:00', name: 'Tagihan Listrik & Air', category: 'Pengeluaran', type: 'out', amount: 450000, status: 'Tertunda' },
  { id: 'TRX-250528-001', date: '28 Mei 2025', time: '13:20', name: 'Pesanan Nasi Kotak (50 pax)', category: 'Pemasukan', type: 'in', amount: 1500000, status: 'Dibatalkan' },
  { id: 'TRX-250528-002', date: '28 Mei 2025', time: '08:30', name: 'Gaji Karyawan Mingguan', category: 'Pengeluaran', type: 'out', amount: 2100000, status: 'Berhasil' },
  { id: 'TRX-250527-001', date: '27 Mei 2025', time: '19:15', name: 'Penjualan Kasir - Shift Malam', category: 'Pemasukan', type: 'in', amount: 980000, status: 'Berhasil' },
];

export default function RiwayatTransaksiPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Berhasil':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            Berhasil
          </div>
        );
      case 'Tertunda':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
            Tertunda
          </div>
        );
      case 'Dibatalkan':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            Dibatalkan
          </div>
        );
      default:
        return null;
    }
  };

  const filteredData = mockTransactions.filter(trx => 
    trx.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    trx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <IconReceipt2 className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f172a]">Riwayat Transaksi</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Kelola dan pantau seluruh catatan transaksi bisnis Anda secara komprehensif.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <IconPrinter className="w-4 h-4 text-gray-500" />
            Cetak
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <IconDownload className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Mini Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <IconReceipt2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-0.5">Total Transaksi (Bulan Ini)</p>
            <h3 className="text-xl font-bold text-[#0f172a]">128 Trx</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <IconTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-0.5">Volume Transaksi</p>
            <h3 className="text-xl font-bold text-[#0f172a]">Rp 34.500.000</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <IconClockHour4 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-0.5">Pembayaran Tertunda</p>
            <h3 className="text-xl font-bold text-[#0f172a]">4 Trx</h3>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-80">
            <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari ID transaksi atau keterangan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <IconCalendarEvent className="w-4 h-4 text-gray-500" />
              Semua Tanggal
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <IconFilter className="w-4 h-4 text-gray-500" />
              Filter Status
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm">
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">ID Transaksi</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">Tanggal & Waktu</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">Keterangan</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap text-right">Total (Rp)</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((trx) => (
                <tr key={trx.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <span className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
                      {trx.id}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-[#0f172a] font-medium">{trx.date}</span>
                      <span className="text-gray-400 text-xs">{trx.time}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-[#0f172a] font-medium">{trx.name}</span>
                      <span className="text-gray-500 text-xs">{trx.category}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`font-bold ${trx.type === 'in' ? 'text-blue-600' : 'text-[#0f172a]'}`}>
                      {trx.type === 'in' ? '+' : '-'}Rp {trx.amount.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {getStatusBadge(trx.status)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                        <IconEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Unduh Invoice">
                        <IconFileInvoice className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="py-16 text-center flex flex-col items-center">
              <IconReceipt2 className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-[#0f172a] font-semibold text-lg">Tidak ada transaksi ditemukan</p>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">Coba sesuaikan kata kunci pencarian atau filter yang Anda gunakan.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <span className="text-sm text-gray-500">
            Menampilkan <span className="font-semibold text-gray-700">1</span> hingga <span className="font-semibold text-gray-700">{filteredData.length}</span> dari <span className="font-semibold text-gray-700">{mockTransactions.length}</span> transaksi
          </span>
          <div className="flex gap-1">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <IconChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-medium text-sm">
              1
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">
              2
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">
              3
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <IconChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
