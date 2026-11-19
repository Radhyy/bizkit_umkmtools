"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconHome,
  IconSparkles,
  IconTag,
  IconUser,
  IconLayoutDashboard,
} from '@tabler/icons-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ 
    id?: string; 
    name: string; 
    email: string; 
    role?: 'free' | 'trial' | 'premium' | 'admin'; 
    daysLeft?: number; 
    isTrialActive?: boolean; 
    trialEndsAt?: string 
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("beranda");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (pathname !== '/') return;
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.body.offsetHeight;
      if (scrollPosition >= documentHeight - 150) {
        setActiveNav("kontak");
      } else {
        setActiveNav("beranda");
      }
    };
    
    if (pathname === '/fitur') {
      setActiveNav("fitur");
    } else if (pathname === '/') {
      handleScroll();
    }
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);

        // Sinkronisasi status role & masa trial secara realtime dari database
        fetch(`/api/auth/check-status?userId=${encodeURIComponent(parsed.id || '')}&email=${encodeURIComponent(parsed.email || '')}`)
          .then(res => res.json())
          .then(data => {
            if (data.authorized) {
              const updated = {
                ...parsed,
                role: data.role,
                daysLeft: data.daysLeft,
                isTrialActive: data.role === 'trial',
                trialEndsAt: data.trialEndsAt
              };
              setUser(updated);
              localStorage.setItem("user", JSON.stringify(updated));
            } else {
              // Jika trial habis atau free plan
              const updated = {
                ...parsed,
                role: 'free',
                isTrialActive: false,
                daysLeft: 0
              };
              setUser(updated);
              localStorage.setItem("user", JSON.stringify(updated));
            }
          })
          .catch(() => {});
      } catch (e) {
        console.error("Gagal membaca session:", e);
      }
    }
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md border border-gray-100 py-2 px-5 rounded-full shadow-sm">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/PP-BizKit.png" alt="Bizkit" width={34} height={34} className="w-[34px] h-[34px] object-cover rounded-[10px] shadow-sm shrink-0" />
          <span className="text-[22px] font-semibold text-slate-900 tracking-tight translate-y-[2px] leading-none" style={{ fontFamily: "'Sparling Demo', sans-serif" }}>Bizkit</span>
        </Link>
      </div>
      
      {/* Nav Pills */}
      <nav className="hidden md:flex items-center bg-white/70 backdrop-blur-md border border-gray-100 p-1.5 rounded-full shadow-sm transition-all duration-300">
        <Link href="/" className={`px-5 py-2 text-sm rounded-full transition-colors ${pathname === "/" && activeNav === "beranda" ? "bg-blue-50 text-blue-600 font-semibold" : "font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50"}`}>
          Beranda
        </Link>
        <Link href="/fitur" className={`px-5 py-2 text-sm rounded-full transition-colors ${pathname === "/fitur" ? "bg-blue-50 text-blue-600 font-semibold" : "font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50"}`}>
          Fitur
        </Link>
        <Link href="/harga" className={`px-5 py-2 text-sm rounded-full transition-colors ${pathname === "/harga" ? "bg-blue-50 text-blue-600 font-semibold" : "font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50"}`}>
          Harga
        </Link>
        <a href="#" className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-full transition-colors">
          Tentang
        </a>
        <a href="#footer" onClick={() => setActiveNav("kontak")} className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${activeNav === "kontak" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium"}`}>
          Kontak
        </a>
      </nav>

      {user ? (
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-full shadow-sm hover:bg-white transition-all text-slate-800"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
              user.role === 'trial'
                ? 'bg-emerald-100 text-emerald-700'
                : user.role === 'premium' 
                ? 'bg-amber-100 text-amber-700' 
                : user.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-600'
            }`}>
              {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "U")}
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-xs font-semibold leading-tight text-slate-800">
                {user.name || user.email.split("@")[0]}
              </span>
              <span className={`text-[10px] font-bold uppercase leading-tight ${
                user.role === 'admin' 
                  ? 'text-blue-600' 
                  : user.role === 'premium' 
                  ? 'text-amber-600' 
                  : user.role === 'trial'
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}>
                {user.role === 'admin' ? 'Admin' : user.role === 'premium' ? 'Premium' : user.role === 'trial' ? 'Trial Plan' : 'Free Plan'}
              </span>
            </div>
            <svg className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col z-50"
              >
                {/* Header Profile Dropdown */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name || user.email.split("@")[0]}</p>
                    {user.role === 'admin' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                        Admin
                      </span>
                    )}
                    {user.role === 'premium' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                        Premium
                      </span>
                    )}
                    {user.role === 'trial' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                        Trial Plan {typeof user.daysLeft === 'number' ? `(${user.daysLeft} Hari)` : ''}
                      </span>
                    )}
                    {(user.role === 'free' || !user.role) && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-200 text-slate-600 rounded-full">
                        Free Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                
                <div className="p-2 flex flex-col gap-1">
                  {/* Menu Khusus Admin: Hanya Dashboard Admin */}
                  {user.role === 'admin' && (
                    <Link 
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Dashboard Admin
                    </Link>
                  )}

                  {/* Menu Khusus Premium & Trial: Dashboard */}
                  {(user.role === 'premium' || user.role === 'trial') && (
                    <Link 
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Dashboard
                    </Link>
                  )}

                  {/* Free Plan (Bukan Trial / Trial Habis): Diarahkan untuk langganan paket */}
                  {user.role === 'free' && (
                    <Link 
                      href="/harga"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Upgrade ke Premium
                    </Link>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full text-left"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <Link 
          href="/login" 
          className="px-7 pt-2 pb-3 bg-gradient-to-b from-blue-400 to-blue-600 text-white text-sm font-semibold rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-4px_0_rgba(29,78,216,1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-4px_0_rgba(29,78,216,1)] active:translate-y-[3px] active:pb-[9px] active:pt-[11px] active:shadow-[0_2px_8px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(29,78,216,1)]"
        >
          Get Started
        </Link>
      )}
    </header>

    {/* Floating Bottom App Navigation Bar (Khusus Mobile - Pill Style) */}
    <nav 
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.12)] rounded-full px-2 py-1.5 flex items-center gap-1 sm:gap-2 max-w-[95vw] animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {/* 1. Beranda */}
      <Link
        href="/"
        className="relative group focus:outline-none active:scale-95 transition-transform"
      >
        {pathname === "/" && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-white border border-zinc-200/90 rounded-xl shadow-md text-[11px] font-bold text-zinc-900 whitespace-nowrap pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
            Beranda
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-zinc-200/90 rotate-45"></div>
          </div>
        )}
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            pathname === "/"
              ? 'bg-zinc-100 text-zinc-950 shadow-2xs font-bold ring-1 ring-zinc-200/60'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
          }`}
        >
          <IconHome className="w-5 h-5" stroke={pathname === "/" ? 2.5 : 2} />
        </div>
      </Link>

      {/* 2. Fitur */}
      <Link
        href="/fitur"
        className="relative group focus:outline-none active:scale-95 transition-transform"
      >
        {pathname === "/fitur" && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-white border border-zinc-200/90 rounded-xl shadow-md text-[11px] font-bold text-zinc-900 whitespace-nowrap pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
            Fitur
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-zinc-200/90 rotate-45"></div>
          </div>
        )}
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            pathname === "/fitur"
              ? 'bg-zinc-100 text-zinc-950 shadow-2xs font-bold ring-1 ring-zinc-200/60'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
          }`}
        >
          <IconSparkles className="w-5 h-5" stroke={pathname === "/fitur" ? 2.5 : 2} />
        </div>
      </Link>

      {/* 3. Harga */}
      <Link
        href="/harga"
        className="relative group focus:outline-none active:scale-95 transition-transform"
      >
        {pathname === "/harga" && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-white border border-zinc-200/90 rounded-xl shadow-md text-[11px] font-bold text-zinc-900 whitespace-nowrap pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
            Harga
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-zinc-200/90 rotate-45"></div>
          </div>
        )}
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            pathname === "/harga"
              ? 'bg-zinc-100 text-zinc-950 shadow-2xs font-bold ring-1 ring-zinc-200/60'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
          }`}
        >
          <IconTag className="w-5 h-5" stroke={pathname === "/harga" ? 2.5 : 2} />
        </div>
      </Link>

      {/* Divider */}
      <div className="w-px h-5 bg-zinc-200 mx-0.5" />

      {/* 4. User / Dashboard / Login Button */}
      {user ? (
        <Link
          href={user.role === 'admin' ? '/admin' : '/dashboard'}
          className="relative group focus:outline-none active:scale-95 transition-transform"
          title="Buka Dashboard"
        >
          {(pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-white border border-zinc-200/90 rounded-xl shadow-md text-[11px] font-bold text-zinc-900 whitespace-nowrap pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
              Dashboard
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-zinc-200/90 rotate-45"></div>
            </div>
          )}
          <div className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 transition-all">
            <IconLayoutDashboard className="w-5 h-5" stroke={2} />
          </div>
        </Link>
      ) : (
        <Link
          href="/login"
          className="relative group focus:outline-none active:scale-95 transition-transform"
          title="Masuk ke Akun"
        >
          {pathname === "/login" && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-white border border-zinc-200/90 rounded-xl shadow-md text-[11px] font-bold text-zinc-900 whitespace-nowrap pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
              Masuk
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-zinc-200/90 rotate-45"></div>
            </div>
          )}
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              pathname === "/login"
                ? 'bg-zinc-900 text-white shadow-2xs font-bold'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-900'
            }`}
          >
            <IconUser className="w-5 h-5" stroke={2} />
          </div>
        </Link>
      )}
    </nav>
  </>
  );
}
