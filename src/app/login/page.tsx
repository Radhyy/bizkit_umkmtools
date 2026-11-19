"use client";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const desc = params.get("desc");
      if (err) {
        if (err === "GoogleAuthDibatalkan" || err === "access_denied") {
          setErrorMsg("Login dengan Google dibatalkan.");
        } else if (err === "redirect_uri_mismatch") {
          setErrorMsg("Redirect URI belum sesuai di Google Cloud Console. Pastikan http://localhost:3000/api/auth/google/callback sudah ditambahkan di Authorized redirect URIs.");
        } else if (err === "AkunDinonaktifkan") {
          setErrorMsg("Akun Anda telah dinonaktifkan sementara oleh administrator.");
        } else if (desc) {
          setErrorMsg(`Gagal masuk dengan Google: ${desc}`);
        } else {
          setErrorMsg(`Gagal masuk dengan akun Google (${err}). Silakan coba lagi.`);
        }
      }
    }
  }, []);

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
      } else if (data.user?.role === 'premium' || data.user?.role === 'trial') {
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
        } else if (data.user?.role === 'premium' || data.user?.role === 'trial') {
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
            <Image src="/PP-BizKit.png" alt="Bizkit" width={36} height={36} className="w-9 h-9 object-cover rounded-[10px] shadow-xs" priority />
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
              {/* Google Sign In Button */}
              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 rounded-2xl text-sm font-semibold text-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Masuk dengan Google</span>
              </a>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white/95 px-3 text-xs text-slate-400 font-medium whitespace-nowrap">
                  atau dengan email
                </span>
                <div className="border-t border-slate-200 w-full" />
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
