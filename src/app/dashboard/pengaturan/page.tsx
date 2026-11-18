'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  IconUpload,
  IconCheck,
  IconDeviceFloppy,
  IconBuildingStore,
  IconMail,
  IconPhone,
  IconMapPin,
  IconUser,
  IconShieldLock,
  IconX,
  IconKey,
  IconCrown,
  IconClock,
  IconSparkles,
  IconLock,
  IconArrowRight
} from '@tabler/icons-react';

export default function PengaturanPage() {
  const [currentUser, setCurrentUser] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(null);
  const [planInfo, setPlanInfo] = useState<{
    role: 'free' | 'trial' | 'premium' | 'admin';
    isTrialActive: boolean;
    daysLeft: number;
    trialEndsAt: string | null;
    isLocked: boolean;
  }>({
    role: 'free',
    isTrialActive: false,
    daysLeft: 0,
    trialEndsAt: null,
    isLocked: false
  });

  const [storeName, setStoreName] = useState('Toko Maju');
  const [businessCategory, setBusinessCategory] = useState('Kuliner / Makanan');
  const [businessEmail, setBusinessEmail] = useState('hello@tokomaju.com');
  const [phone, setPhone] = useState('0812-3456-7890');
  const [address, setAddress] = useState('Jl. Sudirman No. 123, Kelurahan Sukamaju, Kecamatan Maju Terus, Kota Jakarta Pusat, 10110');
  const [description, setDescription] = useState('Menyediakan berbagai kebutuhan pokok dan layanan katering berkualitas tinggi sejak 2010.');
  const [ownerName, setOwnerName] = useState('Radhiyya Alea');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUser(u);
        if (u.name) setOwnerName(u.name);
        if (u.email) setBusinessEmail(u.email);

        // Status awal
        setPlanInfo({
          role: u.role || 'free',
          isTrialActive: !!u.isTrialActive,
          daysLeft: u.daysLeft || 0,
          trialEndsAt: u.trialEndsAt || null,
          isLocked: !!u.isLocked
        });

        // Ambil status akurat dari server database
        if (u.id || u.email) {
          fetch(`/api/auth/check-status?userId=${encodeURIComponent(u.id || '')}&email=${encodeURIComponent(u.email || '')}`)
            .then(res => res.json())
            .then(data => {
              if (data && !data.error) {
                setPlanInfo({
                  role: data.role || 'free',
                  isTrialActive: !!data.isTrialActive,
                  daysLeft: data.daysLeft || 0,
                  trialEndsAt: data.trialEndsAt || null,
                  isLocked: !!data.isLocked
                });
                if (data.role && data.role !== u.role) {
                  const updated = { ...u, role: data.role, isTrialActive: data.isTrialActive, daysLeft: data.daysLeft };
                  localStorage.setItem('user', JSON.stringify(updated));
                }
              }
            })
            .catch(() => {});
        }

        if (u.id) {
          fetch(`/api/onboarding?userId=${u.id}`)
            .then(res => res.json())
            .then(data => {
              if (data?.profile) {
                if (data.profile.namaUsaha) setStoreName(data.profile.namaUsaha);
                if (data.profile.kategoriBisnis) setBusinessCategory(data.profile.kategoriBisnis);
                if (data.profile.kotaLokasi) setAddress(data.profile.kotaLokasi);
                if (data.profile.deskripsiBisnis) setDescription(data.profile.deskripsiBisnis);
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      if (currentUser?.id) {
        await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            namaUsaha: storeName,
            kategoriBisnis: businessCategory,
            deskripsiBisnis: description,
            targetAudiens: 'Semua Kalangan / Publik',
            platformFokus: 'Instagram & TikTok',
            gayaPromosi: 'Review Jujur & Cicip Rasa',
            kotaLokasi: address,
          }),
        });
      }
      setToastMessage('Pengaturan profil toko & akun berhasil disimpan!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setToastMessage('Konfirmasi kata sandi baru tidak cocok.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsPasswordModalOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToastMessage('Kata sandi akun Anda berhasil diperbarui!');
    setTimeout(() => setToastMessage(null), 3000);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Pengaturan Akun & Toko</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola identitas usaha, kontak operasional, dan keamanan akun bisnis Anda.
          </p>
        </div>

        {/* Action Header Button */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <IconDeviceFloppy className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full-Width Clean Form Layout (Sidebar Menu Lama Telah Dihapus) */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Profil Toko & Brand */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6">
          <div className="mb-5 pb-4 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900">Profil & Logo Toko</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Informasi ini akan dicetak pada faktur transaksi dan identitas etalase publik Anda</p>
          </div>

          <div className="space-y-5">
            {/* Logo Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs border border-zinc-200/80">
                TM
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold text-zinc-900">Logo Usaha</div>
                <p className="text-[11px] text-zinc-400 max-w-md">
                  Gunakan gambar berasio 1:1 format JPG, PNG, atau SVG. Ukuran maksimal 2MB.
                </p>
                <button 
                  type="button"
                  onClick={() => {
                    setToastMessage('Fitur unggah logo siap digunakan.');
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <IconUpload className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Unggah Logo Baru</span>
                </button>
              </div>
            </div>

            {/* Inputs: Nama Toko & Kategori Bisnis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Nama Toko / Brand
                </label>
                <input 
                  type="text" 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Kategori Bisnis
                </label>
                <select 
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Kuliner / Makanan">Kuliner / Makanan</option>
                  <option value="Pakaian / Fashion">Pakaian / Fashion</option>
                  <option value="Retail & Sembako">Retail & Sembako</option>
                  <option value="Jasa & Servis">Jasa & Servis</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Deskripsi Singkat */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Deskripsi Singkat Toko
              </label>
              <textarea 
                rows={2} 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all resize-none shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Kontak & Alamat Operasional */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6">
          <div className="mb-5 pb-4 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900">Kontak & Alamat Operasional</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Informasi komunikasi yang tercantum pada kontak bisnis dan pengiriman</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Email Bisnis
                </label>
                <div className="relative">
                  <IconMail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email" 
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Nomor WhatsApp / Telepon
                </label>
                <div className="relative">
                  <IconPhone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Alamat Lengkap Toko / Usaha
              </label>
              <textarea 
                rows={3} 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all resize-none shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Keamanan & Akun Pengguna */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6">
          <div className="mb-5 pb-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Akun & Keamanan</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Kelola data profil pemilik usaha dan kata sandi akses akun</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Nama Pemilik Usaha
              </label>
              <div className="relative">
                <IconUser className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end pt-1">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Kata Sandi Akun
              </label>
              <button 
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-zinc-200/90 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <IconShieldLock className="w-4 h-4 text-zinc-400" />
                  <span>Ubah Kata Sandi</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-normal">Ganti Password</span>
              </button>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Status Akun: Aktif & Terverifikasi</span>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all border-b-4 border-[#1e40af] active:border-b-0 active:translate-y-1 cursor-pointer disabled:opacity-60"
            >
              <IconDeviceFloppy className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>

        {/* Card 4: Paket & Status Langganan (Diletakkan di bagian paling bawah) */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-zinc-900">Paket & Status Langganan</h2>
                {planInfo.role === 'premium' || planInfo.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <IconCrown className="w-3.5 h-3.5 text-amber-600" />
                    <span>PREMIUM</span>
                  </span>
                ) : planInfo.role === 'trial' && planInfo.isTrialActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <IconClock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TRIAL AKTIF</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                    <IconLock className="w-3 h-3 text-zinc-500" />
                    <span>FREE PLAN</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Informasi tingkatan paket akun Bizkit dan aksesibilitas fitur operasional toko Anda
              </p>
            </div>

            {/* Quick Action */}
            <div>
              {planInfo.role === 'premium' || planInfo.role === 'admin' ? (
                <Link
                  href="/harga"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200/90 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs"
                >
                  <IconSparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rincian Fitur Paket</span>
                </Link>
              ) : (
                <Link
                  href="/checkout"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <IconCrown className="w-3.5 h-3.5" />
                  <span>Upgrade ke Premium</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Banner Content */}
          <div className="pt-5">
            {planInfo.role === 'premium' || planInfo.role === 'admin' ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/40 border border-blue-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-zinc-900">Akses Penuh Tanpa Batas Aktif</span>
                  </div>
                  <p className="text-xs text-zinc-600 max-w-xl leading-relaxed">
                    Akun Anda memiliki lisensi <strong>Bizkit Premium Plan</strong>. Seluruh dashboard keuangan realtime, asisten bisnis AI 24/7, AI content builder, dan fitur matchmaking influencer dapat Anda gunakan sepuasnya tanpa batas.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-white/90 border border-blue-200/70 text-[11px] font-semibold text-blue-700 shadow-2xs flex items-center gap-1">
                    <IconCheck className="w-3.5 h-3.5 text-blue-600" />
                    Unlimited Kas & Laporan
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/90 border border-blue-200/70 text-[11px] font-semibold text-indigo-700 shadow-2xs flex items-center gap-1">
                    <IconCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Asisten AI & Influencer
                  </span>
                </div>
              </div>
            ) : planInfo.role === 'trial' && planInfo.isTrialActive ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-blue-50/40 border border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-950">
                      Masa Percobaan Trial Sedang Berjalan: Tersisa {planInfo.daysLeft} Hari Lagi
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 max-w-xl leading-relaxed">
                    Anda sedang menikmati uji coba gratis fitur Bizkit.
                    {planInfo.trialEndsAt && (
                      <> Masa trial berlaku sampai tanggal <strong>{new Date(planInfo.trialEndsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</>
                    )}
                    {' '}Tingkatkan ke paket Premium sebelum masa trial berakhir agar pencatatan usaha Anda tidak terkunci.
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    href="/checkout"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <span>Ambil Premium Sekarang</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    <span className="text-xs font-bold text-zinc-800">Paket Free (Akses Fitur Terkunci)</span>
                  </div>
                  <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
                    Akun Anda saat ini berada pada paket dasar gratis. Fitur dasbor keuangan, laporan bisnis, dan asisten AI memerlukan paket Premium aktif untuk dapat digunakan.
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    href="/checkout"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <span>Mulai Berlangganan (Rp 49.000/bln)</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

      </form>

      {/* ======================================================== */}
      {/* MODAL UBAH KATA SANDI                                    */}
      {/* ======================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-jakarta">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 transform transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-zinc-100 text-zinc-800 rounded-lg">
                  <IconKey className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 leading-tight">Ubah Kata Sandi</h3>
                  <p className="text-[11px] text-zinc-400">Pastikan gunakan kombinasi sandi yang aman</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Kata Sandi Lama
                </label>
                <input 
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input 
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
