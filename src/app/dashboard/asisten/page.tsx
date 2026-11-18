'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  IconPlus,
  IconSend,
  IconSearch,
  IconTrash,
  IconMessage,
  IconCopy,
  IconCheck,
  IconHistory,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconTrendingUp,
  IconBulb,
  IconShoppingBag,
  IconX
} from '@tabler/icons-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Evaluasi Kenaikan Bahan Baku',
    preview: 'Berdasarkan data pencatatan transaksi Anda, pengeluaran bahan naik 18%...',
    updatedAt: 'Hari ini, 10:14',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Kenapa pengeluaran bahan baku minggu ini naik?',
        timestamp: '10:12'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `Berdasarkan data pencatatan transaksi Anda, total pengeluaran belanja bahan baku **naik 18%** dibanding minggu lalu.

Berikut faktor penyebab utamanya:
1. **Kenaikan Harga Modal**: Harga alpukat dan ayam potong mengalami kenaikan sekitar 12%–15% dari supplier utama.
2. **Frekuensi Belanja Tinggi**: Terdapat 3 kali pembelian bahan baku tambahan untuk mengantisipasi lonjakan akhir pekan.

**Rekomendasi Tindakan:**
• Bandingkan harga dari 2–3 distributor alternatif untuk pembelian rutin.
• Beli bahan tahan lama dalam sistem partai/grosir untuk mendapatkan harga potongan modal.
• Pertimbangkan menu bundling dengan margin keuntungan yang lebih stabil.`,
        timestamp: '10:14'
      }
    ]
  },
  {
    id: 'session-2',
    title: 'Strategi Arus Kas Akhir Pekan',
    preview: 'Pemasukan di hari Sabtu dan Minggu rata-rata mencapai Rp 850.000...',
    updatedAt: 'Kemarin',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'Bagaimana cara memaksimalkan arus kas di akhir pekan?',
        timestamp: '14:20'
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `Pemasukan harian Anda tercatat paling tinggi di hari Sabtu dan Minggu (rata-rata mencapai **Rp 850.000 / hari**).

Tips memaksimalkan arus kas:
1. **Promo Paket Bundling**: Gabungkan produk utama dengan minuman berbiaya modal rendah untuk mendongkrak rata-rata nilai transaksi.
2. **Siapkan Stok Awal**: Belanja bahan di hari Kamis sore untuk menghindari kenaikan harga mendadak di Jumat malam.
3. **Pemisahan Kas Otomatis**: Langsung sisihkan 20% dari omzet akhir pekan untuk modal belanja Senin depan.`,
        timestamp: '14:21'
      }
    ]
  },
  {
    id: 'session-3',
    title: 'Batas Ideal Belanja Modal UMKM',
    preview: 'Rasio belanja bahan baku ideal untuk bisnis F&B / retail...',
    updatedAt: '3 hari lalu',
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'Berapa persen batas aman belanja modal dari total omzet?',
        timestamp: '09:05'
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: `Untuk skala UMKM dagang & kuliner, rasio modal bahan baku (HPP) yang aman berada di rentang **35% – 45%** dari total pemasukan kotor.

Jika belanja modal Anda melebihi 50%, segera evaluasi porsi bahan atau lakukan penyesuaian harga jual agar arus kas operasional tidak defisit.`,
        timestamp: '09:06'
      }
    ]
  }
];

const SUGGESTED_PROMPTS = [
  { text: 'Kenapa pengeluaran bahan minggu ini naik?', icon: IconTrendingUp },
  { text: 'Bagaimana cara menaikkan omzet tengah pekan?', icon: IconBulb },
  { text: 'Tips belanja bahan alpukat agar lebih hemat', icon: IconShoppingBag },
];

