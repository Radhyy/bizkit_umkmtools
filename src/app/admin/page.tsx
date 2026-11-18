'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  IconCalendarEvent, 
  IconChevronDown,
  IconArrowUpRight,
  IconArrowDownRight,
  IconStarFilled,
  IconDots,
  IconSearch,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconShieldCheck,
  IconCrown,
  IconUsers,
  IconShoppingBag,
  IconBuildingStore,
} from '@tabler/icons-react';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: 'free' | 'premium' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

// Chart Data matching the reference UI
const monthlyData = [
  { month: 'Jan', thisYearOrders: 105, lastYearOrders: 65, thisYearRev: 3400, lastYearRev: 2200 },
  { month: 'Feb', thisYearOrders: 155, lastYearOrders: 60, thisYearRev: 4800, lastYearRev: 2700 },
  { month: 'Mar', thisYearOrders: 110, lastYearOrders: 75, thisYearRev: 3700, lastYearRev: 3100 },
  { month: 'Apr', thisYearOrders: 140, lastYearOrders: 55, thisYearRev: 4900, lastYearRev: 3300 },
  { month: 'May', thisYearOrders: 205, lastYearOrders: 128, thisYearRev: 7300, lastYearRev: 4200 },
  { month: 'Jun', thisYearOrders: 120, lastYearOrders: 95, thisYearRev: 4300, lastYearRev: 3800 },
  { month: 'Jul', thisYearOrders: 175, lastYearOrders: 110, thisYearRev: 6200, lastYearRev: 4600 },
  { month: 'Aug', thisYearOrders: 165, lastYearOrders: 125, thisYearRev: 5800, lastYearRev: 4900 },
  { month: 'Sep', thisYearOrders: null, lastYearOrders: 140, thisYearRev: null, lastYearRev: 5200 },
  { month: 'Oct', thisYearOrders: null, lastYearOrders: 160, thisYearRev: null, lastYearRev: 5600 },
  { month: 'Nov', thisYearOrders: null, lastYearOrders: 175, thisYearRev: null, lastYearRev: 6100 },
  { month: 'Dec', thisYearOrders: null, lastYearOrders: 195, thisYearRev: null, lastYearRev: 6900 },
];

const categories = [
  { name: "Men's shoes", revenue: '$12,300', percentage: 28 },
  { name: "Women's shoes", revenue: '$9,120', percentage: 21 },
  { name: "Men's apparel", revenue: '$7,340', percentage: 17 },
  { name: "Bags", revenue: '$6,210', percentage: 14 },
  { name: "Women's apparel", revenue: '$5,126', percentage: 12 },
  { name: "Accessories", revenue: '$3,640', percentage: 8 },
];

const topProducts = [
  {
    id: 1,
    name: 'Classic Leather Derby',
    sku: 'SKU SH-M-1023',
    category: "Men's shoes",
    price: '$248',
    sold: 48,
    revenue: '$11,904',
    revenueShare: '27%',
    availability: '42 in stock',
    status: 'in_stock',
    rating: 4.8,
    icon: '👞',
  },
  {
    id: 2,
    name: 'Block Heel Ankle Boot',
    sku: 'SKU SH-W-1187',
    category: "Women's shoes",
    price: '$189',
    sold: 41,
    revenue: '$7,749',
    revenueShare: '18%',
    availability: '23 in stock',
    status: 'in_stock',
    rating: 5.0,
    icon: '👢',
  },
  {
    id: 3,
    name: 'Leather Crossbody Bag',
    sku: 'SKU BG-W-2041',
    category: 'Bags',
    price: '$157',
    sold: 36,
    revenue: '$5,652',
    revenueShare: '13%',
    availability: 'Out of stock',
    status: 'out_of_stock',
    rating: 3.0,
    icon: '👜',
  },
  {
    id: 4,
    name: 'Graphic Cotton Tee',
    sku: 'SKU AP-M-3108',
    category: "Men's apparel",
    price: '$34',
    sold: 120,
    revenue: '$4,080',
    revenueShare: '9%',
    availability: '10 left',
    status: 'low_stock',
    rating: 4.1,
    icon: '👕',
  },
];

