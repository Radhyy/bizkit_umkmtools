'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconSettings,
  IconUser,
  IconLock,
  IconShieldCheck,
  IconCreditCard,
  IconCpu,
  IconBrandWhatsapp,
  IconDatabase,
  IconBolt,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconDeviceFloppy,
  IconKey,
  IconServer
} from '@tabler/icons-react';

export default function AdminPengaturanPage() {
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string; role?: string } | null>(null);
  const [adminName, setAdminName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [systemData, setSystemData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isFlushingCache, setIsFlushingCache] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const raw = localStorage.getItem('user');
      let email = 'radiaakbarradia@gmail.com';
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
        setAdminName(parsed.name || 'Radhiyya');
        if (parsed.email) email = parsed.email;
      }

      const res = await fetch(`/api/admin/settings?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.admin) {
          setAdminName(data.admin.name || 'Radhiyya');
        }
        setSystemData(data.system);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update Nama Profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      showToast('error', 'Nama administrator tidak boleh kosong.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email || 'radiaakbarradia@gmail.com',
          name: adminName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || 'Profil administrator berhasil disimpan.');
        // Update localStorage
        if (currentUser) {
          const updated = { ...currentUser, name: adminName.trim() };
          localStorage.setItem('user', JSON.stringify(updated));
          setCurrentUser(updated);
        }
      } else {
        showToast('error', data.error || 'Gagal menyimpan profil.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Update Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showToast('error', 'Masukkan kata sandi lama Anda.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Konfirmasi kata sandi baru tidak sesuai.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email || 'radiaakbarradia@gmail.com',
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Kata sandi administrator berhasil diubah.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', data.error || 'Gagal mengubah kata sandi.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Flush Otak Cache
  const handleFlushCache = async () => {
    setIsFlushingCache(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flush_cache' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Otak cache berhasil dibersihkan.');
        fetchSettings();
      }
    } catch {
      showToast('error', 'Gagal membersihkan cache.');
    } finally {
      setIsFlushingCache(false);
    }
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1100px] mx-auto space-y-8 font-jakarta pb-20">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
            : 'bg-rose-600 text-white shadow-rose-600/20'
        }`}>
          {toast.type === 'success' ? <IconCheck className="w-4 h-4 shrink-0" /> : <IconAlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          Pengaturan Administrator & Sistem
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Kelola profil super admin, keamanan sandi akun, dan pantau integrasi server platform Bizkit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile & Security (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Profil Super Admin */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <IconUser className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Profil Administrator</h2>
                <p className="text-xs text-zinc-400">Identitas akun pengelola sistem platform</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Nama Administrator
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  placeholder="Nama Lengkap Admin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Email Akun (Permanen Super Admin)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={currentUser?.email || 'radiaakbarradia@gmail.com'}
                    disabled
                    className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 text-sm font-mono cursor-not-allowed"
                  />
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-xl shrink-0 uppercase tracking-wider">
                    Super Admin
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <IconDeviceFloppy className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil Admin'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Keamanan & Kata Sandi */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <IconLock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Keamanan & Kata Sandi</h2>
                <p className="text-xs text-zinc-400">Perbarui kata sandi untuk melindungi akses super admin</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  placeholder="Masukkan kata sandi lama"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Ulangi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    placeholder="Konfirmasi kata sandi"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <IconKey className="w-4 h-4" />
                  <span>{isSavingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Platform & Gateway Statuses (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
            Status Layanan Platform
          </div>

          {/* Card 1: Midtrans Payment Gateway */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <IconCreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">Midtrans Gateway</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Terkoneksi
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 space-y-1 mt-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="font-semibold text-zinc-800">
                  {systemData?.midtrans?.isProduction ? 'Production' : 'Sandbox (Testing)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Client Key:</span>
                <span className="font-mono text-zinc-700">
                  {systemData?.midtrans?.clientKeyPreview || 'Aktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Groq AI Load Balancer */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <IconCpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">Groq AI Load Balancer</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                5/5 Pool Sehat
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 space-y-1 mt-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
              <div className="flex justify-between">
                <span>Model AI:</span>
                <span className="font-semibold text-zinc-800">qwen/qwen3.8-27b</span>
              </div>
              <div className="flex justify-between">
                <span>Sistem:</span>
                <span className="font-semibold text-blue-600">Round-Robin & Failover</span>
              </div>
            </div>
          </div>

          {/* Card 3: WhatsApp Bot Baileys */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <IconBrandWhatsapp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">WhatsApp Bot Daemon</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Port 3001
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 space-y-1 mt-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
              <div className="flex justify-between">
                <span>Layanan:</span>
                <span className="font-semibold text-zinc-800">Baileys Gateway Multi-Device</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <Link href="/admin/whatsapp" className="text-blue-600 font-semibold hover:underline">
                  Buka Scanner Barcode WA →
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4: In-Memory Cache ("Otak Cache") */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <IconBolt className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">Otak Cache (RAM Server)</span>
              </div>
              <button
                onClick={handleFlushCache}
                disabled={isFlushingCache}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <IconRefresh className={`w-3 h-3 ${isFlushingCache ? 'animate-spin' : ''}`} />
                <span>Flush</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              In-memory cache aktif untuk menyajikan harga paket dan data cepat tanpa query PostgreSQL berulang.
            </p>
          </div>

          {/* Card 5: Database Neon PostgreSQL */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <IconDatabase className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">PostgreSQL Neon Cloud</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                SSL Aktif
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Database cloud terenkripsi penuh dan terhubung dengan connection pooling.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

