"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"REGISTER" | "OTP">("REGISTER");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [otpCode, setOtpCode] = useState("");
  
  // States for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Password dan Ulangi Password tidak cocok!");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal registrasi");

      setSuccessMsg(data.message);
      setStep("OTP");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal verifikasi OTP");

      // Simpan user ke local storage (langsung login otomatis)
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccessMsg("Verifikasi berhasil! Mengalihkan ke beranda...");
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center bg-[#f4f8fb] p-4 py-12 overflow-hidden ${jakarta.className}`}>
      
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 bg-[#f4f8fb] overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute bottom-[-100px] left-[-10%] w-[120%] h-[450px] bg-[#0047FF] blur-[120px] rounded-[100%] z-0"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-[-50px] right-[-50px] w-[700px] h-[550px] bg-[#0047FF] blur-[130px] rounded-[100%] z-0"
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
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 w-full max-w-[440px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-slate-100"
      >
        <div className="flex flex-col items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity">
            <Image src="/LogoToolsUmkm.png" alt="Bizkit" width={36} height={36} className="w-9 h-9 object-contain" />
            <span className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Sparling Demo', sans-serif" }}>Bizkit</span>
          </Link>
          <p className="text-slate-500 text-sm font-medium text-center">
            {step === "REGISTER" ? "Mulai kembangkan bisnis Anda hari ini" : "Masukkan kode OTP dari email Anda"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100 text-center">
            {successMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "REGISTER" ? (
            <motion.form 
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRegister} 
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Budi Santoso" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>

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
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} required
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimal 8 karakter" 
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Ulangi Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} required
                    value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Masukkan ulang password" 
                    className={`w-full pl-4 pr-20 py-3 rounded-xl border ${formData.confirmPassword ? (formData.password === formData.confirmPassword ? 'border-green-400 bg-green-50/50 focus:ring-green-500/20' : 'border-red-400 bg-red-50/50 focus:ring-red-500/20') : 'border-slate-200 bg-slate-50 focus:ring-blue-500/20'} focus:bg-white focus:outline-none focus:ring-2 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {formData.confirmPassword && (
                      <span className="mr-1">
                        {formData.password === formData.confirmPassword ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </span>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:translate-y-0.5 active:shadow-none disabled:opacity-70"
              >
                {loading ? "Memproses..." : "Daftar Sekarang"}
              </button>

              <p className="mt-6 text-center text-sm font-medium text-slate-500">
                Sudah punya akun? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Masuk di sini</Link>
              </p>
            </motion.form>
          ) : (
            <motion.form 
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyOtp} 
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 text-center">Kode OTP 6 Digit</label>
                <input 
                  type="text" required maxLength={6}
                  value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456" 
                  className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center text-2xl tracking-[0.5em] font-bold text-slate-900 placeholder:text-slate-300"
                />
              </div>

              <button 
                type="submit" disabled={loading || otpCode.length !== 6}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:translate-y-0.5 active:shadow-none disabled:opacity-70"
              >
                {loading ? "Memverifikasi..." : "Verifikasi OTP"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
