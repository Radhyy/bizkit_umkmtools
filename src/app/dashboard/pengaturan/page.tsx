'use client';
import React, { useState } from 'react';
import { 
  IconSettings,
  IconBuildingStore,
  IconUserShield,
  IconBell,
  IconCreditCard,
  IconReceiptTax,
  IconUpload,
  IconCheck,
  IconDeviceFloppy
} from '@tabler/icons-react';

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState('profil');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <IconSettings className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f172a]">Pengaturan</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Kelola preferensi akun, detail toko, dan konfigurasi sistem Anda.
          </p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Menu */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col p-2 gap-1 sticky top-8">
            <button 
              onClick={() => setActiveTab('profil')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'profil' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <IconBuildingStore className={`w-5 h-5 ${activeTab === 'profil' ? 'text-blue-600' : 'text-gray-400'}`} />
              Profil Toko
            </button>
            <button 
              onClick={() => setActiveTab('akun')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'akun' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <IconUserShield className={`w-5 h-5 ${activeTab === 'akun' ? 'text-blue-600' : 'text-gray-400'}`} />
              Akun & Keamanan
            </button>
            <button 
              onClick={() => setActiveTab('notifikasi')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'notifikasi' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <IconBell className={`w-5 h-5 ${activeTab === 'notifikasi' ? 'text-blue-600' : 'text-gray-400'}`} />
              Notifikasi
            </button>
            <button 
              onClick={() => setActiveTab('pembayaran')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'pembayaran' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <IconCreditCard className={`w-5 h-5 ${activeTab === 'pembayaran' ? 'text-blue-600' : 'text-gray-400'}`} />
              Metode Pembayaran
            </button>
            <button 
              onClick={() => setActiveTab('pajak')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'pajak' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <IconReceiptTax className={`w-5 h-5 ${activeTab === 'pajak' ? 'text-blue-600' : 'text-gray-400'}`} />
              Pajak & Biaya
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profil' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-[#0f172a]">Profil Toko</h2>
                <p className="text-gray-500 text-sm mt-1">Informasi ini akan ditampilkan pada invoice dan profil publik Anda.</p>
              </div>
              
              <div className="p-6 flex flex-col gap-6">
                {/* Logo Upload */}
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="https://ui-avatars.com/api/?name=Toko+Maju&background=115e59&color=fff&size=100" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-[#0f172a]">Logo Toko</h3>
                    <p className="text-xs text-gray-500 mb-2">Gunakan gambar dengan rasio 1:1, berformat JPG, PNG, atau SVG. Ukuran maksimal 2MB.</p>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-max">
                      <IconUpload className="w-4 h-4" />
                      Unggah Logo Baru
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#0f172a]">Nama Toko</label>
                    <input type="text" defaultValue="Toko Maju" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#0f172a]">Kategori Bisnis</label>
                    <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none">
                      <option>Kuliner / Makanan</option>
                      <option>Pakaian / Fashion</option>
                      <option>Elektronik</option>
                      <option>Jasa</option>
                      <option>Lainnya</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#0f172a]">Email Bisnis</label>
                    <input type="email" defaultValue="hello@tokomaju.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#0f172a]">Nomor Telepon / WhatsApp</label>
                    <input type="text" defaultValue="0812-3456-7890" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm font-semibold text-[#0f172a]">Alamat Lengkap</label>
                    <textarea rows={3} defaultValue="Jl. Sudirman No. 123, Kelurahan Sukamaju, Kecamatan Maju Terus, Kota Jakarta Pusat, 10110" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"></textarea>
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-sm font-semibold text-[#0f172a]">Deskripsi Singkat</label>
                    <textarea rows={2} defaultValue="Menyediakan berbagai kebutuhan pokok dan layanan katering berkualitas tinggi sejak 2010." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"></textarea>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-end gap-4">
                {isSaved && (
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-1.5 animate-pulse">
                    <IconCheck className="w-4 h-4" /> Perubahan berhasil disimpan
                  </span>
                )}
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <IconDeviceFloppy className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'profil' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-gray-50 text-gray-400 rounded-full mb-4">
                <IconSettings className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#0f172a] mb-2">Segera Hadir</h2>
              <p className="text-gray-500 max-w-sm">
                Pengaturan untuk bagian ini sedang dalam tahap pengembangan dan akan tersedia pada pembaruan berikutnya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
