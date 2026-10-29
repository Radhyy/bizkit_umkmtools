'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  IconRefresh, 
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconCashBanknote,
  IconChevronDown,
  IconCalendarEvent,
  IconFilter,
  IconArrowRight,
  IconReceipt2
} from '@tabler/icons-react';

const transaksiData = [
  { id: 1, tanggal: '31 Mei 2025', kategori: 'Penjualan', deskripsi: 'Penjualan Kasir', jumlah: 1250000, tipe: 'masuk' },
  { id: 2, tanggal: '31 Mei 2025', kategori: 'Bahan Baku', deskripsi: 'Pembelian Ayam', jumlah: 850000, tipe: 'keluar' },
  { id: 3, tanggal: '30 Mei 2025', kategori: 'Penjualan', deskripsi: 'Penjualan Kasir', jumlah: 980000, tipe: 'masuk' },
  { id: 4, tanggal: '30 Mei 2025', kategori: 'Operasional', deskripsi: 'Listrik', jumlah: 320000, tipe: 'keluar' },
  { id: 5, tanggal: '29 Mei 2025', kategori: 'Bahan Baku', deskripsi: 'Pembelian Sayur', jumlah: 450000, tipe: 'keluar' },
  { id: 6, tanggal: '29 Mei 2025', kategori: 'Penjualan', deskripsi: 'Pesanan Katering', jumlah: 3500000, tipe: 'masuk' },
  { id: 7, tanggal: '28 Mei 2025', kategori: 'Operasional', deskripsi: 'Gaji Karyawan', jumlah: 4500000, tipe: 'keluar' },
  { id: 8, tanggal: '28 Mei 2025', kategori: 'Penjualan', deskripsi: 'Penjualan Kasir', jumlah: 1100000, tipe: 'masuk' },
];

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

