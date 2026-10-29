'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  IconUsers,
  IconSearch,
  IconFilter,
  IconBrandTiktok,
  IconBrandInstagram,
  IconStar,
  IconTrendingUp,
  IconMessageCircle,
  IconSparkles
} from '@tabler/icons-react';

const influencers = [
  {
    id: 1,
    name: 'Sarah Kulineria',
    handle: '@sarah.makan',
    platform: 'instagram',
    niche: 'Kuliner',
    followers: '125K',
    engagement: '4.8%',
    matchScore: 98,
    tags: ['Food Review', 'Cafe', 'Street Food'],
    image: 'https://ui-avatars.com/api/?name=Sarah+Kulineria&background=eff6ff&color=3b82f6&size=150',
    description: 'Fokus pada ulasan makanan lokal dan jajanan hits dengan gaya penyampaian kasual.'
  },
  {
    id: 2,
    name: 'Budi Mukbang',
    handle: '@budimukbang',
    platform: 'tiktok',
    niche: 'Kuliner',
    followers: '450K',
    engagement: '6.2%',
    matchScore: 95,
    tags: ['Mukbang', 'Spicy Food', 'Pedas'],
    image: 'https://ui-avatars.com/api/?name=Budi+Mukbang&background=eff6ff&color=3b82f6&size=150',
    description: 'Kreator TikTok viral yang spesialis dalam mukbang makanan porsi besar dan pedas.'
  },
  {
    id: 3,
    name: 'Chef Anita',
    handle: '@anitacooks',
    platform: 'instagram',
    niche: 'Kuliner',
    followers: '85K',
    engagement: '5.1%',
    matchScore: 88,
    tags: ['Resep', 'Home Cooking', 'Healthy'],
    image: 'https://ui-avatars.com/api/?name=Chef+Anita&background=eff6ff&color=3b82f6&size=150',
    description: 'Membagikan resep masakan rumahan sehat dan mengulas bahan baku berkualitas.'
  },
  {
    id: 4,
    name: 'Deni Jajan',
    handle: '@denijajanterus',
    platform: 'tiktok',
    niche: 'Kuliner',
    followers: '210K',
    engagement: '7.5%',
    matchScore: 92,
    tags: ['Hidden Gem', 'Murah', 'Vlog'],
    image: 'https://ui-avatars.com/api/?name=Deni+Jajan&background=eff6ff&color=3b82f6&size=150',
    description: 'Suka mencari hidden gem kuliner murah meriah di berbagai kota.'
  }
];

export default function InfluencerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <IconUsers className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f172a]">Info Influencer</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Temukan dan kolaborasi dengan influencer yang paling cocok untuk mempromosikan bisnis Anda.
          </p>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 right-20 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="p-2 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <Image src="/iconAsistenAIPintar.png" alt="AI Icon" width={32} height={32} unoptimized={true} className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">Rekomendasi AI untuk Toko Anda</h2>
            <p className="text-blue-100 text-sm max-w-xl">
              Berdasarkan kategori bisnis Anda (Kuliner), kami telah menyeleksi 4 influencer teratas dengan interaksi pengikut tertinggi minggu ini.
            </p>
          </div>
        </div>
        <button className="relative z-10 bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors w-full md:w-auto shrink-0">
          Lihat Analisis Detail
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-full md:max-w-md">
          <IconSearch className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau username influencer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
          <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer">
            <option>Semua Platform</option>
            <option>Instagram</option>
            <option>TikTok</option>
          </select>
          <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer">
            <option>Kategori: Kuliner</option>
            <option>Kategori: Fashion</option>
            <option>Kategori: Lifestyle</option>
          </select>
          <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
            <IconFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Influencers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {influencers.map((inf) => (
          <div key={inf.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex gap-4 sm:gap-5">
              <img src={inf.image} alt={inf.name} className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-[#0f172a] truncate max-w-[120px] sm:max-w-[200px]">{inf.name}</h3>
                    {inf.platform === 'instagram' ? (
                      <IconBrandInstagram className="w-4 h-4 text-pink-600 shrink-0" />
                    ) : (
                      <IconBrandTiktok className="w-4 h-4 text-black shrink-0" />
                    )}
                  </div>
                  {/* Match Score Badge */}
                  <div className="bg-green-50 text-green-700 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 border border-green-200 shrink-0">
                    <IconSparkles className="w-3 h-3 hidden sm:block" />
                    {inf.matchScore}% <span className="hidden sm:inline">Cocok</span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-500 mb-2 truncate">{inf.handle}</span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {inf.tags.map(tag => (
                    <span key={tag} className="text-[9px] sm:text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-5 line-clamp-2 leading-relaxed">
              "{inf.description}"
            </p>

            <hr className="my-5 border-gray-100" />

            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <IconUsers className="w-3 h-3" /> Pengikut
                  </span>
                  <span className="text-base font-bold text-[#0f172a]">{inf.followers}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <IconTrendingUp className="w-3 h-3" /> Engagement
                  </span>
                  <span className="text-base font-bold text-[#0f172a]">{inf.engagement}</span>
                </div>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors">
                <IconMessageCircle className="w-4 h-4" />
                Hubungi
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
