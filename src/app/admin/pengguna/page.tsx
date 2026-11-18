'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  IconUsers, 
  IconUserPlus, 
  IconClock, 
  IconLock, 
  IconLockOpen, 
  IconCrown, 
  IconSparkles, 
  IconCheck, 
  IconX, 
  IconSearch, 
  IconTrash, 
  IconRefresh, 
  IconDots, 
  IconAlertCircle, 
  IconBuildingStore, 
  IconShieldCheck,
  IconArrowUpRight,
  IconArrowDownRight,
  IconPlus
} from '@tabler/icons-react';

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: 'free' | 'trial' | 'premium' | 'admin';
  isVerified: boolean;
  isLocked: boolean;
  trialEndsAt: string | null;
  trialGrantedDays: number;
  trialStatus: 'none' | 'active' | 'expired';
  daysLeft: number;
  hasDashboardAccess: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  namaUsaha: string | null;
  kategoriBisnis: string | null;
  kotaLokasi: string | null;
}

interface Stats {
  total: number;
  premium: number;
  trialActive: number;
  free: number;
  admin: number;
  lockedOrExpired: number;
}

export default function PenggunaAdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    premium: 0,
    trialActive: 0,
    free: 0,
    admin: 0,
    lockedOrExpired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'semua' | 'trial' | 'premium' | 'free' | 'locked'>('semua');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form states for adding user
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'free' | 'trial' | 'premium' | 'admin'>('trial');
  const [formTrialDays, setFormTrialDays] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for granting trial
  const [trialDurationDays, setTrialDurationDays] = useState('7');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ type, text });
    setTimeout(() => {
      setNotificationMsg(null);
    }, 4000);
  };

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
        if (data.stats) setStats(data.stats);
      } else {
        showToast(data.error || 'Gagal memuat data pengguna', 'error');
      }
    } catch {
      showToast('Koneksi server gagal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.namaUsaha && user.namaUsaha.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.kotaLokasi && user.kotaLokasi.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterTab === 'trial') return user.trialStatus === 'active';
      if (filterTab === 'premium') return user.role === 'premium';
      if (filterTab === 'free') return user.role === 'free';
      if (filterTab === 'locked') return user.isLocked || user.trialStatus === 'expired';

      return true;
    });
  }, [users, searchQuery, filterTab]);

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim() || !formPassword.trim()) {
      showToast('Email dan password wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          role: formRole,
          trialDays: formRole === 'trial' ? parseInt(formTrialDays, 10) : 0,
          isVerified: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Pengguna ${data.user.email} berhasil ditambahkan!`);
        setIsAddModalOpen(false);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormRole('trial');
        setFormTrialDays('7');
        fetchUsers();
      } else {
        showToast(data.error || 'Gagal menambah pengguna', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan sistem', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Give/Extend Trial
  const handleGrantTrial = async () => {
    if (!selectedUser) return;
    const days = parseInt(trialDurationDays, 10);
    if (isNaN(days) || days <= 0) {
      showToast('Durasi hari trial harus valid', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'give_trial',
          userId: selectedUser.id,
          days: days
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Masa trial ${days} hari berhasil diberikan untuk ${selectedUser.email}!`);
        setIsTrialModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showToast(data.error || 'Gagal memberikan trial', 'error');
      }
    } catch {
      showToast('Koneksi server gagal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Lock
  const handleToggleLock = async (user: UserItem) => {
    const targetLockState = !user.isLocked;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_lock',
          userId: user.id,
          isLocked: targetLockState
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(targetLockState 
          ? `Akses dashboard untuk ${user.email} berhasil dikunci.` 
          : `Akses dashboard untuk ${user.email} berhasil dibuka kembali.`
        );
        fetchUsers();
      } else {
        showToast(data.error || 'Gagal mengubah status kunci', 'error');
      }
    } catch {
      showToast('Koneksi server gagal', 'error');
    }
  };

  // Handle Change Role
  const handleChangeRole = async (user: UserItem, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_role',
          userId: user.id,
          newRole: newRole,
          trialDays: newRole === 'trial' ? 7 : 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Role ${user.email} diubah menjadi ${newRole.toUpperCase()}.`);
        fetchUsers();
      } else {
        showToast(data.error || 'Gagal mengubah role', 'error');
      }
    } catch {
      showToast('Koneksi server gagal', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(selectedUser.id)}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Pengguna ${selectedUser.email} berhasil dihapus.`);
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showToast(data.error || 'Gagal menghapus pengguna', 'error');
      }
    } catch {
      showToast('Koneksi server gagal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-semibold transition-all ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notificationMsg.type === 'success' ? (
            <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <IconAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="ml-1 text-zinc-400 hover:text-zinc-600">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola akun, berikan akses trial, atur status paket, dan pantau pengguna platform secara realtime.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Refresh Data */}
          <button 
            onClick={fetchUsers}
            title="Sinkronkan data"
            disabled={isLoading}
            className="p-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
          </button>

          {/* Tambah Pengguna Baru (Black rounded-xl matching screenshot) */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl font-semibold shadow-xs transition-all text-xs"
          >
            <IconPlus className="w-3.5 h-3.5" stroke={2.5} />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Unified 4-Metric Metric Cards (Matching Overview strip styling) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
          
          {/* Total Pengguna */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Total Pengguna</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded">
                <IconUsers className="w-3 h-3" /> Aktif
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.total}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Semua akun di database</div>
            </div>
          </div>

          {/* Pelanggan Premium */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Pelanggan Premium</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded">
                <IconCrown className="w-3 h-3" /> Berbayar
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.premium}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Akses penuh permanen</div>
            </div>
          </div>

          {/* Trial Berjalan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Trial Berjalan</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                <IconClock className="w-3 h-3" /> Uji Coba
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.trialActive}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Sedang masa percobaan</div>
            </div>
          </div>

          {/* Terkunci / Expired */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Terkunci / Expired</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-500 bg-rose-50/80 px-1.5 py-0.5 rounded">
                <IconLock className="w-3 h-3" /> Terkunci
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.lockedOrExpired}</div>
              <div className="text-[11px] text-rose-500 font-medium mt-1">Akses dashboard dibatasi</div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Table Card (Matching Overview exact table container) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        
        {/* Table Filters & Search (Exact segmented button styling) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-zinc-100">
          <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-xl text-xs font-medium text-zinc-500 w-fit overflow-x-auto">
            <button
              onClick={() => setFilterTab('semua')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterTab === 'semua' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setFilterTab('trial')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterTab === 'trial' ? 'bg-white text-emerald-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Trial Aktif ({stats.trialActive})
            </button>
            <button
              onClick={() => setFilterTab('premium')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterTab === 'premium' ? 'bg-white text-amber-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Premium ({stats.premium})
            </button>
            <button
              onClick={() => setFilterTab('free')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterTab === 'free' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Free ({stats.free})
            </button>
            <button
              onClick={() => setFilterTab('locked')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterTab === 'locked' ? 'bg-white text-rose-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Terkunci ({stats.lockedOrExpired})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <IconSearch className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Cari user, email, usaha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f4f5] border border-transparent rounded-xl focus:outline-none focus:border-zinc-300 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* User Table (Clean and elegant) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/60">
              <tr>
                <th className="px-5 py-3 font-normal">Pengguna</th>
                <th className="px-4 py-3 font-normal">Role / Paket</th>
                <th className="px-4 py-3 font-normal">Masa Trial</th>
                <th className="px-4 py-3 font-normal">Akses Dashboard</th>
                <th className="px-4 py-3 font-normal">Terdaftar</th>
                <th className="px-5 py-3 font-normal text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                    <IconRefresh className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data pengguna dari Neon DB...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                    Tidak ada pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const initialLetter = user.name 
                    ? user.name.charAt(0).toUpperCase() 
                    : user.email.charAt(0).toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Pengguna & Profil Usaha */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            user.role === 'admin' 
                              ? 'bg-blue-100 text-blue-700' 
                              : user.role === 'premium' 
                              ? 'bg-amber-100 text-amber-700' 
                              : user.trialStatus === 'active' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {initialLetter}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-zinc-900 leading-tight">
                                {user.name || 'Pengguna Tanpa Nama'}
                              </p>
                              {user.isSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{user.email}</p>
                            {user.namaUsaha && (
                              <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                                <IconBuildingStore className="w-3 h-3 text-zinc-400" />
                                {user.namaUsaha} {user.kotaLokasi ? `(${user.kotaLokasi})` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role / Paket */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          user.role === 'admin' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : user.role === 'premium' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : user.role === 'trial' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Masa Trial */}
                      <td className="px-4 py-3.5">
                        {user.role === 'admin' || user.role === 'premium' ? (
                          <span className="text-zinc-500 font-medium">Permanen</span>
                        ) : user.trialStatus === 'active' ? (
                          <div>
                            <span className="font-semibold text-emerald-600 inline-flex items-center gap-1">
                              <IconClock className="w-3 h-3" /> {user.daysLeft} Hari Lagi
                            </span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              s.d. {new Date(user.trialEndsAt!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ) : user.trialStatus === 'expired' ? (
                          <div>
                            <span className="font-semibold text-rose-500">Expired</span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              Habis {new Date(user.trialEndsAt!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      {/* Akses Dashboard */}
                      <td className="px-4 py-3.5">
                        {user.isLocked ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-rose-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Dikunci Manual
                          </span>
                        ) : user.hasDashboardAccess ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Akses Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span> Terkunci (Trial/Free)
                          </span>
                        )}
                      </td>

                      {/* Terdaftar */}
                      <td className="px-4 py-3.5 text-zinc-500 font-mono text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Aksi Super Admin */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Berikan Trial (Hanya untuk pengguna Free atau yang sedang Trial, tidak untuk Super Admin & Premium) */}
                          {user.role !== 'admin' && user.role !== 'premium' && !user.isSuperAdmin && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setTrialDurationDays('7');
                                setIsTrialModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors"
                              title="Beri Masa Trial"
                            >
                              <IconClock className="w-3.5 h-3.5" />
                              <span>Beri Trial</span>
                            </button>
                          )}

                          {/* Tombol Kunci / Buka */}
                          {!user.isSuperAdmin && (
                            <button
                              onClick={() => handleToggleLock(user)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                user.isLocked
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                  : 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50 border-zinc-200/80'
                              }`}
                              title={user.isLocked ? "Buka Kunci Akses" : "Kunci Akses Dashboard"}
                            >
                              {user.isLocked ? <IconLockOpen className="w-3.5 h-3.5" /> : <IconLock className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Role Selector */}
                          {!user.isSuperAdmin && (
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeRole(user, e.target.value)}
                              className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                              title="Ubah Role"
                            >
                              <option value="trial">Trial</option>
                              <option value="premium">Premium</option>
                              <option value="free">Free</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}

                          {/* Delete Button */}
                          {!user.isSuperAdmin && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Pengguna"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== MODAL: TAMBAH PENGGUNA ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <IconUserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-900 text-sm">Tambah Pengguna Baru</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Misal: Budi Santoso"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f4f4f5] border border-transparent rounded-xl text-xs focus:bg-white focus:outline-none focus:border-zinc-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Email <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f4f4f5] border border-transparent rounded-xl text-xs focus:bg-white focus:outline-none focus:border-zinc-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Password <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f4f4f5] border border-transparent rounded-xl text-xs focus:bg-white focus:outline-none focus:border-zinc-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Role / Paket</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#f4f4f5] border border-transparent rounded-xl text-xs focus:bg-white focus:outline-none focus:border-zinc-300 cursor-pointer"
                >
                  <option value="trial">Trial (Akses uji coba berbatas hari)</option>
                  <option value="premium">Premium (Akses penuh tanpa batas)</option>
                  <option value="free">Free (Akses dashboard terkunci)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {formRole === 'trial' && (
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-medium text-amber-900 mb-2">
                    <span>Durasi Hari Trial</span>
                    <span className="font-bold">{formTrialDays} Hari</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {['3', '7', '14', '30'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormTrialDays(d)}
                        className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                          formTrialDays === d 
                            ? 'bg-amber-600 text-white border-amber-600' 
                            : 'bg-white text-zinc-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        {d} Hari
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formTrialDays}
                    onChange={(e) => setFormTrialDays(e.target.value)}
                    placeholder="Custom durasi hari..."
                    className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: BERIKAN TRIAL ===================== */}
      {isTrialModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <IconClock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-900 text-sm">Berikan Akses Trial</h3>
              </div>
              <button 
                onClick={() => setIsTrialModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div className="p-3 bg-[#f4f4f5] rounded-xl text-xs">
                <div className="text-zinc-400">Pengguna Target:</div>
                <div className="font-semibold text-zinc-900 mt-0.5">{selectedUser.name || 'Tanpa Nama'}</div>
                <div className="text-zinc-500 font-mono text-[11px]">{selectedUser.email}</div>
                {selectedUser.trialStatus === 'active' && (
                  <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 flex items-center justify-between">
                    <span>Trial aktif saat ini:</span>
                    <span>{selectedUser.daysLeft} Hari Lagi</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-2">
                  Pilih Durasi Trial:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {[
                    { d: '3', label: '3 Hari' },
                    { d: '7', label: '7 Hari' },
                    { d: '14', label: '14 Hari' },
                    { d: '30', label: '30 Hari' },
                  ].map(item => (
                    <button
                      key={item.d}
                      type="button"
                      onClick={() => setTrialDurationDays(item.d)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        trialDurationDays === item.d
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Atau masukkan jumlah hari custom:</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={trialDurationDays}
                    onChange={(e) => setTrialDurationDays(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#f4f4f5] border border-transparent rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-zinc-300"
                    placeholder="Contoh: 10"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-700 leading-relaxed">
                ℹ️ Setelah masa trial habis, akses dashboard pengguna akan otomatis terkunci.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsTrialModalOpen(false)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGrantTrial}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Mengaktifkan...' : `Aktifkan ${trialDurationDays} Hari`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: KONFIRMASI HAPUS ===================== */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <IconTrash className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-900 text-sm mb-1">Hapus Akun Pengguna?</h3>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Anda akan menghapus pengguna <strong>{selectedUser.email}</strong>. Seluruh riwayat transaksi dan profil usaha akan terhapus permanen.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleDeleteUser}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
