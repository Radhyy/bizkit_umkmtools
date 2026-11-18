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
  IconSun,
  IconMoon,
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
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [lockReason, setLockReason] = useState<'free_plan' | 'trial_expired' | 'locked' | null>(null);
  const [lockMessage, setLockMessage] = useState<string>('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
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
    { href: '/dashboard', icon: IconGridDots, label: 'Overview' },
    { href: '/dashboard/keuangan', icon: IconFlame, label: 'Keuangan & Kas' },
    { href: '/dashboard/laporan', icon: IconChartBar, label: 'Laporan Bisnis' },
    { href: '/dashboard/ai', icon: IconTrendingUp, label: 'Insight Tren' },
    { href: '/dashboard/asisten', icon: IconBrain, label: 'Asisten AI' },
  ];

  const analyzeNavItems = [
    { href: '/dashboard/influencer', icon: IconUsers, label: 'Info Influencer' },
    { href: '/dashboard/page-builder', icon: IconLayout, label: 'AI Page Builder' },
    { href: '/dashboard/export', icon: IconTag, label: 'Export Data' },
  ];

  const filterItems = (items: typeof primaryNavItems) => {
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
            src="/LogoToolsUmkm.png" 
            alt="Bizkit Logo" 
            width={32} 
            height={32} 
            className="w-8 h-8 object-contain shrink-0" 
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
        className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'lg:w-[78px]' : 'w-[250px]'} bg-white border-r border-zinc-200/70 flex flex-col pt-5 pb-4 px-3 shrink-0 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Top Header: Logo + Collapse Icon */}
        <div className="flex items-center justify-between px-2 mb-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <Image 
              src="/LogoToolsUmkm.png" 
              alt="Bizkit Logo" 
              width={32} 
              height={32} 
              className="w-8 h-8 object-contain shrink-0 transition-transform group-hover:scale-105" 
              priority
            />
            {!isCollapsed && (
              <span className="text-xl font-bold text-slate-900 tracking-tight lowercase">
                bizkit
              </span>
            )}
          </Link>

          {/* Toggle Sidebar Width (Desktop) / Close (Mobile) */}
          <button 
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileMenuOpen(false);
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors"
            title={isCollapsed ? "Buka Sidebar" : "Perkecil Sidebar"}
          >
            <IconLayoutSidebar className="w-[18px] h-[18px]" stroke={1.75} />
          </button>
        </div>

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
              {!isCollapsed && (
                <p className="px-3 py-1.5 text-[11px] font-normal text-zinc-400 tracking-wide">
                  Analyze
                </p>
              )}
              {isCollapsed && <div className="h-px bg-zinc-100 my-2" />}
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
        <div className="pt-2 mt-auto border-t border-zinc-100 flex flex-col gap-0.5">
          {/* Notifications */}
          <Link
            href="/dashboard/notifikasi"
            className={`group flex items-center gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium transition-all ${
              pathname === '/dashboard/notifikasi'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`}
            title="Notifications"
          >
            <IconBell 
              className={`w-[18px] h-[18px] shrink-0 ${pathname === '/dashboard/notifikasi' ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'}`} 
              stroke={1.75} 
            />
            {!isCollapsed && (
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
            className={`group flex items-center gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium transition-all ${
              pathname === '/dashboard/pengaturan'
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`}
            title="Settings"
          >
            <IconSettings 
              className={`w-[18px] h-[18px] shrink-0 ${pathname === '/dashboard/pengaturan' ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'}`} 
              stroke={1.75} 
            />
            {!isCollapsed && <span className="truncate">Settings</span>}
          </Link>

          {/* Help / Landing */}
          <Link
            href="/"
            className="group flex items-center gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 transition-all"
            title="Help & Beranda"
          >
            <IconHelpCircle 
              className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-700" 
              stroke={1.75} 
            />
            {!isCollapsed && <span className="truncate">Help</span>}
          </Link>

          {/* Theme Switch Pill */}
          {!isCollapsed && (
            <div className="bg-[#f4f4f5] p-1 rounded-2xl flex items-center gap-1 my-2.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-xl transition-all ${
                  themeMode === 'light'
                    ? 'bg-white text-zinc-800 shadow-2xs font-semibold'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <IconSun className="w-3.5 h-3.5" stroke={2} />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-xl transition-all ${
                  themeMode === 'dark'
                    ? 'bg-[#18181b] text-white shadow-2xs font-semibold'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <IconMoon className="w-3.5 h-3.5" stroke={2} />
                <span>Dark</span>
              </button>
            </div>
          )}

          {/* Profile Card */}
          <div className="pt-1">
            <div className="flex items-center justify-between p-1.5 rounded-2xl hover:bg-zinc-100/80 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Pixel/Modern Avatar */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-blue-500 p-0.5 shrink-0 shadow-2xs flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white text-[11px] font-bold">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-zinc-900 leading-tight truncate">
                      {currentUser?.name || "Mira Okafor"}
                    </span>
                    <span className="text-[11px] text-zinc-400 leading-tight truncate">
                      {currentUser?.role === 'admin' ? 'Administrator' : 'Founder'}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <IconDots className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 shrink-0 ml-1" />
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#F8F9FA] pt-16 lg:pt-0">
        {children}
      </main>
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
      className={`group flex items-center gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium transition-all ${
        active 
          ? 'bg-[#18181b] text-white shadow-xs' 
          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <span className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'}`}>
        {icon}
      </span>
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );
}
