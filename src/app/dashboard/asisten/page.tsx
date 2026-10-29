'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  IconSparkles,
  IconSend,
  IconDots
} from '@tabler/icons-react';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: React.ReactNode | string;
};

const initialMessages: Message[] = [
  { 
    id: '1', 
    role: 'user', 
    content: 'Kenapa pengeluaran bahan baku minggu ini naik?' 
  },
  { 
    id: '2', 
    role: 'ai', 
    content: (
      <div className="space-y-3">
        <p>
          Berdasarkan data transaksi, pengeluaran bahan baku <span className="font-semibold text-[#0f172a]">naik 18%</span> dibanding minggu lalu. Penyebab utamanya adalah:
        </p>
        
        <ol className="list-decimal pl-4 space-y-1.5 text-gray-600">
          <li>Harga ayam naik 12% (dari Rp28.000 → Rp31.000/kg).</li>
          <li>Pembelian sayur meningkat 20% karena stok lebih banyak untuk promo akhir pekan.</li>
        </ol>

        <div className="pt-2">
          <p className="font-semibold text-[#0f172a] mb-1.5">Rekomendasi:</p>
          <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
            <li>Coba bandingkan harga dari supplier lain.</li>
            <li>Sesuaikan jumlah stok dengan forecast penjualan.</li>
            <li>Pertimbangkan promo menu yang menggunakan bahan baku yang lebih stabil.</li>
          </ul>
        </div>
      </div>
    )
  }
];

const mockResponses = [
  "Pertanyaan yang bagus! Walaupun saat ini saya dalam mode simulasi, saya sarankan Anda untuk melihat kembali laporan keuangan minggu lalu.",
  "Berdasarkan pola yang sering terjadi pada UMKM, hal tersebut sangat wajar. Pastikan Anda selalu mengecek pergerakan harga supplier Anda secara berkala.",
  "Tentu! Sebagai rekomendasi tambahan, cobalah bereksperimen dengan bundling menu untuk meningkatkan margin keuntungan Anda.",
  "Saya mencatat hal tersebut. Fokuslah pada retensi pelanggan minggu ini karena ada potensi peningkatan pesanan berulang.",
  "Itu adalah ide yang menarik. Anda bisa menerapkannya mulai besok dengan memonitor respon pembeli selama 3 hari pertama.",
];

export default function AsistenAIPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: randomResponse
      };
      setMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] flex flex-col">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <IconSparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a]">Asisten AI</h1>
        </div>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Tanyakan apa saja tentang bisnis Anda. AI kami siap membantu memberikan insight dan rekomendasi yang relevan.
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar bg-gray-50/30">
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2 sm:gap-4 max-w-[100%] sm:max-w-[85%]'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1 border border-blue-200">
                  <IconSparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
              )}
              
              <div 
                className={`${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl rounded-tr-sm max-w-[90%] sm:max-w-[80%] shadow-sm text-sm sm:text-base' 
                    : 'bg-white border border-gray-100 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl rounded-tl-sm shadow-sm text-gray-700 text-xs sm:text-sm leading-relaxed max-w-[calc(100%-2rem)] sm:max-w-full'
                }`}
              >
                {typeof msg.content === 'string' ? <p>{msg.content}</p> : msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2 sm:gap-4 max-w-[100%] sm:max-w-[85%]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1 border border-blue-200">
                <IconSparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0">
          <form 
            onSubmit={handleSendMessage}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan sesuatu..."
              className="w-full pl-4 sm:pl-5 pr-12 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-1.5 sm:right-2 p-1.5 sm:p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              <IconSend className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
