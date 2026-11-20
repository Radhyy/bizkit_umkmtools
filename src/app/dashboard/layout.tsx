'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconSearch,
  IconGridDots,
  IconFlame,
  IconChartBar,
  IconArrowsDoubleNeSw,
  IconUsers,
  IconBox,
  IconTag,
  IconTrendingUp,
  IconBell,
  IconSettings,
  IconHelpCircle,
  IconWorld,
  IconArrowUpRight,
  IconDots,
  IconLayoutSidebar,
  IconSparkles,
  IconLock,
  IconBrain,
  IconReceipt2,
  IconLayout,
  IconHome,
  IconX,
  IconClock,
  IconShieldLock,
  IconMenu2,
} from '@tabler/icons-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string; role?: string; daysLeft?: number; trialEndsAt?: string } | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [lockReason, setLockReason] = useState<'free_plan' | 'trial_expired' | 'locked' | null>(null);
  const [lockMessage, setLockMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  // Ambil unread notifikasi realtime
  const fetchUnreadCount = (userId: string) => {
    fetch(`/api/notifikasi?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.unreadCount === 'number') {
          setUnreadNotifCount(data.unreadCount);
        }
      })
      .catch(() => {});
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Role & Trial validation dari database realtime
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(raw);
      
      // Ambil nama usaha dari localStorage jika ada
      const storedBp = localStorage.getItem("businessProfile");
      if (storedBp) {
        try {
          const bp = JSON.parse(storedBp);
          if (bp?.namaUsaha) setBusinessName(bp.namaUsaha);
        } catch {}
      }

      // Validasi status akun dan trial ke database
      fetch(`/api/auth/check-status?userId=${encodeURIComponent(u.id || '')}&email=${encodeURIComponent(u.email || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data.authorized) {
            setCurrentUser({ 
              ...u, 
              role: data.role, 
              daysLeft: data.daysLeft, 
              trialEndsAt: data.trialEndsAt 
            });
            if (data.namaUsaha || data.user?.namaUsaha) {
              setBusinessName(data.namaUsaha || data.user?.namaUsaha);
            }
            setIsAuthorized(true);
            setLockReason(null);
            if (u.id) {
              fetchUnreadCount(u.id);
            }
          } else {
            setIsAuthorized(false);
            setLockReason(data.reason || 'free_plan');
            setLockMessage(data.message || '');
          }
        })
        .catch(() => {
          // Fallback lokal jika jaringan offline
          const email = u.email?.toLowerCase();
          const role = email === 'radiaakbarradia@gmail.com' ? 'admin' : (email === 'raaakb87@gmail.com' ? (u.role || 'premium') : (u.role || 'free'));
          if (role === 'free') {
            setIsAuthorized(false);
            setLockReason('free_plan');
          } else {
            setCurrentUser({ ...u, role });
            setIsAuthorized(true);
          }
        });

      // Sinkronisasi data profil bisnis (namaUsaha)
      if (u.id) {
        fetch(`/api/onboarding?userId=${encodeURIComponent(u.id)}`)
          .then(res => res.json())
          .then(data => {
            if (data?.profile?.namaUsaha) {
              setBusinessName(data.profile.namaUsaha);
            }
            if (data?.profile?.logoUrl) {
              setLogoUrl(data.profile.logoUrl);
            }
          })
          .catch(() => {});
      }
    } catch {
      router.push("/login");
    }
  }, [router, pathname]);

  // Polling notifikasi berkala setiap 12 detik agar realtime
  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) return;
    const interval = setInterval(() => {
      fetchUnreadCount(uid);
    }, 12000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA] text-slate-500 text-sm font-jakarta">
        Memverifikasi paket akun...
      </div>
    );
  }

  // Jika Akses Dashboard Dikunci (Free Plan, Trial Habis, atau Dikunci Admin)
  if (isAuthorized === false) {
    if (lockReason === 'trial_expired') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-jakarta">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IconClock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Masa Trial Telah Berakhir</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Masa percobaan gratis (trial) untuk akun Anda telah selesai. Akses dashboard Anda otomatis dikunci oleh sistem. Silakan upgrade ke paket Premium atau hubungi Super Administrator untuk memperpanjang trial.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link 
                href="/#harga"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <IconSparkles className="w-4 h-4" /> Upgrade ke Paket Premium
              </Link>
              <Link 
                href="/#kontak"
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                Hubungi Administrator
              </Link>
              <Link 
                href="/"
                className="w-full py-2.5 px-4 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (lockReason === 'locked') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-jakarta">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <IconLock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Dashboard Dikunci</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {lockMessage || 'Akses dashboard akun Anda dinonaktifkan sementara oleh Super Administrator. Hubungi administrator untuk informasi lebih lanjut.'}
            </p>
            <div className="flex flex-col gap-2.5">
              <Link 
                href="/#kontak"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Hubungi Super Administrator
              </Link>
              <Link 
                href="/"
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Default: Free Plan
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-jakarta">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IconLock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Khusus Pelanggan Paket</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Akun Anda saat ini menggunakan <strong>Free Plan</strong>. Dashboard dan tools manajemen UMKM hanya dapat diakses melalui masa trial atau setelah berlangganan paket kami.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link 
              href="/#harga"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
            >
              <IconSparkles className="w-4 h-4" /> Langganan Paket Sekarang
            </Link>
            <Link 
              href="/"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Navigation Items
  const primaryNavItems = [
    { href: '/dashboard', icon: IconGridDots, label: 'Overview', shortLabel: 'Overview' },
    { href: '/dashboard/keuangan', icon: IconFlame, label: 'Keuangan & Kas', shortLabel: 'Keuangan' },
    { href: '/dashboard/laporan', icon: IconChartBar, label: 'Laporan Bisnis', shortLabel: 'Laporan' },
    { href: '/dashboard/ai', icon: IconTrendingUp, label: 'Insight Tren', shortLabel: 'Insight' },
    { href: '/dashboard/asisten', icon: IconBrain, label: 'Asisten AI', shortLabel: 'Asisten AI' },
  ];

  const analyzeNavItems = [
    { href: '/dashboard/influencer', icon: IconUsers, label: 'Info Influencer' },
    { href: '/dashboard/page-builder', icon: IconLayout, label: 'AI Page Builder' },
    { href: '/dashboard/export', icon: IconTag, label: 'Export Data' },
  ];

  const filterItems = <T extends { label: string }>(items: T[]): T[] => {
    if (!searchQuery.trim()) return items;
    return items.filter(it => it.label.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const filteredPrimary = filterItems(primaryNavItems);
  const filteredAnalyze = filterItems(analyzeNavItems);

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#18181b] font-jakarta overflow-hidden">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Image 
            src="/PP-BizKit.png" 
            alt="Bizkit Logo" 
            width={32} 
            height={32} 
            className="w-8 h-8 object-cover rounded-[10px] shadow-sm shrink-0" 
            priority
          />
          <span className="text-xl font-bold text-slate-900 tracking-tight lowercase">
            bizkit
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'lg:w-[70px] px-2.5 pt-4' : 'w-[250px] px-3 pt-5'} bg-white border-r border-zinc-200/70 flex flex-col pb-4 shrink-0 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Top Header: Logo + Collapse Icon */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 mb-4">
            <Link href="/dashboard" className="p-1 rounded-xl hover:bg-zinc-100 transition-colors" title="Bizkit Dashboard">
              <Image 
                src="/PP-BizKit.png" 
                alt="Bizkit Logo" 
                width={34} 
                height={34} 
                className="w-[34px] h-[34px] object-cover rounded-[10px] shadow-2xs shrink-0 transition-transform hover:scale-105" 
                priority
              />
            </Link>
            <button 
              onClick={() => setIsCollapsed(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Buka Sidebar"
            >
              <IconLayoutSidebar className="w-[18px] h-[18px]" stroke={1.75} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2 mb-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <Image 
                src="/PP-BizKit.png" 
                alt="Bizkit Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8 object-cover rounded-[10px] shadow-sm shrink-0 transition-transform group-hover:scale-105" 
                priority
              />
              <span className="text-[22px] font-semibold text-slate-900 tracking-tight translate-y-[1px] leading-none" style={{ fontFamily: "'Sparling Demo', sans-serif" }}>
                Bizkit
              </span>
            </Link>

            {/* Toggle Sidebar Width (Desktop) / Close (Mobile) */}
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(false);
                } else {
                  setIsCollapsed(true);
                }
              }}
              className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Perkecil Sidebar"
            >
              <IconLayoutSidebar className="w-[18px] h-[18px]" stroke={1.75} />
            </button>
          </div>
        )}

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="mb-4">
            <div className="relative flex items-center bg-[#f4f4f5] rounded-2xl px-3 py-2 border border-transparent focus-within:border-zinc-300 focus-within:bg-white transition-all">
              <IconSearch className="w-4 h-4 text-zinc-400 shrink-0 mr-2" stroke={1.75} />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
              />
              <span className="text-[10px] font-semibold text-zinc-400 bg-white border border-zinc-200/80 px-1.5 py-0.5 rounded-md shadow-2xs shrink-0 select-none">
                ⌘K
              </span>
            </div>
          </div>
        )}

        {/* Trial Countdown Alert for Active Trial Users */}
        {!isCollapsed && currentUser?.role === 'trial' && typeof currentUser.daysLeft === 'number' && (
          <div className="mb-3 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-1.5 text-amber-900">
              <IconClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-[11px] font-semibold">Masa Trial</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
              {currentUser.daysLeft} Hari Lagi
            </span>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar -mx-1 px-1">
          {/* Primary Nav List */}
          {filteredPrimary.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <NavItem 
                key={item.href}
                href={item.href}
                icon={<Icon className="w-[18px] h-[18px]" stroke={isActive ? 2 : 1.75} />}
                label={item.label}
                active={isActive}
                collapsed={isCollapsed}
              />
            );
          })}

          {/* Group 2: Analyze / Pemasaran */}
          {(filteredAnalyze.length > 0 || !searchQuery) && (
            <div className="pt-2">
              {!isCollapsed ? (
                <p className="px-3 py-1.5 text-[11px] font-normal text-zinc-400 tracking-wide">
                  Analyze
                </p>
              ) : (
                <div className="w-6 h-px bg-zinc-200/80 mx-auto my-2" />
              )}
              {filteredAnalyze.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <NavItem 
                    key={item.href}
                    href={item.href}
                    icon={<Icon className="w-[18px] h-[18px]" stroke={isActive ? 2 : 1.75} />}
                    label={item.label}
                    active={isActive}
                    collapsed={isCollapsed}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className={`pt-2 mt-auto border-t border-zinc-100 flex flex-col ${isCollapsed ? 'items-center gap-1' : 'gap-0.5'}`}>
          {/* Notifications */}
          <Link
            href="/dashboard/notifikasi"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Notifications"
            className={`group flex items-center transition-all ${
              isCollapsed
                ? `relative w-10 h-10 rounded-xl justify-center mx-auto ${
                    pathname === '/dashboard/notifikasi'
                      ? 'bg-[#18181b] text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                : `gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium ${
                    pathname === '/dashboard/notifikasi'
                      ? 'bg-[#18181b] text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`
            }`}
          >
            <IconBell 
              className={`w-[18px] h-[18px] shrink-0 ${
                pathname === '/dashboard/notifikasi' 
                  ? 'text-white' 
                  : isCollapsed 
                    ? 'text-zinc-500 group-hover:text-zinc-900' 
                    : 'text-zinc-400 group-hover:text-zinc-700'
              }`} 
              stroke={1.75} 
            />
            {isCollapsed ? (
              unreadNotifCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f97316] ring-2 ring-white" />
              )
            ) : (
              <>
                <span className="truncate">Notifications</span>
                {unreadNotifCount > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-[#f97316] text-white text-[10px] font-bold flex items-center justify-center shrink-0 ml-auto leading-none">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </>
            )}
          </Link>

          {/* Settings */}
          <Link
            href="/dashboard/pengaturan"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Settings"
            className={`group flex items-center transition-all ${
              isCollapsed
                ? `w-10 h-10 rounded-xl justify-center mx-auto ${
                    pathname === '/dashboard/pengaturan'
                      ? 'bg-[#18181b] text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                : `gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium ${
                    pathname === '/dashboard/pengaturan'
                      ? 'bg-[#18181b] text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`
            }`}
          >
            <IconSettings 
              className={`w-[18px] h-[18px] shrink-0 ${
                pathname === '/dashboard/pengaturan' 
                  ? 'text-white' 
                  : isCollapsed 
                    ? 'text-zinc-500 group-hover:text-zinc-900' 
                    : 'text-zinc-400 group-hover:text-zinc-700'
              }`} 
              stroke={1.75} 
            />
            {!isCollapsed && <span className="truncate">Settings</span>}
          </Link>

          {/* Help */}
          <Link
            href="/dashboard/help"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Pusat Bantuan & Dukungan"
            className={`group flex items-center transition-all ${
              isCollapsed
                ? `w-10 h-10 rounded-xl justify-center mx-auto ${
                    pathname === '/dashboard/help'
                      ? 'bg-[#18181b] text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                : `gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium ${
                    pathname === '/dashboard/help'
                      ? 'bg-[#18181b] text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`
            }`}
          >
            <IconHelpCircle 
              className={`w-[18px] h-[18px] shrink-0 ${
                pathname === '/dashboard/help' 
                  ? 'text-white' 
                  : isCollapsed 
                    ? 'text-zinc-500 group-hover:text-zinc-900' 
                    : 'text-zinc-400 group-hover:text-zinc-700'
              }`} 
              stroke={1.75} 
            />
            {!isCollapsed && <span className="truncate">Help</span>}
          </Link>

          {/* Landing Page Navigation Button */}
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Kunjungi Landing Page"
            className={`group flex items-center transition-all ${
              isCollapsed
                ? 'w-10 h-10 rounded-xl justify-center mx-auto text-zinc-500 hover:text-blue-600 hover:bg-blue-50'
                : 'gap-3 px-3 py-2 my-1 rounded-2xl text-[13px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/70 shadow-2xs'
            }`}
          >
            <IconWorld 
              className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                isCollapsed ? 'text-zinc-500 group-hover:text-blue-600' : 'text-zinc-500 group-hover:text-blue-600'
              }`} 
              stroke={1.75} 
            />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full min-w-0">
                <span className="truncate font-semibold text-zinc-700 group-hover:text-zinc-900">Landing Page</span>
                <IconArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" stroke={2} />
              </div>
            )}
          </Link>

          {/* Profile Card */}
          {isCollapsed ? (
            <Link
              href="/dashboard/pengaturan"
              onClick={() => setIsMobileMenuOpen(false)}
              title={`${currentUser?.name || 'Pengguna'} (${businessName || 'Pemilik Usaha'})`}
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto my-1 p-0.5 hover:ring-2 hover:ring-zinc-300 transition-all cursor-pointer group"
            >
              {logoUrl ? (
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-200/80 shrink-0 shadow-2xs bg-white flex items-center justify-center p-0.5">
                  <img 
                    src={logoUrl} 
                    alt={businessName || "Logo"} 
                    className="w-full h-full object-contain rounded-[10px]" 
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-blue-500 p-0.5 shrink-0 shadow-2xs flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white text-[11px] font-bold">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                </div>
              )}
            </Link>
          ) : (
            <div className="pt-1">
              <div className="flex items-center justify-between p-1.5 rounded-2xl hover:bg-zinc-100/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Pixel/Modern Avatar or S3 Store Logo */}
                  {logoUrl ? (
                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-200/80 shrink-0 shadow-2xs bg-white flex items-center justify-center p-0.5">
                      <img 
                        src={logoUrl} 
                        alt={businessName || "Logo"} 
                        className="w-full h-full object-contain rounded-[10px]" 
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-blue-500 p-0.5 shrink-0 shadow-2xs flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white text-[11px] font-bold">
                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-zinc-900 leading-tight truncate">
                      {currentUser?.name || "Pengguna"}
                    </span>
                    <span className="text-[11px] text-zinc-400 leading-tight truncate" title={businessName || 'Pemilik Usaha'}>
                      {businessName || (currentUser?.role === 'admin' ? 'Administrator' : 'Pemilik Usaha')}
                    </span>
                  </div>
                </div>
                <IconDots className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 shrink-0 ml-1" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#F8F9FA] pt-16 pb-24 lg:pt-0 lg:pb-0">
        {children}
      </main>

      {/* Floating Bottom App Navigation Bar (Khusus Mobile - Pill Style) */}
      {!isMobileMenuOpen && (
        <nav 
          aria-label="Mobile Navigation Dock"
          className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.12)] rounded-full px-2 py-1.5 flex items-center gap-1 sm:gap-2 max-w-[95vw] animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative group focus:outline-none"
              >
                {/* Speech Bubble Tooltip for Active Item (matching screenshot) */}
                {isActive && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-white border border-zinc-200/90 rounded-xl shadow-md text-[11px] font-bold text-zinc-900 whitespace-nowrap pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
                    {item.shortLabel || item.label}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-zinc-200/90 rotate-45"></div>
                  </div>
                )}

                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 shadow-2xs font-bold ring-1 ring-zinc-200/60'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
                  }`}
                >
                  <Icon className="w-5 h-5" stroke={isActive ? 2.5 : 2} />
                </div>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="w-px h-5 bg-zinc-200 mx-0.5" />

          {/* Menu Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Buka Menu Lengkap"
            title="Menu Lainnya"
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70 transition-all focus:outline-none"
          >
            <IconMenu2 className="w-5 h-5" stroke={2} />
          </button>
        </nav>
      )}
    </div>
  );
}

function NavItem({ 
  href, 
  icon, 
  label, 
  active,
  collapsed 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link 
      href={href} 
      title={collapsed ? label : undefined}
      className={`group flex items-center transition-all ${
        collapsed
          ? `w-10 h-10 rounded-xl justify-center mx-auto ${
              active
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`
          : `gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium ${
              active 
                ? 'bg-[#18181b] text-white shadow-xs' 
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`
      }`}
    >
      <span className={`shrink-0 transition-colors ${
        active 
          ? 'text-white' 
          : collapsed
            ? 'text-zinc-500 group-hover:text-zinc-900'
            : 'text-zinc-400 group-hover:text-zinc-700'
      }`}>
        {icon}
      </span>
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );
}
