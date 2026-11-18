'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IconCheck, 
  IconAlertTriangle, 
  IconInfoCircle, 
  IconReceipt2, 
  IconChecks, 
  IconSearch,
  IconBell,
  IconTrash,
  IconTrendingUp,
  IconSparkles,
  IconX,
  IconRefresh
} from '@tabler/icons-react';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  time: string;
  category: 'keuangan' | 'peringatan' | 'sistem';
  type: 'alert' | 'success' | 'info' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function NotifikasiPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email: string } | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'semua' | 'unread' | 'keuangan' | 'peringatan'>('semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ambil data notifikasi realtime dari database
  const fetchNotifications = useCallback(async (userId: string, isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/notifikasi?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Inisialisasi User & Polling Real-time
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!raw) {
      router.push('/login');
      return;
    }

    try {
      const u = JSON.parse(raw);
      if (!u?.id) {
        router.push('/login');
        return;
      }
      setCurrentUser(u);
      fetchNotifications(u.id);

      // Polling real-time setiap 10 detik agar aktivitas keuangan terbaru langsung muncul
      const interval = setInterval(() => {
        fetchNotifications(u.id);
      }, 10000);

      return () => clearInterval(interval);
    } catch {
      router.push('/login');
    }
  }, [router, fetchNotifications]);

  // Tandai Semua Telah Dibaca
  const markAllAsRead = async () => {
    if (!currentUser?.id) return;
    
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setToastMessage('Semua notifikasi telah ditandai sebagai dibaca.');
    setTimeout(() => setToastMessage(null), 3000);

    try {
      await fetch('/api/notifikasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, markAll: true }),
      });
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Tandai Satu Notifikasi Dibaca
  const markAsRead = async (id: string, currentReadStatus: boolean) => {
    if (currentReadStatus) return; // Sudah dibaca

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifikasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Hapus Notifikasi
  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!currentUser?.id) return;

    const target = notifications.find((n) => n.id === id);
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setToastMessage('Notifikasi berhasil dihapus.');
    setTimeout(() => setToastMessage(null), 2500);

    try {
      await fetch(`/api/notifikasi?id=${id}&userId=${currentUser.id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Filter notifikasi berdasarkan Tab & Pencarian
  const filteredNotifications = notifications.filter((notif) => {
    const matchSearch =
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'unread') return !notif.read;
    if (activeTab === 'keuangan') return notif.category === 'keuangan';
    if (activeTab === 'peringatan') return notif.category === 'peringatan';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return (
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60 shadow-2xs">
            <IconAlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'success':
        return (
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200/60 shadow-2xs">
            <IconTrendingUp className="w-4 h-4" />
          </div>
        );
      case 'info':
        return (
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200/60 shadow-2xs">
            <IconReceipt2 className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-zinc-100 text-zinc-700 rounded-xl border border-zinc-200/60 shadow-2xs">
            <IconSparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <IconCheck className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-zinc-700">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section (Tanpa Icon di samping H1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Notifikasi</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Realtime
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pantau aktivitas transaksi terbaru, peringatan kas, dan pemberitahuan penting terkait bisnis Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Segarkan Manual */}
          <button
            onClick={() => currentUser?.id && fetchNotifications(currentUser.id, true)}
            title="Segarkan data notifikasi"
            disabled={isRefreshing}
            className="p-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
          </button>

          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-semibold hover:bg-zinc-50 text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <IconChecks className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 text-xs font-semibold shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${unreadCount > 0 ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
            <span>{unreadCount} Belum Dibaca</span>
          </div>
        </div>
      </div>

      {/* Segmented Filter Bar + Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Segmented Switch Tabs */}
        <div className="bg-[#f4f4f5] p-1 rounded-xl flex items-center text-xs font-medium w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('semua')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'semua' 
                ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'unread' 
                ? 'bg-white text-blue-600 font-semibold shadow-2xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab('keuangan')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'keuangan' 
                ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Keuangan
          </button>
          <button
            onClick={() => setActiveTab('peringatan')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'peringatan' 
                ? 'bg-white text-amber-600 font-semibold shadow-2xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Peringatan
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <IconSearch className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari dalam notifikasi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all shadow-2xs"
          />
        </div>

      </div>

      {/* Notifications List Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden divide-y divide-zinc-100">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-zinc-100 rounded w-1/4" />
                  <div className="h-3 bg-zinc-50 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => markAsRead(notif.id, notif.read)}
              className={`group flex items-start gap-4 p-4 sm:p-5 transition-colors cursor-pointer relative ${
                notif.read ? 'bg-white hover:bg-zinc-50/80' : 'bg-blue-50/20 hover:bg-blue-50/30'
              }`}
            >
              {/* Left Icon */}
              <div className="shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              
              {/* Center Content */}
              <div className="flex-1 min-w-0 pr-6 sm:pr-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h3 className={`text-xs sm:text-sm font-bold truncate ${
                    notif.read ? 'text-zinc-800' : 'text-zinc-900'
                  }`}>
                    {notif.title}
                  </h3>
                  <span className="shrink-0 text-[11px] text-zinc-400 font-medium">
                    {notif.time}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${notif.read ? 'text-zinc-500' : 'text-zinc-700'}`}>
                  {notif.message}
                </p>
              </div>

              {/* Right Indicators & Actions */}
              <div className="flex items-center gap-2 shrink-0 self-center">
                {/* Unread Blue Dot */}
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[#2563eb] shadow-xs" title="Belum dibaca" />
                )}

                {/* Delete Button (visible on hover) */}
                <button
                  onClick={(e) => deleteNotification(e, notif.id)}
                  title="Hapus pemberitahuan"
                  className="p-1 text-zinc-300 hover:text-rose-500 rounded-lg hover:bg-zinc-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}

        {!loading && filteredNotifications.length === 0 && (
          <div className="p-12 text-center text-zinc-400">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
              <IconBell className="w-5 h-5" />
            </div>
            <p className="font-semibold text-zinc-800 text-xs sm:text-sm mb-0.5">Tidak Ada Notifikasi</p>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
              {searchQuery ? 'Tidak ada pemberitahuan yang cocok dengan kata kunci pencarian Anda.' : 'Semua pemberitahuan dan aktivitas terbaru Anda telah terbaca.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
