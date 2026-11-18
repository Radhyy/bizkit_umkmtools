"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff, IconMail, IconArrowLeft, IconRotateClockwise, IconCheck } from "@tabler/icons-react";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"LOGIN" | "OTP">("LOGIN");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // Jika akun belum diverifikasi
      if (res.status === 403 && data.needsVerification) {
        setUnverifiedEmail(data.email || formData.email);
        setStep("OTP");
        setSuccessMsg(data.error || "Silakan masukkan kode OTP yang telah dikirim ke email Anda.");
        return;
      }

      if (!res.ok) throw new Error(data.error || "Gagal masuk");

      // Simpan data user ke localStorage (MVP session)
      localStorage.setItem("user", JSON.stringify(data.user));

      // Login berhasil, arahkan ke landing page atau dashboard
      if (data.user?.role === 'admin') {
        router.push("/admin");
      } else if (data.user?.role === 'premium') {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
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
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail || formData.email, otpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kode OTP tidak valid atau kedaluwarsa");

      // Simpan user ke localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccessMsg("Verifikasi berhasil! Mengalihkan...");

      setTimeout(() => {
        if (data.user?.role === 'admin') {
          router.push("/admin");
        } else if (data.user?.role === 'premium') {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const targetEmail = unverifiedEmail || formData.email;
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim ulang OTP");

      setSuccessMsg("Kode OTP baru berhasil dikirim ke email Anda!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setResending(false);
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
        <div className="flex flex-col items-center justify-center mb-6">
          <Link href="/" className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity">
            <Image src="/LogoToolsUmkm.png" alt="Bizkit" width={36} height={36} className="w-9 h-9 object-contain" />
            <span className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Sparling Demo', sans-serif" }}>Bizkit</span>
          </Link>
          <p className="text-slate-500 text-sm font-medium">
            {step === "LOGIN" ? "Selamat datang kembali! 👋" : "Verifikasi Email Akun Anda"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs sm:text-sm font-medium rounded-xl border border-red-100 text-center leading-relaxed">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium rounded-xl border border-emerald-100 text-center leading-relaxed flex items-center justify-center gap-1.5">
            <IconCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "LOGIN" ? (
            <motion.form 
              key="login-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin} 
              className="flex flex-col gap-4"
            >
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
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:translate-y-0.5 active:shadow-none disabled:opacity-70"
              >
                {loading ? "Memproses..." : "Masuk ke Dashboard"}
              </button>

              <p className="mt-4 text-center text-sm font-medium text-slate-500">
                Belum punya akun? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Daftar sekarang</Link>
              </p>
            </motion.form>
          ) : (
            <motion.form 
              key="otp-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp} 
              className="flex flex-col gap-4"
            >
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600 shrink-0">
                  <IconMail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Kode OTP Verifikasi</h4>
                  <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                    Masukkan 6 digit kode yang dikirim ke <strong className="font-semibold text-blue-900">{unverifiedEmail || formData.email}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                  Masukkan 6 Digit OTP
                </label>
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  value={otpCode} 
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;" 
                  className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center text-2xl font-bold tracking-[0.4em] text-slate-900 placeholder:text-slate-300 font-mono"
                />
              </div>

              <button 
                type="submit" disabled={loading || otpCode.length < 6}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:translate-y-0.5 active:shadow-none disabled:opacity-60"
              >
                {loading ? "Memverifikasi..." : "Verifikasi & Masuk Sekarang"}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setStep("LOGIN"); setErrorMsg(""); setSuccessMsg(""); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <IconArrowLeft className="w-4 h-4" /> Kembali ke Login
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                >
                  <IconRotateClockwise className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? "Mengirim..." : "Kirim Ulang OTP"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
