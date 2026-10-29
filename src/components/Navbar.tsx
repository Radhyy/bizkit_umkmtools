"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("beranda");

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
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Gagal membaca session:", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
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
        <a href="#" className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-full transition-colors">
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
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-md border border-gray-100 rounded-full shadow-sm hover:bg-white transition-all text-slate-800"
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <span className="text-sm font-semibold hidden md:block">
              {user.name || user.email.split("@")[0]}
            </span>
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
                className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col"
              >
                <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                
                <div className="p-2 flex flex-col gap-1">
                  <Link 
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Buka Dashboard
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
