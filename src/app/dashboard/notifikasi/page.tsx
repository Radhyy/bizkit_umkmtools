'use client';
import React, { useState } from 'react';
import { 
  IconBell,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconReceipt2,
  IconChecks,
  IconSearch
} from '@tabler/icons-react';

const initialNotifikasi = [
  {
    id: 1,
    title: 'Stok Barang Menipis',
    message: 'Stok Ayam Potong tinggal 5 ekor. Segera lakukan pemesanan ulang ke supplier.',
    time: '2 jam yang lalu',
    type: 'alert',
    read: false,
  },
  {
    id: 2,
    title: 'Transaksi Berhasil',
    message: 'Pembayaran pesanan katering sebesar Rp 3.500.000 telah berhasil diterima.',
    time: '5 jam yang lalu',
    type: 'success',
    read: false,
  },
  {
    id: 3,
    title: 'Laporan Mingguan Siap',
    message: 'Laporan penjualan minggu ke-4 bulan Mei sudah bisa Anda unduh di menu Laporan Bisnis.',
    time: '1 hari yang lalu',
    type: 'info',
    read: true,
  },
  {
    id: 4,
    title: 'Pembaruan Sistem',
    message: 'Fitur baru "Asisten AI" telah ditambahkan. Coba sekarang untuk mendapatkan insight bisnis!',
    time: '2 hari yang lalu',
    type: 'system',
    read: true,
  }
];

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState(initialNotifikasi);
  const [searchQuery, setSearchQuery] = useState('');

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filteredNotifications = notifications.filter(notif => 
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    notif.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <div className="p-2.5 bg-red-50 text-red-500 rounded-xl"><IconAlertTriangle className="w-5 h-5" /></div>;
      case 'success':
        return <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl"><IconCheck className="w-5 h-5" /></div>;
      case 'info':
        return <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl"><IconReceipt2 className="w-5 h-5" /></div>;
      default:
        return <div className="p-2.5 bg-gray-100 text-gray-500 rounded-xl"><IconInfoCircle className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <IconBell className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a]">Notifikasi</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Pantau aktivitas terbaru dan pemberitahuan penting terkait bisnis Anda.
        </p>
      </div>

      {/* Controls Section */}
      <div className="flex justify-between items-center mb-2">
        <div className="relative w-80">
          <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari notifikasi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <IconChecks className="w-4 h-4" />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {filteredNotifications.map((notif, index) => (
          <div 
            key={notif.id}
            onClick={() => markAsRead(notif.id)}
            className={`flex items-start gap-4 p-5 transition-colors cursor-pointer ${
              notif.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
            } ${index !== notifications.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="shrink-0">
              {getIcon(notif.type)}
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className={`font-semibold text-sm truncate ${notif.read ? 'text-[#0f172a]' : 'text-blue-900'}`}>
                  {notif.title}
                </h3>
                <span className="shrink-0 text-xs text-gray-400 font-medium">
                  {notif.time}
                </span>
              </div>
              <p className={`text-sm ${notif.read ? 'text-gray-500' : 'text-gray-700'}`}>
                {notif.message}
              </p>
            </div>

            {!notif.read && (
              <div className="shrink-0 self-center">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <IconBell className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>{searchQuery ? 'Tidak ada notifikasi yang sesuai dengan pencarian Anda.' : 'Belum ada notifikasi baru.'}</p>
          </div>
        )}
      </div>

    </div>
  );
}
