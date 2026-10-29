'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconSearch,
  IconPlus,
  IconLayoutDashboard,
  IconReportMoney,
  IconChartBar,
  IconBox,
  IconReceipt2,
  IconUsers,
  IconTruckDelivery,
  IconBrain,
  IconChartLine,
  IconBell,
  IconReport,
  IconSettings,
  IconLayout,
  IconHome,
} from '@tabler/icons-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1E293B] font-sans overflow-hidden">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/LogoToolsUmkm.png" alt="Bizkit Logo" className="h-6 w-auto object-contain" />
          <span 
            className="text-lg font-normal text-[#0f172a] tracking-tight"
            style={{ fontFamily: "'Sparling Demo', sans-serif" }}
          >
            Bizkit
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-200 flex flex-col pt-6 pb-4 shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/LogoToolsUmkm.png" alt="Bizkit Logo" className="h-8 w-auto object-contain" />
            <span 
              className="text-2xl font-normal text-[#0f172a] tracking-tight truncate"
              style={{ fontFamily: "'Sparling Demo', sans-serif" }}
            >
              Bizkit
            </span>
          </div>
          <button 
            className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 mb-6">
          <div className="relative">
            <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Log Button */}
        <div className="px-6 mb-8">
          <Link href="/dashboard/keuangan/tambah" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm">
            <IconPlus className="h-4 w-4 stroke-[2.5]" /> Laporan Keuangan
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="mb-6">
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Utama</p>
            <nav className="space-y-0.5">
              <NavItem href="/dashboard" icon={<IconLayoutDashboard className="h-5 w-5" />} label="Dashboard" active={pathname === '/dashboard'} />
              <NavItem href="/dashboard/keuangan" icon={<IconReportMoney className="h-5 w-5" />} label="Keuangan" active={pathname === '/dashboard/keuangan'} />
              <NavItem href="/dashboard/laporan" icon={<IconChartBar className="h-5 w-5" />} label="Laporan Bisnis" active={pathname === '/dashboard/laporan'} />
            </nav>
          </div>

          <div className="mb-6">
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pemasaran & Relasi</p>
            <nav className="space-y-0.5">
              <NavItem href="/dashboard/influencer" icon={<IconUsers className="h-5 w-5" />} label="Info Influencer" active={pathname === '/dashboard/influencer'} />
              <NavItem href="/dashboard/page-builder" icon={<IconLayout className="h-5 w-5" />} label="AI Page Builder" active={pathname === '/dashboard/page-builder'} />
            </nav>
          </div>

          <div>
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Lainnya</p>
            <nav className="space-y-0.5">
              <NavItem href="/dashboard/ai" icon={<IconChartLine className="h-5 w-5" />} label="Insight Bisnis" active={pathname === '/dashboard/ai'} />
              <NavItem href="/dashboard/asisten" icon={<IconBrain className="h-5 w-5" />} label="Asisten AI" active={pathname === '/dashboard/asisten'} />
              <NavItem href="/dashboard/notifikasi" icon={<IconBell className="h-5 w-5" />} label="Notifikasi" active={pathname === '/dashboard/notifikasi'} />
              <NavItem href="/dashboard/export" icon={<IconReport className="h-5 w-5" />} label="Export Data" active={pathname === '/dashboard/export'} />
              <NavItem href="/" icon={<IconHome className="h-5 w-5" />} label="Ke Landing Page" active={pathname === '/'} />
              <NavItem href="/dashboard/pengaturan" icon={<IconSettings className="h-5 w-5" />} label="Pengaturan" active={pathname === '/dashboard/pengaturan'} />
            </nav>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-6 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                <img src="https://ui-avatars.com/api/?name=Toko+Maju&background=f1f5f9&color=64748b" alt="Toko Maju" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#0f172a] leading-none mb-1">Toko Maju</span>
                <span className="text-[11px] text-gray-500 leading-none">Pro Plan</span>
              </div>
            </div>
            <button className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded hover:bg-blue-200 transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#F6F8F9] pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
        active 
          ? 'bg-gray-100 text-[#0f172a] font-medium' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className={`${active ? 'text-[#0f172a]' : 'text-gray-400'}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
