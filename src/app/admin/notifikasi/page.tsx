'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconBell,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconCreditCard,
  IconUsers,
  IconBrandWhatsapp,
  IconServer,
  IconArrowRight,
  IconChecklist,
  IconInfoCircle,
  IconClock
} from '@tabler/icons-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'pembayaran' | 'pengguna' | 'sistem';
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  link: string | null;
  createdAt: string;
}

export default function AdminNotifikasiPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<'all' | 'pembayaran' | 'pengguna' | 'sistem'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('Semua notifikasi berhasil ditandai telah dibaca.');
    } catch (e) {
      showToast('Gagal menandai notifikasi.');
    }
  };

  const handleMarkOneRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(() => {});
  };

  const filtered = notifications.filter(n => {
    if (filterCategory === 'all') return true;
    return n.category === filterCategory;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Baru saja';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} menit yang lalu`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} jam yang lalu`;
      const diffDays = Math.floor(diffHour / 24);
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Beberapa waktu lalu';
    }
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1100px] mx-auto space-y-6 font-jakarta pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl bg-slate-900 text-white border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <IconCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Notifikasi Sistem & Admin
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pusat pemantauan aktivitas pembayaran, pendaftaran UMKM, dan operasional platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:text-zinc-900 text-xs font-semibold shadow-2xs hover:bg-zinc-50 transition-all cursor-pointer"
            >
              <IconChecklist className="w-4 h-4 text-blue-600" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
          >
            <IconRefresh className={`w-3.5 h-3.5 text-zinc-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterCategory === 'all'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          Semua ({notifications.length})
        </button>

        <button
          onClick={() => setFilterCategory('pembayaran')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterCategory === 'pembayaran'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <IconCreditCard className="w-3.5 h-3.5" />
          Pembayaran ({notifications.filter(n => n.category === 'pembayaran').length})
        </button>

        <button
          onClick={() => setFilterCategory('pengguna')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterCategory === 'pengguna'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <IconUsers className="w-3.5 h-3.5" />
          Pengguna ({notifications.filter(n => n.category === 'pengguna').length})
        </button>

        <button
          onClick={() => setFilterCategory('sistem')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterCategory === 'sistem'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <IconServer className="w-3.5 h-3.5" />
          Sistem & WhatsApp ({notifications.filter(n => n.category === 'sistem').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-xs text-zinc-400">
            <IconRefresh className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
            Memuat daftar notifikasi sistem...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-xs text-zinc-400">
            <IconBell className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
            Tidak ada notifikasi dalam kategori ini.
          </div>
        ) : (
          filtered.map((item) => {
            const isPayment = item.category === 'pembayaran';
            const isUser = item.category === 'pengguna';
            const isSystem = item.category === 'sistem';

            return (
              <div
                key={item.id}
                onClick={() => !item.read && handleMarkOneRead(item.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  item.read 
                    ? 'bg-white border-zinc-200/80 hover:border-zinc-300' 
                    : 'bg-blue-50/30 border-blue-200 shadow-xs hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Icon Category Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isPayment 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : isUser 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isPayment && <IconCreditCard className="w-5 h-5" />}
                      {isUser && <IconUsers className="w-5 h-5" />}
                      {isSystem && <IconBrandWhatsapp className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-zinc-900">
                          {item.title}
                        </h3>

                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        )}

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isPayment 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : isUser 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.category}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed max-w-3xl">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2.5">
                        <span className="flex items-center gap-1 font-medium">
                          <IconClock className="w-3.5 h-3.5" />
                          {getRelativeTime(item.createdAt)}
                        </span>

                        {item.link && (
                          <>
                            <span>&bull;</span>
                            <Link
                              href={item.link}
                              className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                            >
                              Lihat Rincian <IconArrowRight className="w-3 h-3" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {!item.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkOneRead(item.id);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
                      title="Tandai dibaca"
                    >
                      <IconCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

