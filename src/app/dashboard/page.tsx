'use client';
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar
} from 'recharts';
import { 
  IconRefresh, 
  IconCalendarEvent, 
  IconChevronDown,
  IconWallet,
  IconCashBanknote,
  IconChartPie,
  IconReceipt,
  IconTrendingUp,
  IconTrendingDown,
  IconShoppingBag,
  IconBox
} from '@tabler/icons-react';

const revenueData = [
  { time: '1 Ags', pendapatan: 3100000, pengeluaran: 1200000 },
  { time: '2 Ags', pendapatan: 3800000, pengeluaran: 2100000 },
  { time: '3 Ags', pendapatan: 2300000, pengeluaran: 800000 },
  { time: '4 Ags', pendapatan: 4700000, pengeluaran: 1500000 },
  { time: '5 Ags', pendapatan: 2100000, pengeluaran: 900000 },
  { time: '6 Ags', pendapatan: 3800000, pengeluaran: 1600000 },
  { time: '7 Ags', pendapatan: 5200000, pengeluaran: 2000000 },
  { time: '8 Ags', pendapatan: 3200000, pengeluaran: 1100000 },
  { time: '9 Ags', pendapatan: 4000000, pengeluaran: 1800000 },
  { time: '10 Ags', pendapatan: 3700000, pengeluaran: 1400000 },
  { time: '11 Ags', pendapatan: 4900000, pengeluaran: 2500000 },
  { time: '12 Ags', pendapatan: 4500000, pengeluaran: 1700000 },
];

const cashflowData = [
  { day: 'Sen', masuk: 5000000, keluar: 2000000 },
  { day: 'Sel', masuk: 2500000, keluar: 1000000 },
  { day: 'Rab', masuk: 6000000, keluar: 3500000 },
  { day: 'Kam', masuk: 4200000, keluar: 1800000 },
  { day: 'Jum', masuk: 7000000, keluar: 4000000 },
  { day: 'Sab', masuk: 8500000, keluar: 2500000 },
  { day: 'Min', masuk: 9200000, keluar: 3000000 },
];