// Helper render inline text formatting (bold, code, dll) tanpa menampilkan simbol mentah * atau #
const renderInline = (rawText: string) => {
  if (!rawText) return null;

  // 1. Tangani inline code: `code`
  const codeParts = rawText.split(/(`[^`]+`)/g);

  return codeParts.map((codePart, cIdx) => {
    if (codePart.startsWith('`') && codePart.endsWith('`') && codePart.length > 2) {
      return (
        <code key={cIdx} className="px-1.5 py-0.5 mx-0.5 bg-zinc-100 text-zinc-800 rounded font-mono text-[11px] border border-zinc-200">
          {codePart.slice(1, -1)}
        </code>
      );
    }

    // 2. Tangani bold: **text**
    const boldParts = codePart.split(/(\*\*[^*]+?\*\*)/g);

    return boldParts.map((boldPart, bIdx) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**') && boldPart.length > 4) {
        const cleanBold = boldPart.slice(2, -2).replace(/[*#]/g, '');
        return (
          <strong key={`${cIdx}-${bIdx}`} className="font-bold text-zinc-900">
            {cleanBold}
          </strong>
        );
      }

      // Tangani single asterisk: *text*
      const singleParts = boldPart.split(/(\*[^*]+?\*)/g);
      return singleParts.map((singlePart, sIdx) => {
        if (singlePart.startsWith('*') && singlePart.endsWith('*') && singlePart.length > 2) {
          const cleanSingle = singlePart.slice(1, -1).replace(/[*#]/g, '');
          return (
            <strong key={`${cIdx}-${bIdx}-${sIdx}`} className="font-bold text-zinc-900">
              {cleanSingle}
            </strong>
          );
        }

        // Hapus seluruh sisa simbol mentah * dan # agar tampilan selalu bersih dan rapi
        const cleanNormal = singlePart.replace(/[*#]/g, '');
        return cleanNormal;
      });
    });
  });
};

// Parser pesan lengkap: Menghilangkan semua # dan *, merapikan layout, bullet point, dan subjudul
const renderFormattedContent = (content: string) => {
  if (!content) return null;

  const lines = content.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();

    // Baris kosong sebagai spasi vertikal antar paragraf
    if (!trimmed) {
      return <div key={lineIdx} className="h-2" />;
    }

    // 1. Jika baris berupa Header Markdown (#, ##, ###, ####)
    if (/^#{1,6}\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#{1,6}\s+/, '');
      return (
        <div key={lineIdx} className="font-bold text-zinc-900 text-sm mt-3 mb-1 first:mt-0">
          {renderInline(headingText)}
        </div>
      );
    }

    // 2. Jika baris berupa Bullet point (*, -, •)
    if (/^(\*|-|•)\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^(\*|-|•)\s+/, '');
      return (
        <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
          <div className="flex-1 text-zinc-800 leading-relaxed text-xs sm:text-sm">
            {renderInline(bulletText)}
          </div>
        </div>
      );
    }

    // 3. Jika baris berupa List bernomor (1., 2., 3.)
    if (/^\d+\.\s+/.test(trimmed)) {
      return (
        <div key={lineIdx} className="font-semibold text-zinc-900 mt-2 mb-0.5 leading-relaxed text-xs sm:text-sm">
          {renderInline(trimmed)}
        </div>
      );
    }

    // 4. Paragraf biasa (bersih dari karakter mentah * dan #)
    return (
      <div key={lineIdx} className="text-zinc-800 leading-relaxed text-xs sm:text-sm my-0.5">
        {renderInline(trimmed)}
      </div>
    );
  });
};

export default function AsistenAIPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  
  // Default posisi sidebar chat adalah TERTUTUP (false) sesuai permintaan pengguna
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions dari database PostgreSQL
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUser(u);
        if (u?.id) {
          fetch(`/api/asisten/chat?userId=${u.id}`)
            .then(res => res.json())
            .then(data => {
              if (data?.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
                setSessions(data.sessions);
                setActiveSessionId(data.sessions[0].id);
                return;
              }
              // Jika belum ada riwayat chat di DB, buat sesi sambutan pertama
              const defaultInitSession: ChatSession = {
                id: `session-${Date.now()}`,
                title: 'Konsultasi Finansial & Bisnis',
                preview: 'Halo! Saya Asisten AI Bizkit Anda...',
                updatedAt: 'Hari ini',
                messages: [
                  {
                    id: `welcome-${Date.now()}`,
                    role: 'assistant',
                    content: `Halo **${u.name || 'Kak'}**! Saya **Bizkit AI Assistant**, konsultan bisnis dan keuangan cerdas Anda.

Saya siap membantu Anda:
• **Menganalisis Arus Kas**: Evaluasi pemasukan, pengeluaran, dan potensi kebocoran biaya modal.
• **Efisiensi Belanja Bahan**: Saran perbandingan suplier dan waktu belanja terbaik.
• **Strategi Promosi & Influencer**: Memilih channel pemasaran yang paling pas untuk kategori bisnis Anda.

Silakan tanyakan hal apa saja seputar operasional dan keuangan usaha Anda hari ini!`,
                    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  }
                ]
              };
              setSessions([defaultInitSession]);
              setActiveSessionId(defaultInitSession.id);
            })
            .catch(() => {
              setSessions(DEFAULT_SESSIONS);
              setActiveSessionId(DEFAULT_SESSIONS[0].id);
            });
          return;
        }
      }
    } catch (e) {
      console.error('Error loading chat sessions:', e);
    }
    setSessions(DEFAULT_SESSIONS);
    setActiveSessionId(DEFAULT_SESSIONS[0].id);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isTyping]);

  // Buat sesi baru
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Obrolan Baru',
      preview: 'Mulai tanyakan konsultasi bisnis Anda...',
      updatedAt: 'Baru saja',
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Halo! Ada topik bisnis atau pembukuan keuangan apa yang ingin Anda diskusikan sekarang?',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Hapus sesi obrolan (tersinkronisasi ke PostgreSQL)
  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // Hapus dari database jika id bukan sesi lokal sementara
    if (currentUser?.id && !id.startsWith('session-')) {
      try {
        await fetch(`/api/asisten/chat?sessionId=${id}&userId=${currentUser.id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Error deleting session from DB:', err);
      }
    }

    if (sessions.length <= 1) {
      handleNewChat();
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0]?.id || '');
    }
  };

  // Kirim pesan ke Backend AI Groq dengan Load Balancer & simpan riwayat ke DB
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText || isTyping) return;

    const timeString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `usr-${Date.now()}`;
    
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: messageText,
      timestamp: timeString
    };

    let targetSession = activeSession;
    if (!targetSession) {
      targetSession = {
        id: `session-${Date.now()}`,
        title: messageText.slice(0, 32),
        preview: messageText,
        updatedAt: 'Hari ini, ' + timeString,
        messages: []
      };
      setSessions(prev => [targetSession!, ...prev]);
      setActiveSessionId(targetSession.id);
    }

    const isFirstQuestion = targetSession.messages.filter(m => m.role === 'user').length === 0;
    const newTitle = isFirstQuestion ? (messageText.slice(0, 32) + (messageText.length > 32 ? '...' : '')) : targetSession.title;

    // Optimistic UI Update langsung di layar
    const updatedMessages = [...targetSession.messages, userMessage];
    setSessions(prev => prev.map(s => {
      if (s.id === targetSession!.id) {
        return {
          ...s,
          title: newTitle,
          preview: messageText,
          updatedAt: 'Hari ini, ' + timeString,
          messages: updatedMessages
        };
      }
      return s;
    }));

    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/asisten/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          sessionId: targetSession.id.startsWith('session-') ? undefined : targetSession.id,
          message: messageText,
          sessionTitle: newTitle
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pesan AI');
      }

      const realSessionId = data.sessionId || targetSession.id;
      const aiMessage: ChatMessage = {
        id: data.aiMessageId || `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Maaf, saya tidak dapat merumuskan tanggapan saat ini.',
        timestamp: data.timestamp || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setSessions(prev => prev.map(s => {
        if (s.id === targetSession!.id || s.id === realSessionId) {
          return {
            ...s,
            id: realSessionId,
            preview: (data.reply || '').slice(0, 60) + '...',
            messages: [...updatedMessages, aiMessage]
          };
        }
        return s;
      }));

      if (targetSession.id !== realSessionId) {
        setActiveSessionId(realSessionId);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      const fallbackAiMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Mohon maaf, terjadi kendala saat menghubungi server AI (${err.message}). Sistem load balancer akan otomatis memulihkan koneksi pada pertanyaan berikutnya.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setSessions(prev => prev.map(s => {
        if (s.id === targetSession!.id) {
          return {
            ...s,
            messages: [...updatedMessages, fallbackAiMessage]
          };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Filter daftar riwayat obrolan
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-7 max-w-[1280px] mx-auto space-y-4 font-jakarta flex flex-col h-[calc(100vh-4.8rem)]">
      
      {/* Header Section (Tanpa Icon di samping Title H1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Asisten AI</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Konsultasikan pembukuan, efisiensi belanja bahan, dan strategi arus kas bisnis Anda.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Tombol Buka/Tutup Riwayat Obrolan */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
              isSidebarOpen 
                ? 'bg-zinc-100 text-zinc-900 border-zinc-300' 
                : 'bg-white text-zinc-700 border-zinc-200/90 hover:bg-zinc-50'
            }`}
          >
            <IconHistory className="w-3.5 h-3.5 text-zinc-500" />
            <span>{isSidebarOpen ? 'Tutup Riwayat' : 'Riwayat Obrolan'}</span>
          </button>

          {/* Tombol Buat Chat Baru */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <IconPlus className="w-3.5 h-3.5" stroke={2.5} />
            <span>Chat Baru</span>
          </button>
        </div>
      </div>

      {/* Main Interface: Left (Recent Chats History Sidebar) + Right (Active Chat Area) */}
      <div className="flex-1 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden flex flex-row min-h-0 relative">
        
        {/* Mobile Backdrop Overlay (Smooth fade) */}
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className={`sm:hidden fixed inset-0 bg-black/20 z-10 backdrop-blur-xs transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* ======================================================== */}
        {/* RECENT CHATS SIDEBAR (Bisa buka-tutup dengan transisi halus) */}
        {/* ======================================================== */}
        <aside
          className={`h-full flex flex-col shrink-0 overflow-hidden bg-white sm:bg-zinc-50/70 z-20 transition-all duration-300 ease-in-out ${
            isSidebarOpen 
              ? 'w-[85vw] sm:w-72 lg:w-80 opacity-100 border-r border-zinc-200/80 absolute sm:relative inset-y-0 left-0 shadow-xl sm:shadow-none pointer-events-auto' 
              : 'w-0 opacity-0 border-r-0 pointer-events-none'
          }`}
        >
          {/* Inner fixed-width container prevents content squishing during transition */}
          <div className="w-[85vw] sm:w-72 lg:w-80 h-full flex flex-col shrink-0">
            
            {/* Sidebar Top Header with Close Button */}
            <div className="p-3 border-b border-zinc-200/70 bg-white flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <IconHistory className="w-4 h-4 text-zinc-500" />
                <span>Riwayat Obrolan</span>
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Tutup riwayat obrolan"
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <IconLayoutSidebarLeftCollapse className="w-4 h-4" />
              </button>
            </div>

            {/* Search History */}
            <div className="p-2.5 border-b border-zinc-200/70 bg-white">
              <div className="relative flex items-center">
                <IconSearch className="w-3.5 h-3.5 text-zinc-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Cari riwayat obrolan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        if (window.innerWidth < 640) setIsSidebarOpen(false);
                      }}
                      className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-white text-zinc-900 font-semibold shadow-2xs border border-zinc-200/80' 
                          : 'text-zinc-600 hover:bg-white/80 hover:text-zinc-900'
                      }`}
                    >
                      <IconMessage className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-[#2563eb]' : 'text-zinc-400'}`} />
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="font-semibold truncate">{s.title}</div>
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">{s.preview}</div>
                        <div className="text-[10px] text-zinc-400 mt-1">{s.updatedAt}</div>
                      </div>

                      {/* Delete chat button */}
                      <button
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        title="Hapus obrolan"
                        className="absolute right-2 top-2.5 p-1 text-zinc-300 hover:text-rose-500 rounded-lg hover:bg-zinc-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Tidak ada riwayat obrolan yang cocok.
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-zinc-200/70 bg-white text-[11px] text-zinc-400 flex items-center justify-between">
              <span>{sessions.length} Percakapan</span>
              <span className="font-medium text-zinc-600">Bizkit AI</span>
            </div>

          </div>
        </aside>

        {/* ======================================================== */}
        {/* ACTIVE CHAT WINDOW                                       */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col h-full bg-white min-w-0">
          
          {/* Chat Header Bar */}
          <div className="px-4 sm:px-5 py-3 border-b border-zinc-200/70 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* Tombol buka sidebar jika posisi tertutup */}
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  title="Buka riwayat obrolan"
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer mr-1 shrink-0"
                >
                  <IconLayoutSidebarLeftExpand className="w-4 h-4" />
                </button>
              )}
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <h2 className="text-sm font-bold text-zinc-900 truncate">
                {activeSession?.title || 'Obrolan'}
              </h2>
            </div>
            
            <span className="text-[11px] text-zinc-400 shrink-0 ml-2">
              {activeSession?.updatedAt}
            </span>
          </div>

          {/* Chat Messages Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50/30">
            {activeSession?.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div className={`flex items-start gap-2 ${isUser ? 'max-w-[90%] sm:max-w-[75%]' : 'max-w-[95%] sm:max-w-[85%]'}`}>
                    
                    {/* Assistant Message */}
                    {!isUser && (
                      <div className="relative bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs text-xs sm:text-sm text-zinc-800 leading-relaxed group w-full">
                        
                        {/* Formatted Markdown Content */}
                        <div className="space-y-1">
                          {renderFormattedContent(msg.content)}
                        </div>

                        {/* Footer details: time + copy */}
                        <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                          <span>{msg.timestamp}</span>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-zinc-700 transition-colors cursor-pointer"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <IconCheck className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Disalin</span>
                              </>
                            ) : (
                              <>
                                <IconCopy className="w-3 h-3" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* User Message */}
                    {isUser && (
                      <div className="bg-[#18181b] text-white rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-xs text-xs sm:text-sm leading-relaxed">
                        <p className="font-normal text-white">{msg.content}</p>
                        <span className="block text-[10px] text-zinc-400 text-right mt-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2 max-w-[80%]">
                <div className="bg-white border border-zinc-200/80 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-1.5 text-xs text-zinc-400">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="ml-1 text-[11px]">Asisten sedang menganalisis data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2 bg-white border-t border-zinc-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-medium text-zinc-400 shrink-0">Saran:</span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt.text)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium border border-zinc-200/70 whitespace-nowrap transition-colors cursor-pointer"
              >
                <prompt.icon className="w-3 h-3 text-zinc-400" />
                <span>{prompt.text}</span>
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-zinc-200/70 shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tanyakan analisis keuangan, harga bahan, atau strategi arus kas..."
                className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 focus:bg-white transition-all shadow-2xs"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                title="Kirim pesan"
                className="absolute right-2 p-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-lg transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-[#18181b] cursor-pointer"
              >
                <IconSend className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
