'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  IconSearch, 
  IconBrandTiktok, 
  IconBrandInstagram, 
  IconBrandWhatsapp,
  IconMail,
  IconTrendingUp, 
  IconMessageCircle, 
  IconSparkles,
  IconUsers,
  IconCheck,
  IconX,
  IconExternalLink,
  IconRefresh,
  IconFlame,
  IconBuildingStore,
  IconArrowUpRight
} from '@tabler/icons-react';

interface InfluencerContact {
  whatsapp: string;
  email: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

interface Influencer {
  id: number;
  name: string;
  handle: string;
  platform: 'instagram' | 'tiktok';
  niche: string;
  cityRegion?: string;
  followers: string;
  followersCount: number;
  engagement: string;
  matchScore: number;
  tags: string[];
  initials: string;
  avatarBg: string;
  description: string;
  rateEstimate: string;
  contact: InfluencerContact;
  isHype?: boolean;
}

export default function InfluencerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email: string } | null>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [profileFilled, setProfileFilled] = useState<boolean | null>(null); // null = checking
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'instagram' | 'tiktok'>('all');
  const [selectedSort, setSelectedSort] = useState<'match' | 'followers' | 'engagement'>('match');
  const [activeContactModal, setActiveContactModal] = useState<Influencer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateKey, setDateKey] = useState<string>('');

  // 1. Ambil Data User & Rekomendasi AI
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!raw) {
      router.push('/login');
      return;
    }

    try {
      const u = JSON.parse(raw);
      if (!u?.id) {
        router.push('/login');
        return;
      }
      setCurrentUser(u);
      loadInfluencerRecommendations(u.id, false);
    } catch {
      router.push('/login');
    }
  }, [router]);

  const loadInfluencerRecommendations = async (userId: string, forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch(`/api/ai/influencer?userId=${userId}${forceRefresh ? '&force=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setProfileFilled(Boolean(data.profileFilled));
        setBusinessProfile(data.profile || null);
        setInfluencers(data.influencers || []);
        if (data.dateKey) setDateKey(data.dateKey);

        if (forceRefresh) {
          setToastMessage('Rekomendasi 6 influencer berhasil diperbarui oleh AI!');
          setTimeout(() => setToastMessage(null), 3500);
        }
      }
    } catch (err) {
      console.error('Error fetching AI influencers:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (currentUser?.id) {
      loadInfluencerRecommendations(currentUser.id, true);
    }
  };

  // 2. Filter & Sort Data Influencer
  const filteredInfluencers = useMemo(() => {
    if (!profileFilled) return [];

    return influencers.filter((inf) => {
      const matchSearch = 
        inf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchPlatform = selectedPlatform === 'all' || inf.platform === selectedPlatform;

      return matchSearch && matchPlatform;
    }).sort((a, b) => {
      if (selectedSort === 'match') return b.matchScore - a.matchScore;
      if (selectedSort === 'followers') return b.followersCount - a.followersCount;
      if (selectedSort === 'engagement') return parseFloat(b.engagement) - parseFloat(a.engagement);
      return 0;
    });
  }, [influencers, searchTerm, selectedPlatform, selectedSort, profileFilled]);

  // 3. Salin Template Pesan
  const generatePitchText = (inf: Influencer) => {
    const usaha = businessProfile?.namaUsaha || 'Bizkit UMKM';
    const kategori = businessProfile?.kategoriBisnis ? `bidang ${businessProfile.kategoriBisnis}` : 'UMKM lokal';
    return `Halo Kak ${inf.name}! Saya dari ${usaha} (${kategori}). Kami sangat menyukai konten Kakak di ${inf.handle} dan tertarik untuk mengajukan kerjasama endorsement / promosi produk kami ke audiens Kakak. Apakah kami boleh meminta rate card dan info jadwal kolaborasi terbaru? Terima kasih banyak Kak!`;
  };

  const handleCopyPitch = (inf: Influencer) => {
    const text = generatePitchText(inf);
    navigator.clipboard.writeText(text);
    setToastMessage(`Template pesan untuk ${inf.name} berhasil disalin!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cleanWhatsappNumber = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <IconCheck className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-zinc-700">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section (Tanpa Icon di samping H1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Info Influencer</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Temukan dan kolaborasi dengan kreator yang paling relevan untuk memperluas jangkauan promosi produk Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {profileFilled && (
            <button
              onClick={handleRefresh}
              title="Perbarui rekomendasi influencer dengan AI"
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 text-xs font-semibold hover:bg-zinc-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <IconRefresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
              <span>{isRefreshing ? 'Mencari...' : 'Perbarui AI'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 text-xs font-semibold shadow-2xs">
            <IconUsers className="w-3.5 h-3.5 text-zinc-400" />
            <span>{profileFilled ? `${filteredInfluencers.length} Kreator Tersedia` : '0 Kreator Tersedia'}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BANNER KONDISIONAL:                                      */}
      {/* Jika BELUM mengisi profil UMKM: TAMPILKAN                */}
      {/* Jika SUDAH mengisi profil UMKM: HAPUS / HIDE             */}
      {/* ======================================================== */}
      {!profileFilled && profileFilled !== null && (
        <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0 shadow-2xs">
              <IconSparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Belum Mengisi Profil Bisnis UMKM?</p>
              <p className="text-[11px] text-amber-700">Lengkapi survei bisnis singkat agar AI dapat memberikan rekomendasi influencer yang 100% tepat sasaran.</p>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-2 bg-[#18181b] text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors shrink-0 text-center whitespace-nowrap"
          >
            Isi Profil Sekarang
          </Link>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-full md:max-w-md">
          <IconSearch className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nama, username, atau tag kategori..."
            value={searchTerm}
            disabled={!profileFilled}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all disabled:opacity-50"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Platform Segmented Filter */}
          <div className="bg-zinc-100 p-0.5 rounded-xl flex items-center text-xs font-medium">
            <button
              onClick={() => setSelectedPlatform('all')}
              disabled={!profileFilled}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPlatform === 'all' 
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                  : 'text-zinc-500 hover:text-zinc-800'
              } disabled:opacity-50`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedPlatform('instagram')}
              disabled={!profileFilled}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                selectedPlatform === 'instagram' 
                  ? 'bg-white text-pink-600 font-semibold shadow-2xs' 
                  : 'text-zinc-500 hover:text-zinc-800'
              } disabled:opacity-50`}
            >
              <IconBrandInstagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </button>
            <button
              onClick={() => setSelectedPlatform('tiktok')}
              disabled={!profileFilled}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                selectedPlatform === 'tiktok' 
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                  : 'text-zinc-500 hover:text-zinc-800'
              } disabled:opacity-50`}
            >
              <IconBrandTiktok className="w-3.5 h-3.5" />
              <span>TikTok</span>
            </button>
          </div>

          {/* Sort Select */}
          <select
            value={selectedSort}
            disabled={!profileFilled}
            onChange={(e: any) => setSelectedSort(e.target.value)}
            className="px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-xs font-medium text-zinc-700 focus:outline-none focus:border-zinc-400 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <option value="match">Urutkan: Skor Cocok</option>
            <option value="followers">Urutkan: Pengikut Terbanyak</option>
            <option value="engagement">Urutkan: Engagement Rate</option>
          </select>
        </div>

      </div>

      {/* ======================================================== */}
      {/* CONTENT AREA                                             */}
      {/* ======================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-2xs animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-100 rounded w-2/3" />
                  <div className="h-3 bg-zinc-50 rounded w-1/3" />
                </div>
              </div>
              <div className="h-10 bg-zinc-50 rounded-xl" />
              <div className="h-8 bg-zinc-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : !profileFilled ? (
        /* KONDISI BELUM MENGISI PROFIL: TAMPILKAN BELUM TERSEDIA */
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-10 sm:p-14 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs">
            <IconBuildingStore className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">Rekomendasi Influencer Belum Tersedia</h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              AI kami memerlukan informasi mengenai jenis usaha, target audiens, dan produk Anda untuk mencarikan 6 rekomendasi influencer yang tepat sasaran dan sedang hype.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              Isi Profil Bisnis UMKM Sekarang
            </Link>
          </div>
        </div>
      ) : (
        /* KONDISI SUDAH MENGISI PROFIL: TAMPILKAN 6 INFLUENCER REKOMENDASI AI */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInfluencers.map((inf) => (
            <div 
              key={inf.id} 
              className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 hover:border-zinc-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Avatar + Info + Badges */}
                <div className="flex items-start gap-3.5">
                  {/* Initials Avatar */}
                  <div className={`w-12 h-12 rounded-2xl ${inf.avatarBg} font-bold text-sm flex items-center justify-center shrink-0 border border-zinc-200/60 shadow-2xs`}>
                    {inf.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="text-sm font-bold text-zinc-900 truncate" title={inf.name}>
                        {inf.name}
                      </h3>
                      
                      {/* Match Score Badge */}
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100/60 shrink-0">
                        <IconSparkles className="w-2.5 h-2.5" />
                        {inf.matchScore}% Cocok
                      </span>
                    </div>

                    {/* Handle & Platform Icon */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                      {inf.platform === 'instagram' ? (
                        <IconBrandInstagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                      ) : (
                        <IconBrandTiktok className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                      )}
                      <a
                        href={inf.platform === 'instagram' ? inf.contact.instagramUrl : inf.contact.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-blue-600 hover:underline inline-flex items-center gap-0.5 font-medium text-zinc-600"
                        title={`Buka profil asli ${inf.handle}`}
                      >
                        <span>{inf.handle}</span>
                        <IconExternalLink className="w-3 h-3 text-zinc-400" />
                      </a>

                      {/* Hype / Trending Badge */}
                      {inf.isHype && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-700 bg-orange-100/80 px-1.5 py-0.2 rounded-sm ml-auto shrink-0">
                          <IconFlame className="w-3 h-3 text-orange-600" />
                          Hype
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {inf.cityRegion && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100/80">
                      📍 {inf.cityRegion}
                    </span>
                  )}
                  {inf.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-[10px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-500 mt-3 line-clamp-2 leading-relaxed">
                  "{inf.description}"
                </p>
              </div>

              {/* Bottom Row: Stats & Action Button */}
              <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs tabular-nums">
                  <div>
                    <div className="text-[10px] text-zinc-400 font-medium">Pengikut</div>
                    <div className="font-bold text-zinc-900">{inf.followers}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-medium">Engagement</div>
                    <div className="font-bold text-zinc-900 flex items-center gap-0.5">
                      <IconTrendingUp className="w-3 h-3 text-emerald-600" />
                      {inf.engagement}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveContactModal(inf)}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <IconMessageCircle className="w-3.5 h-3.5" />
                  <span>Hubungi</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {profileFilled && !isLoading && filteredInfluencers.length === 0 && (
        <div className="py-12 text-center bg-white rounded-2xl border border-zinc-200/80 p-6">
          <p className="text-sm font-semibold text-zinc-800">Tidak ada influencer yang cocok</p>
          <p className="text-xs text-zinc-400 mt-1">Coba sesuaikan kata kunci pencarian atau platform filter Anda.</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL HUBUNGI INFLUENCER & DETAIL KONTAK LENGKAP         */}
      {/* ======================================================== */}
      {activeContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-jakarta">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 transform transition-all">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl ${activeContactModal.avatarBg} font-bold text-xs flex items-center justify-center`}>
                  {activeContactModal.initials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                      {activeContactModal.name}
                    </h3>
                    {activeContactModal.isHype && (
                      <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1 py-0.2 rounded">
                        Hype
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {activeContactModal.handle} • 📍 {activeContactModal.cityRegion || 'Indonesia'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveContactModal(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Rate Card & Kontak Langsung */}
            <div className="space-y-4 text-xs">
              
              {/* Rate Card & ER */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 font-medium">Estimasi Rate Card</div>
                  <div className="font-bold text-zinc-900 mt-0.5">{activeContactModal.rateEstimate}</div>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold border border-emerald-200/60">
                  {activeContactModal.engagement} Engagement
                </span>
              </div>

              {/* Saluran Kontak Resmi (WhatsApp & Email) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-2">
                  Saluran Kontak Resmi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Tombol WhatsApp Langsung */}
                  <a
                    href={`https://wa.me/${cleanWhatsappNumber(activeContactModal.contact.whatsapp)}?text=${encodeURIComponent(generatePitchText(activeContactModal))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/70 rounded-xl font-semibold transition-colors"
                  >
                    <IconBrandWhatsapp className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Tombol Email Langsung */}
                  <a
                    href={`mailto:${activeContactModal.contact.email}?subject=${encodeURIComponent('Pengajuan Endorsement & Kolaborasi: ' + (businessProfile?.namaUsaha || 'Bizkit UMKM'))}&body=${encodeURIComponent(generatePitchText(activeContactModal))}`}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-blue-50 hover:bg-blue-100/80 text-blue-800 border border-blue-200/70 rounded-xl font-semibold transition-colors"
                  >
                    <IconMail className="w-4 h-4 text-blue-600" />
                    <span>Kirim Email</span>
                  </a>
                </div>

                {/* Tombol Langsung Kunjungi Akun Resmi Instagram/TikTok */}
                <a
                  href={activeContactModal.platform === 'instagram' ? activeContactModal.contact.instagramUrl : activeContactModal.contact.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 rounded-xl text-xs font-semibold transition-colors mt-2"
                >
                  {activeContactModal.platform === 'instagram' ? (
                    <IconBrandInstagram className="w-4 h-4 text-pink-600" />
                  ) : (
                    <IconBrandTiktok className="w-4 h-4 text-zinc-900" />
                  )}
                  <span>Buka Akun Resmi ({activeContactModal.handle})</span>
                  <IconExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>

                <div className="mt-2 text-[10px] text-zinc-400 space-y-0.5">
                  <div>• No. WhatsApp: <span className="font-medium text-zinc-700">{activeContactModal.contact.whatsapp}</span></div>
                  <div>• Email Endorse: <span className="font-medium text-zinc-700">{activeContactModal.contact.email}</span></div>
                </div>
              </div>

              {/* Draft Pesan Pitch */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-zinc-700">
                    Draft Template Pesan Pengajuan:
                  </label>
                  <button
                    onClick={() => handleCopyPitch(activeContactModal)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Salin Teks
                  </button>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-zinc-600 leading-relaxed text-[11px] max-h-24 overflow-y-auto">
                  {generatePitchText(activeContactModal)}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setActiveContactModal(null)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => handleCopyPitch(activeContactModal)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <IconMessageCircle className="w-3.5 h-3.5" />
                <span>Salin Draft Pesan</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