const formatRupiah = (value: number) => {
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}Jt`;
  } else if (value >= 1000) {
    return `Rp ${(value / 1000).toFixed(0)}Rb`;
  }
  return `Rp ${value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-lg p-3 text-sm flex flex-col gap-2 min-w-[150px]">
        <p className="text-gray-500 font-medium mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-gray-700 font-semibold">Pendapatan</span>
          <span className="ml-auto font-bold text-gray-900">{formatRupiah(payload[0].value)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-gray-700 font-semibold">Pengeluaran</span>
          <span className="ml-auto font-bold text-gray-900">{formatRupiah(payload[1].value)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0f172a] mb-1">Ringkasan Bisnis</h1>
          <p className="text-gray-500 text-sm">Diperbarui 5 menit yang lalu</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shrink-0">
            <IconRefresh className="w-5 h-5" />
          </button>
          <button className="flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <IconCalendarEvent className="w-4 h-4 text-gray-400" />
              Bulan Ini
            </div>
            <IconChevronDown className="w-4 h-4 text-gray-400 ml-1" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-white p-1 rounded-lg w-full sm:w-max border border-gray-100 overflow-x-auto custom-scrollbar">
        <button className="px-5 py-2 text-sm font-medium bg-white shadow-sm border border-gray-100 rounded-md text-[#0f172a] whitespace-nowrap">
          Semua Toko
        </button>
        <button className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">
          Toko Online
        </button>
        <button className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">
          Toko Fisik
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Total Pendapatan */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 font-medium">Total Pendapatan</h3>
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <IconWallet className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-2xl font-bold text-[#0f172a]">Rp 45.2M</span>
            <span className="text-blue-500 text-xs font-semibold flex items-center gap-1">
              <IconTrendingUp className="w-3 h-3" /> +12.5% bln lalu
            </span>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 font-medium">Total Pengeluaran</h3>
            <div className="p-1.5 bg-red-50 rounded-lg">
              <IconCashBanknote className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-2xl font-bold text-[#0f172a]">Rp 18.6M</span>
            <span className="text-red-500 text-xs font-semibold flex items-center gap-1">
              <IconTrendingUp className="w-3 h-3" /> +4.2% bln lalu
            </span>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 font-medium">Laba Bersih</h3>
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <IconChartPie className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-2xl font-bold text-[#0f172a]">Rp 26.6M</span>
            <span className="text-blue-500 text-xs font-semibold flex items-center gap-1">
              <IconTrendingUp className="w-3 h-3" /> +18.4% bln lalu
            </span>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 font-medium">Total Transaksi</h3>
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <IconReceipt className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-2xl font-bold text-[#0f172a]">1,284</span>
            <span className="text-blue-500 text-xs font-semibold flex items-center gap-1">
              <IconTrendingUp className="w-3 h-3" /> +8.1% bln lalu
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-bold text-[#0f172a]">Tren Pendapatan & Pengeluaran</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-sm font-medium text-gray-600">Pendapatan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-sm font-medium text-gray-600">Pengeluaran</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              12 Hari Terakhir
              <IconChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={formatRupiah}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Line 
                type="monotone" 
                dataKey="pendapatan" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                fillOpacity={1} 
                fill="url(#colorPendapatan)" 
              />
              <Line 
                type="monotone" 
                dataKey="pengeluaran" 
                stroke="#f87171" 
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 6, fill: "#f87171", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Arus Kas) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#0f172a] mb-1">Arus Kas Mingguan</h2>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-3xl font-bold text-[#0f172a]">Rp 42.4M</span>
                <span className="text-gray-400 text-sm">Total Masuk</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs mb-2 hidden sm:inline-block">+12.5% vs minggu lalu</span>
              <div className="flex flex-col gap-1 text-xs mt-1">
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-gray-500 hidden sm:inline">Uang Masuk</span>
                  <span className="font-bold text-[#0f172a]">Rp 42.4M</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-gray-500 hidden sm:inline">Uang Keluar</span>
                  <span className="font-bold text-[#0f172a]">Rp 17.8M</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} barSize={20} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={formatRupiah}
                />
                <Bar dataKey="masuk" stackId="a" fill="#60a5fa" radius={[0, 0, 4, 4]} />
                <Bar dataKey="keluar" stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (Events) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Notable Events */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#0f172a]">Transaksi Terbaru</h2>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua</button>
            </div>
            <div className="space-y-3">
              <div className="p-3 border border-gray-100 rounded-xl flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 mt-0.5">
                  <IconShoppingBag className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm text-[#0f172a]">Pesanan #INV-082</h4>
                    <span className="text-xs text-gray-400 font-medium">10:42</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Budi Santoso (3 Item)</p>
                    <span className="text-xs font-bold text-blue-600">+Rp 320.000</span>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-gray-100 rounded-xl flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="bg-orange-50 p-1.5 rounded-lg text-orange-600 mt-0.5">
                  <IconBox className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm text-[#0f172a]">Restok Barang</h4>
                    <span className="text-xs text-gray-400 font-medium">09:15</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Kopi Bubuk (50 Pcs)</p>
                    <span className="text-xs font-bold text-orange-600">-Rp 1.250.000</span>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-gray-100 rounded-xl flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 mt-0.5">
                  <IconShoppingBag className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm text-[#0f172a]">Pesanan #INV-081</h4>
                    <span className="text-xs text-gray-400 font-medium">Kemarin</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Siti Aminah (1 Item)</p>
                    <span className="text-xs font-bold text-blue-600">+Rp 85.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Breathing Events -> Inventory Summary */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-[#0f172a] mb-4">Status Stok</h2>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 font-medium mb-1">Tersedia</p>
                <p className="text-sm font-bold text-[#0f172a]">1,204</p>
              </div>
              <div className="w-px h-8 bg-gray-100"></div>
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 font-medium mb-1">Menipis</p>
                <p className="text-sm font-bold text-orange-500">18</p>
              </div>
              <div className="w-px h-8 bg-gray-100"></div>
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 font-medium mb-1">Habis</p>
                <p className="text-sm font-bold text-red-500">3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