// Custom Tooltip matching reference: "May • 205 orders • 128 last year"
const CustomChartTooltip = ({ active, payload, label, chartMetric }: any) => {
  if (active && payload && payload.length) {
    const isOrders = chartMetric === 'orders';
    const thisYearVal = payload.find((p: any) => p.dataKey.includes('thisYear'))?.value;
    const lastYearVal = payload.find((p: any) => p.dataKey.includes('lastYear'))?.value;

    const formattedThis = isOrders ? `${thisYearVal} orders` : `$${Number(thisYearVal).toLocaleString()}`;
    const formattedLast = isOrders ? `${lastYearVal} last year` : `$${Number(lastYearVal).toLocaleString()} last year`;

    return (
      <div className="bg-[#18181b] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 whitespace-nowrap">
        <span>{label}</span>
        <span className="text-zinc-500">•</span>
        <span className="text-blue-400">{thisYearVal !== null && thisYearVal !== undefined ? formattedThis : 'No data'}</span>
        <span className="text-zinc-500">•</span>
        <span className="text-zinc-400">{formattedLast}</span>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const [chartMetric, setChartMetric] = useState<'orders' | 'revenue'>('orders');
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'free' | 'premium' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Gagal mengambil data user:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'free' | 'premium' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah role');

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setNotification({ message: `Role berhasil diubah menjadi ${newRole.toUpperCase()}`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {notification.type === 'success' ? <IconCheck className="w-4 h-4 text-emerald-600" /> : <IconAlertCircle className="w-4 h-4 text-rose-600" />}
          {notification.message}
        </div>
      )}

      {/* Header Section: "Overview" + Filter Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Overview</h1>
        </div>

        {/* Controls on the Right */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Date Picker Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium hover:bg-zinc-50 transition-colors shadow-2xs">
            <IconCalendarEvent className="w-3.5 h-3.5 text-zinc-400" />
            <span>This year</span>
            <span className="text-zinc-400">Jan 1 – Aug 31</span>
            <IconChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
          </button>

          {/* Grain Selector */}
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium hover:bg-zinc-50 transition-colors shadow-2xs">
            <span>Monthly</span>
            <IconChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Comparison */}
          <button className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 font-medium px-1.5 py-1 transition-colors">
            <span>Compared to <strong className="text-zinc-700 font-semibold">Last year</strong></span>
            <IconChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* 5-Column Metric Cards in One Bordered Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
          
          {/* 1. Revenue */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Revenue</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-500 bg-rose-50/80 px-1.5 py-0.5 rounded">
                <IconArrowDownRight className="w-3 h-3" /> 20%
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">$43,736</div>
              <div className="text-[11px] text-zinc-400 mt-1">Last year $54,670</div>
            </div>
          </div>

          {/* 2. Orders */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Orders</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                <IconArrowUpRight className="w-3 h-3" /> 55%
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">1,200</div>
              <div className="text-[11px] text-zinc-400 mt-1">Last year 774</div>
            </div>
          </div>

          {/* 3. Avg. order value */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Avg. order value</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-500 bg-rose-50/80 px-1.5 py-0.5 rounded">
                <IconArrowDownRight className="w-3 h-3" /> 48%
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">$36.45</div>
              <div className="text-[11px] text-zinc-400 mt-1">Last year $70.63</div>
            </div>
          </div>

          {/* 4. Expenses */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Expenses</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                <IconArrowUpRight className="w-3 h-3" /> 45%
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">$12,362</div>
              <div className="text-[11px] text-zinc-400 mt-1">Last year $22,476</div>
            </div>
          </div>

          {/* 5. Profit */}
          <div className="p-4 sm:p-5 flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Profit</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-500 bg-rose-50/80 px-1.5 py-0.5 rounded">
                <IconArrowDownRight className="w-3 h-3" /> 3%
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">$31,374</div>
              <div className="text-[11px] text-zinc-400 mt-1">72% margin</div>
            </div>
          </div>

        </div>
      </div>

      {/* Middle Section: Orders Chart (Left) + Revenue by Category (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Line Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
          
          {/* Header of Chart Card */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900">
              {chartMetric === 'orders' ? 'Orders by month' : 'Revenue by month'}
            </h2>

            {/* Segmented Switch: Revenue | Orders */}
            <div className="bg-[#f4f4f5] p-0.5 rounded-xl flex items-center text-xs font-medium">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartMetric === 'revenue' 
                    ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartMetric === 'orders' 
                    ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Orders
              </button>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex items-center gap-5 mb-5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-[#2563eb] rounded-full inline-block"></span>
              <span className="font-medium text-zinc-700">
                This year {chartMetric === 'orders' ? '1,200' : '$43,736'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-t border-dashed border-zinc-400 inline-block"></span>
              <span className="text-zinc-400">
                Last year {chartMetric === 'orders' ? '774' : '$54,670'}
              </span>
            </div>
          </div>

          {/* Recharts Curve Line */}
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={monthlyData} 
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  domain={[0, chartMetric === 'orders' ? 220 : 8000]}
                  ticks={chartMetric === 'orders' ? [0, 100, 200] : [0, 4000, 8000]}
                />
                <Tooltip 
                  content={<CustomChartTooltip chartMetric={chartMetric} />}
                  cursor={{ stroke: '#f4f4f5', strokeWidth: 1.5 }}
                />
                {/* Last Year - Dashed Grey Line */}
                <Line 
                  type="monotone" 
                  dataKey={chartMetric === 'orders' ? 'lastYearOrders' : 'lastYearRev'} 
                  stroke="#cbd5e1" 
                  strokeWidth={1.8} 
                  strokeDasharray="3 3" 
                  dot={false} 
                />
                {/* This Year - Blue Smooth Line */}
                <Line 
                  type="monotone" 
                  dataKey={chartMetric === 'orders' ? 'thisYearOrders' : 'thisYearRev'} 
                  stroke="#2563eb" 
                  strokeWidth={2.4} 
                  dot={false}
                  activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Revenue by Category Progress Bars */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 mb-5">Revenue by category</h2>
            
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center text-xs">
                  {/* Category Name */}
                  <span className="font-medium text-zinc-700 w-28 truncate">{cat.name}</span>
                  
                  {/* Progress Bar */}
                  <div className="flex-1 mx-3 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#2563eb] rounded-full transition-all duration-500" 
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  
                  {/* Revenue Value & Percentage */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-zinc-900 text-right w-14">{cat.revenue}</span>
                    <span className="text-zinc-400 text-right w-8">{cat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 mt-5 flex items-center justify-between text-[11px] text-zinc-400">
            <span>6 Kategori Aktif</span>
            <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Lihat Rincian</span>
          </div>
        </div>

      </div>

      {/* View Switcher: Top Products Table OR Real-time Platform Users */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`text-sm font-bold pb-2 -mb-3 transition-colors ${
              activeTab === 'overview'
                ? 'text-zinc-900 border-b-2 border-zinc-900'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Top products
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`text-sm font-bold pb-2 -mb-3 transition-colors flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'text-zinc-900 border-b-2 border-zinc-900'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <span>Pengguna Platform</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded-full font-bold">
              {users.length}
            </span>
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="flex items-center gap-2">
            <Link
              href="/admin/pengguna"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Kelola Pengguna Penuh & Trial →
            </Link>
            <button 
              onClick={fetchUsers}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <IconRefresh className="w-3.5 h-3.5" /> Refresh Database
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Top Products Table (Exact UI from reference image) */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-400 font-medium border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3 w-10 text-zinc-400 font-normal">#</th>
                  <th className="px-4 py-3 font-normal">Product</th>
                  <th className="px-4 py-3 font-normal">Category</th>
                  <th className="px-4 py-3 font-normal">Unit price</th>
                  <th className="px-4 py-3 font-normal">Units sold</th>
                  <th className="px-4 py-3 font-normal">
                    <span className="inline-flex items-center gap-1 text-zinc-700 font-medium cursor-pointer">
                      Revenue ▾
                    </span>
                  </th>
                  <th className="px-4 py-3 font-normal">Availability</th>
                  <th className="px-4 py-3 font-normal">Rating</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {topProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* Index */}
                    <td className="px-5 py-3.5 text-zinc-400 font-normal">{p.id}</td>

                    {/* Product name & thumbnail */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-lg shrink-0">
                          {p.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 text-xs sm:text-sm leading-tight">{p.name}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{p.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-zinc-600 font-normal">{p.category}</td>

                    {/* Unit Price */}
                    <td className="px-4 py-3.5 text-zinc-700 font-medium">{p.price}</td>

                    {/* Units Sold */}
                    <td className="px-4 py-3.5 text-zinc-700 font-medium">{p.sold}</td>

                    {/* Revenue & Share */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900">{p.revenue}</span>
                        <span className="text-[11px] text-zinc-400">{p.revenueShare}</span>
                      </div>
                    </td>

                    {/* Availability Status */}
                    <td className="px-4 py-3.5">
                      {p.status === 'in_stock' && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {p.availability}
                        </span>
                      )}
                      {p.status === 'out_of_stock' && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-rose-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          {p.availability}
                        </span>
                      )}
                      {p.status === 'low_stock' && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-amber-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {p.availability}
                        </span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-zinc-700 font-semibold">
                        <IconStarFilled className="w-3.5 h-3.5 text-amber-400" />
                        <span>{p.rating.toFixed(1)}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      <button className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors">
                        <IconDots className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Real-time User Management Table (PostgreSQL Active Data) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          
          {/* Filter Bar */}
          <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1 rounded-lg transition-all ${filterRole === 'all' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Semua ({users.length})
              </button>
              <button
                onClick={() => setFilterRole('free')}
                className={`px-3 py-1 rounded-lg transition-all ${filterRole === 'free' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Free
              </button>
              <button
                onClick={() => setFilterRole('premium')}
                className={`px-3 py-1 rounded-lg transition-all ${filterRole === 'premium' ? 'bg-white text-amber-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Premium
              </button>
              <button
                onClick={() => setFilterRole('admin')}
                className={`px-3 py-1 rounded-lg transition-all ${filterRole === 'admin' ? 'bg-white text-blue-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Admin
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <IconSearch className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Cari user / email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f4f5] border border-transparent rounded-xl focus:outline-none focus:border-zinc-300 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/60">
                <tr>
                  <th className="px-5 py-3 font-normal">Pengguna</th>
                  <th className="px-4 py-3 font-normal">Status Akun</th>
                  <th className="px-4 py-3 font-normal">Role Aktif</th>
                  <th className="px-4 py-3 font-normal">Aksi Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                      Tidak ada pengguna yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'admin' ? 'bg-blue-100 text-blue-700' : u.role === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900">{u.name || 'Pengguna Tanpa Nama'}</p>
                            <p className="text-[11px] text-zinc-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Menunggu OTP
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' : u.role === 'premium' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {u.role || 'free'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            disabled={updatingUserId === u.id}
                            value={u.role || 'free'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as 'free' | 'premium' | 'admin')}
                            className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer disabled:opacity-50"
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="admin">Admin</option>
                          </select>
                          {updatingUserId === u.id && (
                            <span className="text-[10px] text-blue-600 font-medium animate-pulse">Menyimpan...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
