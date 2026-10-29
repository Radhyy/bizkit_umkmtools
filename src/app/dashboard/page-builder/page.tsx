"use client";
import React, { useState } from 'react';
import { 
  IconWand, 
  IconTemplate, 
  IconCheck,
  IconSparkles,
  IconDeviceDesktop,
  IconPlus
} from '@tabler/icons-react';

export default function PageBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 w-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <IconSparkles className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f172a]">AI Page Builder</h1>
          </div>
          <p className="text-gray-500">Buat halaman toko online impian Anda dalam hitungan detik dengan AI.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column - Forms */}
          <div className="w-full lg:w-[45%] flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <IconWand className="w-5 h-5 text-blue-500" />
                Detail Konten Halaman
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prompt AI (Instruksi Utama)</label>
                  <textarea 
                    rows={4}
                    placeholder="Contoh: Buatkan halaman toko baju muslim dengan nuansa pastel, fokus pada koleksi gamis terbaru..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Toko / Produk</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama brand atau produk" 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi Singkat</label>
                  <textarea 
                    rows={2}
                    placeholder="Deskripsi yang akan muncul di hero banner..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-[0_8px_16px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer">
                    <IconWand className="w-5 h-5" />
                    Buat Halaman Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Templates */}
          <div className="w-full lg:w-[55%] flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <IconTemplate className="w-5 h-5 text-indigo-500" />
                  Pilih Desain Template
                </h2>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold">
                  <IconDeviceDesktop className="w-4 h-4" />
                  Live Preview
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Template 1 */}
                <div 
                  onClick={() => setSelectedTemplate('template1')}
                  className={`group relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                    selectedTemplate === 'template1' 
                      ? 'border-blue-500 ring-4 ring-blue-500/10' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 w-full relative overflow-hidden">
                    <img 
                      src="/TemplateProduct/Template1.jpeg" 
                      alt="Template 1" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {selectedTemplate === 'template1' && (
                      <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                        <div className="bg-blue-500 text-white rounded-full p-2 shadow-lg scale-110 transition-transform">
                          <IconCheck className="w-6 h-6 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 bg-white border-t transition-colors ${selectedTemplate === 'template1' ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100'}`}>
                    <h3 className="font-bold text-gray-900 text-sm">Template Modern Clean</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">Cocok untuk toko pakaian, aksesoris, & kosmetik.</p>
                  </div>
                </div>

                {/* Coming Soon Templates placeholder */}
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center p-6 aspect-square opacity-60">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 mb-3 border border-gray-100">
                    <IconPlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-600 text-sm">Template Lainnya</h3>
                  <p className="text-xs text-gray-400 mt-1">Segera Hadir</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
  );
}
