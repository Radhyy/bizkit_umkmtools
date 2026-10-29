'use client';
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  IconRefresh, 
  IconTrendingUp,
  IconBulb,
  IconAlertCircle,
  IconChartLine,
  IconChevronRight,
  IconSparkles,
  IconArrowRight,
  IconFlame
} from '@tabler/icons-react';

const trenPenjualanData = [
  { day: 'Sen', current: 12, prev: 10 },
  { day: 'Sel', current: 16, prev: 15 },
  { day: 'Rab', current: 24, prev: 18 },
  { day: 'Kam', current: 19, prev: 17 },
  { day: 'Jum', current: 28, prev: 22 },
  { day: 'Sab', current: 33, prev: 25 },
  { day: 'Min', current: 28, prev: 20 },
];

const menuLaris = [
  { rank: 1, name: 'Nasi Goreng Spesial', qty: 32, trend: 'up' },
  { rank: 2, name: 'Ayam Geprek', qty: 28, trend: 'up' },
  { rank: 3, name: 'Es Teh Manis', qty: 24, trend: 'stable' },
  { rank: 4, name: 'Mie Ayam', qty: 16, trend: 'down' },
  { rank: 5, name: 'Es Jeruk', qty: 16, trend: 'up' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-lg p-3 text-sm flex flex-col gap-2 min-w-[140px]">
        <p className="text-gray-500 font-medium mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-gray-700 font-semibold">Minggu Ini</span>
          <span className="ml-auto font-bold text-gray-900">{payload[0].value}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-100" />
          <span className="text-gray-700 font-semibold">Minggu Lalu</span>
          <span className="ml-auto font-bold text-gray-900">{payload[1].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function InsightPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <IconSparkles className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f172a]">Insight Bisnis</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Analisis data untuk membantu Anda mengambil keputusan yang lebih baik.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            <IconRefresh className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-white p-1 rounded-lg border border-gray-100 overflow-x-auto no-scrollbar max-w-full">
        <button className="px-5 py-2 text-sm font-medium bg-white shadow-sm border border-gray-100 rounded-md text-[#0f172a] whitespace-nowrap shrink-0">
          Ringkasan
        </button>
        <button className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap shrink-0">
          Tren Penjualan
        </button>
        <button className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap shrink-0">
          Perilaku Pelanggan
        </button>
        <button className="px-5 py-2 text-sm font-medium text-blue-600 flex items-center gap-1.5 hover:text-blue-700 whitespace-nowrap shrink-0">
          <IconSparkles className="w-4 h-4" />
          Rekomendasi AI
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tren Penjualan Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#0f172a] mb-1">Tren Penjualan</h2>
              <p className="text-sm text-gray-500">Berdasarkan volume pesanan</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-blue-500 font-bold flex items-center gap-1 text-lg">
                <IconTrendingUp className="w-5 h-5" /> +12%
              </span>
              <span className="text-xs text-gray-400">dibanding minggu lalu</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[220px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trenPenjualanData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={2}>
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
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="prev" fill="#bfdbfe" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Menu Paling Laris */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
              <IconFlame className="w-5 h-5 text-orange-500" />
              Menu Paling Laris
            </h2>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Lihat Semua</button>
          </div>
          
          <div className="space-y-4">
            {menuLaris.map((item) => (
              <div key={item.rank} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold w-6 text-center ${item.rank <= 3 ? 'text-[#0f172a]' : 'text-gray-400'}`}>
                    {item.rank}.
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#0f172a] transition-colors">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[#0f172a]">{item.qty} porsi</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wawasan Penting */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-[#0f172a] mb-5">Wawasan Penting</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-full shrink-0 mt-0.5">
                <IconChartLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Penjualan <span className="font-semibold text-[#0f172a]">meningkat di akhir pekan</span> (terutama Sabtu & Minggu).
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-full shrink-0 mt-0.5">
                <IconBulb className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Pelanggan cenderung memesan <span className="font-semibold text-[#0f172a]">menu minuman di siang hari</span> saat cuaca terik.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 bg-red-100 text-red-600 rounded-full shrink-0 mt-0.5">
                <IconAlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Bahan baku ayam mengalami <span className="font-semibold text-red-600">kenaikan harga sebesar 18%</span> dalam 7 hari terakhir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rekomendasi Tindakan (AI) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <IconSparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#0f172a]">Rekomendasi Tindakan</h2>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
              Pertimbangkan untuk membuat promo paket menu di akhir pekan (Nasi Goreng Spesial + Es Teh Manis) dan segera cari alternatif supplier bahan baku ayam untuk menekan biaya modal.
            </p>
            
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm">
              Terapkan Sekarang
              <IconArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
