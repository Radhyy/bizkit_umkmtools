'use client';
import React, { useState } from 'react';
import { 
  IconReportAnalytics,
  IconCalendarEvent,
  IconChevronDown,
  IconDownload
} from '@tabler/icons-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const dataGrafik = [
  { name: 'Minggu 1', Pendapatan: 22, Pengeluaran: 15 },
  { name: 'Minggu 2', Pendapatan: 24, Pengeluaran: 14 },
  { name: 'Minggu 3', Pendapatan: 20, Pengeluaran: 13 },
  { name: 'Minggu 4', Pendapatan: 26, Pengeluaran: 17 },
];

const dataPenjualan = [
  { name: '1 Mei', pesanan: 12 },
  { name: '5 Mei', pesanan: 18 },
  { name: '10 Mei', pesanan: 15 },
  { name: '15 Mei', pesanan: 25 },
  { name: '20 Mei', pesanan: 22 },
  { name: '25 Mei', pesanan: 30 },
  { name: '30 Mei', pesanan: 35 },
];

const dataInventori = [
  { name: 'Bahan Baku', stok: 85 },
  { name: 'Kemasan', stok: 45 },
  { name: 'Bumbu', stok: 60 },
  { name: 'Minuman', stok: 30 },
];

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState('keuangan');

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <IconReportAnalytics className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f172a]">Laporan</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Unduh laporan lengkap bisnis Anda dalam berbagai format.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg w-full md:w-max border border-gray-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          onClick={() => setActiveTab('keuangan')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'keuangan' 
              ? 'bg-white shadow-sm border border-gray-100 text-[#0f172a]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Laporan Keuangan
        </button>
        <button 
          onClick={() => setActiveTab('penjualan')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'penjualan' 
              ? 'bg-white shadow-sm border border-gray-100 text-[#0f172a]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Laporan Penjualan
        </button>
        <button 
          onClick={() => setActiveTab('inventori')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'inventori' 
              ? 'bg-white shadow-sm border border-gray-100 text-[#0f172a]' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Laporan Inventori
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto">
          <IconCalendarEvent className="w-4 h-4 text-gray-400" />
          Mei 2025
          <IconChevronDown className="w-4 h-4 text-gray-400 ml-1" />
        </button>
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto">
          <IconDownload className="w-4 h-4" />
          Unduh Laporan
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'keuangan' && (
        <>
          {/* Ringkasan Laporan */}
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] mb-4">Ringkasan Laporan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                <span className="text-gray-500 font-medium text-sm mb-2">Total Pendapatan</span>
                <span className="text-2xl font-bold text-[#0f172a]">Rp 24.500.000</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                <span className="text-gray-500 font-medium text-sm mb-2">Total Pengeluaran</span>
                <span className="text-2xl font-bold text-[#0f172a]">Rp 12.800.000</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                <span className="text-gray-500 font-medium text-sm mb-2">Laba Bersih</span>
                <span className="text-2xl font-bold text-blue-600">Rp 11.700.000</span>
              </div>
            </div>
          </div>

          {/* Grafik Laba Rugi */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-[#0f172a] mb-6">Grafik Laba Rugi</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataGrafik} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    tickFormatter={(value) => `${value} jt`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`Rp ${value}.000.000`, '']}
                  />
                  <Legend 
                    iconType="circle" 
                    verticalAlign="top" 
                    align="right" 
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '14px' }} 
                  />
                  <Bar dataKey="Pendapatan" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'penjualan' && (
        <div>
          <h2 className="text-lg font-bold text-[#0f172a] mb-4">Ringkasan Penjualan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-gray-500 font-medium text-sm mb-2">Total Pesanan</span>
              <span className="text-2xl font-bold text-[#0f172a]">342</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-gray-500 font-medium text-sm mb-2">Produk Terjual</span>
              <span className="text-2xl font-bold text-[#0f172a]">1.284</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-gray-500 font-medium text-sm mb-2">Rata-rata Nilai Pesanan</span>
              <span className="text-2xl font-bold text-blue-600">Rp 71.600</span>
            </div>
          </div>
          
          <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-[#0f172a] mb-6">Tren Pesanan Harian</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataPenjualan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPesanan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="pesanan" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPesanan)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventori' && (
        <div>
          <h2 className="text-lg font-bold text-[#0f172a] mb-4">Ringkasan Inventori</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-gray-500 font-medium text-sm mb-2">Total Jenis Barang</span>
              <span className="text-2xl font-bold text-[#0f172a]">86</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-gray-500 font-medium text-sm mb-2">Stok Hampir Habis</span>
              <span className="text-2xl font-bold text-red-500">12 Item</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-gray-500 font-medium text-sm mb-2">Total Nilai Stok</span>
              <span className="text-2xl font-bold text-blue-600">Rp 45.200.000</span>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-[#0f172a] mb-6">Status Ketersediaan Kategori</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataInventori} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="stok" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
