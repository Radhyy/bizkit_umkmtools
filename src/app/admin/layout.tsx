'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconSearch,
  IconGridDots,
  IconUsers,
  IconSparkles,
  IconReportMoney,
  IconShieldCheck,
  IconBell,
  IconHome,
  IconSettings,
  IconLock,
  IconLogout,
  IconLayoutSidebar,
  IconSun,
  IconMoon,
  IconDots,
  IconChartBar,
  IconShoppingCart,
  IconTag,
  IconBrandWhatsapp,
} from '@tabler/icons-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: string; avatarUrl?: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tutup mobile drawer saat route berganti
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Validasi role admin
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(raw);
      const role = u.email?.toLowerCase() === 'radiaakbarradia@gmail.com' ? 'admin' : u.role;
      if (role !== 'admin') {
        setIsAuthorized(false);
      } else {
        setCurrentUser({ ...u, role });
        setIsAuthorized(true);
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA] text-slate-500 text-sm font-jakarta">
        Memverifikasi hak akses administrator...
      </div>
    );
  }

  // Jika bukan Admin
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-jakarta">
        <div className="max-w-md w-full bg-slate-800 text-white rounded-3xl p-8 border border-slate-700 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <IconLock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Akses Terbatas: Administrator Only</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Halaman ini khusus untuk pengelola sistem platform Bizkit. Akun Anda tidak memiliki hak akses administrator.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link 
              href="/dashboard"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/30"
            >
              Buka Dashboard Pengguna
            </Link>
            <Link 
              href="/"
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-white/10"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminNavItems = [
    { href: '/admin', icon: IconGridDots, label: 'Overview' },
    { href: '/admin/pengguna', icon: IconUsers, label: 'Pengguna' },
    { href: '/admin/pembelian', icon: IconShoppingCart, label: 'Pembelian' },
    { href: '/admin/diskon', icon: IconTag, label: 'Kode Diskon' },
    { href: '/admin/whatsapp', icon: IconBrandWhatsapp, label: 'WhatsApp Bot' },
    { href: '/admin/paket', icon: IconSparkles, label: 'Paket & MRR' },
    { href: '/admin/laporan', icon: IconChartBar, label: 'Laporan Finansial' },
  ];

  const adminSystemItems = [
    { href: '/admin#audit', icon: IconShieldCheck, label: 'Audit & Keamanan' },
  ];

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

      {/* Sidebar Admin */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'lg:w-[70px] px-2.5 pt-4' : 'w-[250px] px-3 pt-5'} bg-white border-r border-zinc-200/70 flex flex-col pb-4 shrink-0 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Top Header */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 mb-4">
            <Link href="/admin" className="p-1 rounded-xl hover:bg-zinc-100 transition-colors" title="Bizkit Admin">
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
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <Image 
                src="/PP-BizKit.png" 
                alt="Bizkit Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8 object-cover rounded-[10px] shadow-sm shrink-0 transition-transform group-hover:scale-105" 
                priority
              />
              <span className="text-xl font-bold text-slate-900 tracking-tight lowercase">
                bizkit
              </span>
            </Link>

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

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar -mx-1 px-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`group flex items-center transition-all ${
                  isCollapsed
                    ? `w-10 h-10 rounded-xl justify-center mx-auto ${
                        isActive
                          ? 'bg-[#18181b] text-white shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                      }`
                    : `gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium ${
                        isActive
                          ? 'bg-[#18181b] text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                      }`
                }`}
              >
                <span className={`shrink-0 transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : isCollapsed 
                      ? 'text-zinc-500 group-hover:text-zinc-900' 
                      : 'text-zinc-400 group-hover:text-zinc-700'
                }`}>
                  <Icon className="w-[18px] h-[18px]" stroke={isActive ? 2 : 1.75} />
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          <div className="pt-2">
            {!isCollapsed ? (
              <p className="px-3 py-1.5 text-[11px] font-normal text-zinc-400 tracking-wide">
                Analyze
              </p>
            ) : (
              <div className="w-6 h-px bg-zinc-200/80 mx-auto my-2" />
            )}
            {adminSystemItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`group flex items-center transition-all ${
                    isCollapsed
                      ? 'w-10 h-10 rounded-xl justify-center mx-auto text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                      : 'gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`}
                >
                  <span className={`shrink-0 transition-colors ${
                    isCollapsed 
                      ? 'text-zinc-500 group-hover:text-zinc-900' 
                      : 'text-zinc-400 group-hover:text-zinc-700'
                  }`}>
                    <Icon className="w-[18px] h-[18px]" stroke={1.75} />
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`pt-2 mt-auto border-t border-zinc-100 flex flex-col ${isCollapsed ? 'items-center gap-1' : 'gap-0.5'}`}>
          {/* Notifications */}
          <Link
            href="/admin/notifikasi"
            className={`group flex items-center transition-all ${
              isCollapsed
                ? `relative w-10 h-10 rounded-xl justify-center mx-auto ${
                    pathname === '/admin/notifikasi'
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                : `gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium ${
                    pathname === '/admin/notifikasi'
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`
            }`}
            title="Notifications"
          >
            <IconBell className={`w-[18px] h-[18px] shrink-0 ${
              pathname === '/admin/notifikasi' 
                ? 'text-white' 
                : isCollapsed 
                  ? 'text-zinc-500 group-hover:text-zinc-900' 
                  : 'text-zinc-400 group-hover:text-zinc-700'
            }`} stroke={1.75} />
            {isCollapsed ? (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f97316] ring-2 ring-white" />
            ) : (
              <>
                <span className="truncate">Notifications</span>
                <span className="w-4 h-4 rounded-full bg-[#f97316] text-white text-[10px] font-bold flex items-center justify-center shrink-0 ml-auto leading-none">
                  3
                </span>
              </>
            )}
          </Link>

          {/* Settings */}
          <Link
            href="/admin/pengaturan"
            className={`group flex items-center transition-all ${
              isCollapsed
                ? `w-10 h-10 rounded-xl justify-center mx-auto ${
                    pathname === '/admin/pengaturan'
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                : `gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium ${
                    pathname === '/admin/pengaturan'
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
                  }`
            }`}
            title="Settings"
          >
            <IconSettings className={`w-[18px] h-[18px] shrink-0 ${
              pathname === '/admin/pengaturan' 
                ? 'text-white' 
                : isCollapsed 
                  ? 'text-zinc-500 group-hover:text-zinc-900' 
                  : 'text-zinc-400 group-hover:text-zinc-700'
            }`} stroke={1.75} />
            {!isCollapsed && <span className="truncate">Settings</span>}
          </Link>

          {/* Home / Help */}
          <Link
            href="/"
            className={`group flex items-center transition-all ${
              isCollapsed
                ? 'w-10 h-10 rounded-xl justify-center mx-auto text-zinc-500 hover:text-blue-600 hover:bg-blue-50'
                : 'gap-3 px-3 py-2 rounded-2xl text-[13px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80'
            }`}
            title="Help & Beranda"
          >
            <IconHome className={`w-[18px] h-[18px] shrink-0 ${
              isCollapsed ? 'text-zinc-500 group-hover:text-blue-600' : 'text-zinc-400 group-hover:text-zinc-700'
            }`} stroke={1.75} />
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

          {/* Profile Card Admin */}
          {isCollapsed ? (
            <div 
              onClick={handleLogout}
              title={`Keluar (${currentUser?.name || "Admin"})`}
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto my-1 p-0.5 hover:ring-2 hover:ring-zinc-300 transition-all cursor-pointer group"
            >
              {currentUser?.avatarUrl ? (
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-200/80 shrink-0 shadow-2xs bg-white flex items-center justify-center p-0.5">
                  <img 
                    src={currentUser.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-[10px]" 
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 p-0.5 shrink-0 shadow-2xs flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white text-[11px] font-bold">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-1">
              <div className="flex items-center justify-between p-1.5 rounded-2xl hover:bg-zinc-100/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentUser?.avatarUrl ? (
                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-200/80 shrink-0 shadow-2xs bg-white flex items-center justify-center p-0.5">
                      <img 
                        src={currentUser.avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover rounded-[10px]" 
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 p-0.5 shrink-0 shadow-2xs flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white text-[11px] font-bold">
                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-zinc-900 leading-tight truncate">
                      {currentUser?.name || "Admin Bizkit"}
                    </span>
                    <span className="text-[11px] text-zinc-400 leading-tight truncate">
                      Super Administrator
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 ml-1"
                >
                  <IconLogout className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-[#F8F9FA] pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
