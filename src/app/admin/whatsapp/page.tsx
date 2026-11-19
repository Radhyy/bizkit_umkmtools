'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconBrandWhatsapp,
  IconQrcode,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconCpu,
  IconDeviceMobile,
  IconShieldCheck,
  IconBolt,
  IconSend,
  IconSparkles,
  IconClock,
  IconCircleCheck,
  IconWifi,
  IconWifiOff,
  IconFlame,
  IconCopy,
} from '@tabler/icons-react';

interface KeyPoolItem {
  id: number;
  maskedKey: string;
  status: 'healthy' | 'cooling_down' | 'error';
  successCount: number;
  failureCount: number;
  cooldownRemainingSec: number;
  lastLatencyMs: number;
  lastUsedAt: number | null;
}

interface WASession {
  status: 'disconnected' | 'waiting_scan' | 'connected';
  phoneNumber: string | null;
  botName: string;
  deviceInfo: string;
  connectedAt: string | null;
  lastPingAt: string | null;
  qrCodeString: string;
  qrCodeDataUrl?: string;
  qrExpiresAt: number;
  totalMessagesReceived: number;
  totalTransactionsProcessed: number;
}

export default function AdminWhatsAppPage() {
  const [session, setSession] = useState<WASession | null>(null);
  const [keyPool, setKeyPool] = useState<KeyPoolItem[]>([]);
  const [model, setModel] = useState<string>('qwen/qwen3.8-27b');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [qrCountdown, setQrCountdown] = useState<number>(60);

  // Chat simulator state
  const [testPrompt, setTestPrompt] = useState('Catat pengeluaran beli bumbu dapur 45rb');
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<{
    reply: string;
    keyUsedId: number;
    latencyMs: number;
    model: string;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch initial status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp');
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setKeyPool(data.keyPool || []);
        if (data.model) setModel(data.model);

        if (data.session?.qrExpiresAt) {
          const remaining = Math.max(0, Math.ceil((data.session.qrExpiresAt - Date.now()) / 1000));
          setQrCountdown(remaining);
        }
      }
    } catch (err: any) {
      console.error('Failed to load WA status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for QR
  useEffect(() => {
    if (session?.status !== 'waiting_scan') return;

    const timer = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          // Auto refresh QR jika habis
          handleRefreshQr();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.status]);

  // Reset API Keys pool action
  const [isResettingKeys, setIsResettingKeys] = useState(false);
  const handleResetKeys = async () => {
    setIsResettingKeys(true);
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_keys' })
      });
      const data = await res.json();
      if (data.success && data.keyPool) {
        setKeyPool(data.keyPool);
        showToast('success', 'Status Pool API Key Groq berhasil disegarkan!');
      }
    } catch (err: any) {
      showToast('error', 'Gagal mereset status pool key.');
    } finally {
      setIsResettingKeys(false);
    }
  };

  // Refresh QR code action
  const handleRefreshQr = async () => {
    setIsRefreshingQr(true);
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_qr' })
      });
      const data = await res.json();
      if (data.success) {
        setSession(prev => prev ? ({
          ...prev,
          status: 'waiting_scan',
          qrCodeString: data.qrCodeString || prev.qrCodeString,
          qrCodeDataUrl: data.qrCodeDataUrl || prev.qrCodeDataUrl,
          qrExpiresAt: data.qrExpiresAt || Date.now() + 60000,
        }) : data.session);
        setQrCountdown(60);
        showToast('success', 'Kode QR berhasil diperbarui.');
      }
    } catch (err: any) {
      showToast('error', 'Gagal memuat ulang QR Code.');
    } finally {
      setIsRefreshingQr(false);
    }
  };

  // Simulate Connect
  const handleSimulateConnect = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate_connect', phoneNumber: '+62 821-8899-7711' })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        showToast('success', 'WhatsApp Bot berhasil terhubung!');
      }
    } catch (err: any) {
      showToast('error', 'Gagal menghubungkan bot.');
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        showToast('success', 'Koneksi WhatsApp diputus.');
      }
    } catch (err: any) {
      showToast('error', 'Gagal memutus koneksi.');
    }
  };

  // Test AI Chatbot
  const handleTestAi = async () => {
    if (!testPrompt.trim()) return;
    setIsTestingAi(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_ai', prompt: testPrompt })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          reply: data.reply,
          keyUsedId: data.keyUsedId,
          latencyMs: data.latencyMs,
          model: data.model,
        });
        if (data.updatedKeyPool) {
          setKeyPool(data.updatedKeyPool);
        }
        showToast('success', `Diproses oleh Key #${data.keyUsedId} (${data.latencyMs}ms)`);
      } else {
        showToast('error', data.message || 'Gagal memproses AI.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsTestingAi(false);
    }
  };

  const isConnected = session?.status === 'connected';

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-600/40 text-emerald-200'
            : 'bg-rose-950/90 border-rose-600/40 text-rose-200'
        }`}>
          {toast.type === 'success' ? <IconCheck className="w-4 h-4 text-emerald-400" /> : <IconAlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            WhatsApp Bot & Gateway
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Scan barcode untuk menghubungkan nomor WhatsApp resmi platform Bizkit dengan 5 Groq AI Key Load Balancer.
          </p>
        </div>

        {/* Status Indicator & Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : session?.status === 'waiting_scan'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {isConnected ? 'Bot Terhubung (Online)' : session?.status === 'waiting_scan' ? 'Menunggu Scan QR' : 'Terputus'}
            </span>
          </div>

          <button
            onClick={fetchStatus}
            disabled={isLoading}
            title="Sinkronkan status"
            className="p-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
          >
            <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : 'text-zinc-500'}`} />
          </button>
        </div>
      </div>

      {/* 4 Strip Metrics */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200/80">
          
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Status Koneksi</span>
              <IconWifi className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900">
              {isConnected ? 'Terhubung' : 'Standby QR'}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {isConnected ? session?.phoneNumber || '+62 821-4567-8900' : 'Arahkan kamera WA'}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Load Balancer Pool</span>
              <IconCpu className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900 flex items-center gap-1.5">
              <span>5 / 5 Key</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">Active</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Dedicated WhatsApp Pool</div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>AI Engine Model</span>
              <IconSparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900 truncate">
              {model}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Groq LPUs Ultra-Fast</div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Pesan Terproses</span>
              <IconBolt className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-zinc-900">
              {session?.totalMessagesReceived || 0}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Auto-verifikasi YA/BATAL</div>
          </div>

        </div>
      </div>

      {/* Main Grid: Barcode Scanner & Load Balancer Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: QR Code Scan Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <IconQrcode className="w-5 h-5 text-emerald-600" />
                  Scan Barcode WhatsApp
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tautkan perangkat WhatsApp Web melalui ponsel admin.
                </p>
              </div>

              {session?.status === 'waiting_scan' && (
                <button
                  onClick={handleRefreshQr}
                  disabled={isRefreshingQr}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <IconRefresh className={`w-3.5 h-3.5 ${isRefreshingQr ? 'animate-spin' : ''}`} />
                  <span>{qrCountdown}s</span>
                </button>
              )}
            </div>

            {/* QR Box Container */}
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200/80 p-6 flex flex-col items-center justify-center min-h-[300px]">
              
              {!isConnected ? (
                <>
                  {/* Normal Standard Scannable QR Code */}
                  <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-zinc-200/90 transition-all flex items-center justify-center">
                    {session?.qrCodeDataUrl ? (
                      <img
                        src={session.qrCodeDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-md select-none"
                      />
                    ) : (
                      <div className="w-52 h-52 sm:w-56 sm:h-56 bg-zinc-100 animate-pulse rounded-md flex items-center justify-center text-xs text-zinc-400">
                        Memuat QR Code...
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] font-medium text-zinc-500 mt-4 text-center">
                    Kedaluwarsa dalam <span className="font-bold text-zinc-800">{qrCountdown} detik</span>. Kode akan refresh otomatis.
                  </p>
                </>
              ) : (
                /* Connected State View */
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                    <IconCircleCheck className="w-9 h-9" stroke={2.5} />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">
                    WhatsApp Bot Aktif!
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Nomor resmi platform telah terhubung dan siap memproses pesan masuk dari pengguna.
                  </p>

                  <div className="mt-4 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs font-mono text-zinc-800 font-semibold shadow-2xs">
                    📱 {session?.phoneNumber || '+62 821-4567-8900'}
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Sinkronisasi live via WebSockets Gateway</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step by Step Instructions */}
            <div className="mt-5 space-y-2.5 text-xs text-zinc-600 bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200/60">
              <div className="font-semibold text-zinc-900 text-[11px] uppercase tracking-wider">
                Langkah Menghubungkan:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-zinc-600">
                <li>Buka aplikasi WhatsApp di HP admin.</li>
                <li>Buka <b>Perangkat Tertaut (Linked Devices)</b>.</li>
                <li>Ketuk <b>Tautkan Perangkat</b> lalu arahkan kamera ke QR di atas.</li>
              </ol>
            </div>
          </div>

          {/* Quick Simulation / Disconnect Actions */}
          <div className="mt-6 pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row gap-2">
            {!isConnected ? (
              <button
                onClick={handleSimulateConnect}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconCheck className="w-4 h-4" />
                <span>Simulasikan Scan Sukses</span>
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconWifiOff className="w-4 h-4" />
                <span>Putuskan Koneksi Bot</span>
              </button>
            )}

            <button
              onClick={handleRefreshQr}
              disabled={isRefreshingQr}
              className="py-2.5 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <IconRefresh className={`w-4 h-4 ${isRefreshingQr ? 'animate-spin' : ''}`} />
              <span>Refresh QR</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dedicated Groq Load Balancer & Live Chat Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Key Pool Monitor */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <IconCpu className="w-5 h-5 text-blue-600" />
                  Load Balancer Pool (5 Dedicated Groq Keys)
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Setiap pesan WhatsApp dialihkan secara Round-Robin dengan failover otomatis ke 5 key berikut.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetKeys}
                  disabled={isResettingKeys}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:text-blue-600 bg-zinc-100 hover:bg-blue-50 border border-zinc-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Segarkan pool dan pulihkan status semua API key"
                >
                  <IconRefresh className={`w-3.5 h-3.5 ${isResettingKeys ? 'animate-spin' : ''}`} />
                  Segarkan Pool
                </button>
                <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 uppercase tracking-wider">
                  Round-Robin + Failover
                </span>
              </div>
            </div>

            {/* List 5 API Keys */}
            <div className="space-y-2.5">
              {keyPool.map((keyItem) => {
                const isHealthy = keyItem.status === 'healthy';
                const isCooling = keyItem.status === 'cooling_down';

                return (
                  <div
                    key={keyItem.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 hover:bg-zinc-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isHealthy ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        #{keyItem.id}
                      </div>

                      <div>
                        <div className="font-mono text-zinc-800 font-semibold tracking-wide">
                          {keyItem.maskedKey}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {keyItem.lastLatencyMs ? `Latensi: ${keyItem.lastLatencyMs}ms` : 'Siap digunakan'} 
                          {keyItem.successCount > 0 && ` • ${keyItem.successCount}x sukses`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isHealthy
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isCooling
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {isHealthy ? 'SEHAT' : isCooling ? `COOLDOWN (${keyItem.cooldownRemainingSec}s)` : 'ERROR'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3.5 flex items-center justify-between text-[11px] text-zinc-400 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <span className="flex items-center gap-1 text-blue-800 font-medium">
                <IconShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Anti-Mogok: Jika Key #1 terkena limit 429, otomatis dialihkan ke Key #2 tanpa jeda.
              </span>
            </div>
          </div>

          {/* Live Chat Simulator / AI Tester */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <IconSparkles className="w-4 h-4 text-purple-600" />
                  Uji Coba Respon AI Chatbot WhatsApp
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Kirim kalimat transaksi sehari-hari untuk menguji ekstraksi data dan rotasi key load balancer.
                </p>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                'Catat pengeluaran beli bumbu dapur 45rb',
                'Pemasukan hari ini jualan kopi 180.000',
                'Bayar tagihan listrik bulanan 125rb',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestPrompt(sample)}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  "{sample}"
                </button>
              ))}
            </div>

            {/* Prompt Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTestAi()}
                placeholder="Contoh: Beli minyak goreng 2 liter 32rb..."
                className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                onClick={handleTestAi}
                disabled={isTestingAi || !testPrompt.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {isTestingAi ? (
                  <IconRefresh className="w-4 h-4 animate-spin" />
                ) : (
                  <IconSend className="w-4 h-4" />
                )}
                <span>Kirim Tes</span>
              </button>
            </div>

            {/* AI Result WhatsApp Preview */}
            {testResult && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold mb-2">
                  <span className="flex items-center gap-1">
                    <IconBrandWhatsapp className="w-3.5 h-3.5 text-emerald-600" />
                    Balasan WhatsApp Bot (Simulasi)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                    Key #{testResult.keyUsedId} • {testResult.latencyMs}ms
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs text-zinc-800 whitespace-pre-line leading-relaxed shadow-2xs font-sans">
                  {testResult.reply}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

