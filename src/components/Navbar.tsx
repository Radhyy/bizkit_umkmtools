"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; role?: 'free' | 'premium' | 'admin' } | null>(null);
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
        // Sinkronisasi role spesifik akun
        if (parsed.email?.toLowerCase() === "radiaakbarradia@gmail.com") {
          if (parsed.role !== "admin") {
            parsed.role = "admin";
            localStorage.setItem("user", JSON.stringify(parsed));
          }
        } else if (parsed.email?.toLowerCase() === "raaakb87@gmail.com") {
          if (parsed.role !== "premium") {
            parsed.role = "premium";
            localStorage.setItem("user", JSON.stringify(parsed));
          }
        } else if (!parsed.role) {
          parsed.role = "free";
          localStorage.setItem("user", JSON.stringify(parsed));
        }
        setUser(parsed);
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md border border-gray-100 py-2 px-5 rounded-full shadow-sm">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/LogoToolsUmkm.png" alt="Bizkit" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Sparling Demo', sans-serif" }}>Bizkit</span>
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
        <a href="/#harga" className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-full transition-colors">
          Harga
        </a>
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
              user.role === 'premium' 
                ? 'bg-amber-100 text-amber-700' 
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
                  : 'text-slate-400'
              }`}>
                {user.role === 'admin' ? 'Admin' : user.role === 'premium' ? 'Premium' : 'Free Plan'}
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

                  {/* Menu Khusus Premium: Buka Dashboard yang ada sekarang */}
                  {user.role === 'premium' && (
                    <Link 
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Buka Dashboard
                    </Link>
                  )}

                  {/* Free Plan: Tidak ada menu Dashboard, diarahkan untuk langganan paket */}
                  {(user.role === 'free' || !user.role) && (
                    <Link 
                      href="/#harga"
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
  );
}
