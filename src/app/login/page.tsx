"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal masuk");

      // Simpan data user ke localStorage (MVP session)
      localStorage.setItem("user", JSON.stringify(data.user));

      // Login berhasil, arahkan ke landing page
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center bg-[#f4f8fb] p-4 overflow-hidden ${jakarta.className}`}>
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 bg-[#f4f8fb] overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute bottom-[-100px] right-[-10%] w-[120%] h-[450px] bg-[#0047FF] blur-[120px] rounded-[100%] z-0"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-[-50px] left-[-50px] w-[700px] h-[550px] bg-[#0047FF] blur-[130px] rounded-[100%] z-0"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute inset-0 w-full h-full bg-white/5 backdrop-blur-[4px]" 
          style={{ 
            maskImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='10' fill='black'/%3E%3C/svg%3E")`,
            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='10' fill='black'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 w-full max-w-[440px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-slate-100"
      >
        <div className="flex flex-col items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity">
            <Image src="/LogoToolsUmkm.png" alt="Bizkit" width={36} height={36} className="w-9 h-9 object-contain" />
            <span className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Sparling Demo', sans-serif" }}>Bizkit</span>
          </Link>
          <p className="text-slate-500 text-sm font-medium">Selamat datang kembali! 👋</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input 
              type="email" required
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="email@contoh.com" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">Lupa Password?</Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} required
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Masukkan password Anda" 
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
              >
                {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:translate-y-0.5 active:shadow-none disabled:opacity-70"
          >
            {loading ? "Memproses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Belum punya akun? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Daftar sekarang</Link>
        </p>
      </motion.div>
    </div>
  );
}