export default function KeuanganPage() {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pemasukan' | 'pengeluaran'>('ringkasan');

  // Filter transactions based on active tab
  const filteredTransaksi = transaksiData.filter(trx => {
    if (activeTab === 'pemasukan') return trx.tipe === 'masuk';
    if (activeTab === 'pengeluaran') return trx.tipe === 'keluar';
    return true; // ringkasan
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <IconReceipt2 className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f172a]">Pemasukan & Pengeluaran</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Pantau arus kas bisnis Anda secara detail dan real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shrink-0">
            <IconRefresh className="w-5 h-5" />
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto">
            Unduh Laporan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-white p-1 rounded-lg w-full sm:w-max border border-gray-100 overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab('ringkasan')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'ringkasan' 
              ? 'bg-white shadow-sm border border-gray-100 text-[#0f172a]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ringkasan
        </button>
        <button 
          onClick={() => setActiveTab('pemasukan')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'pemasukan' 
              ? 'bg-white shadow-sm border border-gray-100 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pemasukan
        </button>
        <button 
          onClick={() => setActiveTab('pengeluaran')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'pengeluaran' 
              ? 'bg-white shadow-sm border border-gray-100 text-red-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pengeluaran
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Card 1: Total Pemasukan (Ringkasan & Pemasukan) or Total Pengeluaran (Pengeluaran) */}
        {activeTab !== 'pengeluaran' ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between">
            <div className="flex flex-col">
              <h3 className="text-gray-500 font-medium mb-3">Total Pemasukan</h3>
              <div className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-2 whitespace-nowrap">Rp 24.500.000</div>
              <span className="text-blue-500 text-xs font-semibold flex items-center gap-1 mt-auto">
                <IconTrendingUp className="w-3 h-3" /> +12% dari bulan lalu
              </span>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="p-1.5 bg-blue-50 rounded-lg mb-4">
                <IconWallet className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-end gap-1.5 h-10">
                <div className="w-2.5 rounded-t-sm bg-blue-500/30 h-[30%]"></div>
                <div className="w-2.5 rounded-t-sm bg-blue-500/50 h-[50%]"></div>
                <div className="w-2.5 rounded-t-sm bg-blue-500/40 h-[40%]"></div>
                <div className="w-2.5 rounded-t-sm bg-blue-500/70 h-[70%]"></div>
                <div className="w-2.5 rounded-t-sm bg-blue-500/60 h-[60%]"></div>
                <div className="w-2.5 rounded-t-sm bg-blue-500/80 h-[80%]"></div>
                <div className="w-2.5 rounded-t-sm bg-blue-500 h-[100%]"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between">
            <div className="flex flex-col">
              <h3 className="text-gray-500 font-medium mb-3">Total Pengeluaran</h3>
              <div className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-2 whitespace-nowrap">Rp 12.800.000</div>
              <span className="text-red-500 text-xs font-semibold flex items-center gap-1 mt-auto">
                <IconTrendingDown className="w-3 h-3" /> +8% dari bulan lalu
              </span>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="p-1.5 bg-red-50 rounded-lg mb-4">
                <IconCashBanknote className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-end gap-1.5 h-10">
                <div className="w-2.5 rounded-t-sm bg-red-500/30 h-[20%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/50 h-[40%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/40 h-[30%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/70 h-[60%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/60 h-[50%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/80 h-[70%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500 h-[90%]"></div>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: Total Pengeluaran (Ringkasan) or Jumlah Transaksi (Pemasukan / Pengeluaran) */}
        {activeTab === 'ringkasan' ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between">
            <div className="flex flex-col">
              <h3 className="text-gray-500 font-medium mb-3">Total Pengeluaran</h3>
              <div className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-2 whitespace-nowrap">Rp 12.800.000</div>
              <span className="text-red-500 text-xs font-semibold flex items-center gap-1 mt-auto">
                <IconTrendingDown className="w-3 h-3" /> +8% dari bulan lalu
              </span>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className="p-1.5 bg-red-50 rounded-lg mb-4">
                <IconCashBanknote className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-end gap-1.5 h-10">
                <div className="w-2.5 rounded-t-sm bg-red-500/30 h-[20%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/50 h-[40%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/40 h-[30%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/70 h-[60%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/60 h-[50%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500/80 h-[70%]"></div>
                <div className="w-2.5 rounded-t-sm bg-red-500 h-[90%]"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between">
            <div className="flex flex-col">
              <h3 className="text-gray-500 font-medium mb-3">Total Transaksi {activeTab === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}</h3>
              <div className="text-3xl font-bold text-[#0f172a] mb-2">
                {transaksiData.filter(t => t.tipe === (activeTab === 'pemasukan' ? 'masuk' : 'keluar')).length} Transaksi
              </div>
              <span className={`${activeTab === 'pemasukan' ? 'text-blue-500' : 'text-red-500'} text-xs font-semibold flex items-center gap-1 mt-auto`}>
                <IconTrendingUp className="w-3 h-3" /> +3% dari bulan lalu
              </span>
            </div>
            <div className="flex flex-col items-end justify-between">
              <div className={`p-1.5 rounded-lg mb-4 ${activeTab === 'pemasukan' ? 'bg-blue-50' : 'bg-red-50'}`}>
                <IconReceipt2 className={`w-5 h-5 ${activeTab === 'pemasukan' ? 'text-blue-500' : 'text-red-500'}`} />
              </div>
              <div className="flex items-end gap-1.5 h-10">
                {[20, 40, 30, 60, 50, 70, 90].map((h, i) => (
                  <div key={i} className={`w-2.5 rounded-t-sm ${activeTab === 'pemasukan' ? 'bg-blue-500' : 'bg-red-500'}`} style={{ height: `${h}%`, opacity: 0.3 + (i * 0.1) }}></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        {/* Table Header Controls */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-lg font-bold text-[#0f172a]">
            {activeTab === 'ringkasan' ? 'Detail Transaksi' : 
             activeTab === 'pemasukan' ? 'Detail Pemasukan' : 'Detail Pengeluaran'}
          </h2>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center justify-between sm:justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <IconFilter className="w-4 h-4 text-gray-400" />
                Semua Kategori
              </div>
              <IconChevronDown className="w-4 h-4 text-gray-400 ml-1" />
            </button>
            <button className="flex items-center justify-between sm:justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <IconCalendarEvent className="w-4 h-4 text-gray-400" />
                1 - 31 Mei 2025
              </div>
              <IconChevronDown className="w-4 h-4 text-gray-400 ml-1" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTransaksi.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-gray-600 font-medium whitespace-nowrap">
                    {trx.tanggal}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {trx.kategori}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-[#0f172a] font-medium">
                    {trx.deskripsi}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <span className={`font-bold ${trx.tipe === 'masuk' ? 'text-blue-600' : 'text-[#0f172a]'}`}>
                      {trx.tipe === 'masuk' ? '+' : '-'}{formatRupiah(trx.jumlah)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTransaksi.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Tidak ada transaksi untuk ditampilkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {activeTab === 'ringkasan' && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
            <Link href="/dashboard/riwayat" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group">
              Lihat Semua Transaksi
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
