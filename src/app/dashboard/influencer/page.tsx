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
  IconTarget,
  IconChevronDown
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
  tier?: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
  niche: string;
  cityRegion?: string;
  followers: string;
  followersCount: number;
  engagement: string;
  estimatedStoreEngagement?: string;
  matchScore: number;
  tags: string[];
  initials: string;
  avatarBg: string;
  description: string;
  rateEstimate: string;
  contact: InfluencerContact;
  isHype?: boolean;
  isSmallCreator?: boolean;
  contactCount?: number;
  recommendationReason?: string;
  collaborationTip?: string;
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalAvailable, setTotalAvailable] = useState(0);

  // 1. Ambil Data User & Rekomendasi 9 Influencer Pertama
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
      loadInfluencerRecommendations(u.id, 1, false, false);
    } catch {
      router.push('/login');
    }
  }, [router]);

  const loadInfluencerRecommendations = async (
    userId: string, 
    pageToLoad = 1, 
    append = false, 
    forceRefresh = false
  ) => {
    if (append) {
      setIsLoadingMore(true);
    } else if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch(`/api/ai/influencer?userId=${userId}&page=${pageToLoad}&limit=9${forceRefresh ? '&force=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setProfileFilled(Boolean(data.profileFilled));
        setBusinessProfile(data.profile || null);
        
        const newBatch: Influencer[] = data.influencers || [];
        if (append) {
          setInfluencers((prev) => {
            // Hindari duplikasi handle jika ada
            const existingHandles = new Set(prev.map(p => p.handle.toLowerCase()));
            const filteredNew = newBatch.filter(n => !existingHandles.has(n.handle.toLowerCase()));
            return [...prev, ...filteredNew];
          });
        } else {
          setInfluencers(newBatch);
        }

        setCurrentPage(data.page || pageToLoad);
        setHasMore(Boolean(data.hasMore));
        setTotalAvailable(data.totalAvailable || newBatch.length);

        if (forceRefresh) {
          setToastMessage('Rekomendasi influencer berhasil dianalisis ulang oleh AI!');
          setTimeout(() => setToastMessage(null), 3500);
        }
      }
    } catch (err) {
      console.error('Error fetching AI influencers:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    if (currentUser?.id) {
      setCurrentPage(1);
      loadInfluencerRecommendations(currentUser.id, 1, false, true);
    }
  };

  const handleLoadMore = () => {
    if (currentUser?.id && !isLoadingMore && hasMore) {
      const nextPage = currentPage + 1;
      loadInfluencerRecommendations(currentUser.id, nextPage, true, false);
    }
  };

  // 2. Filter & Sort Data Influencer yang telah dimuat
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
    const kota = businessProfile?.kotaLokasi ? `di ${businessProfile.kotaLokasi}` : '';
    return `Halo Kak ${inf.name}! Saya dari ${usaha} (${kategori} ${kota}). Kami sangat menyukai konten review Kakak di ${inf.handle} dan berminat mengajukan kolaborasi promosi/endorsement produk kami ke audiens setia Kakak. Apakah kami boleh meminta rate card dan info jadwal kolaborasi terbaru? Terima kasih banyak Kak!`;
  };

  // 4. Catat Log Kontak ke Database (Across All Dashboard)
  const recordContactAction = async (inf: Influencer, actionType: string) => {
    try {
      await fetch('/api/ai/influencer/contact-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          influencerHandle: inf.handle,
          influencerName: inf.name,
          actionType,
        }),
      });

      // Update counter lokal secara responsif
      setInfluencers((prev) => 
        prev.map((item) => 
          item.handle.toLowerCase() === inf.handle.toLowerCase() 
            ? { ...item, contactCount: (item.contactCount || 0) + 1 } 
            : item
        )
      );
    } catch (e) {
      console.warn('Gagal mencatat log kontak:', e);
    }
  };

  const handleCopyPitch = (inf: Influencer) => {
    const text = generatePitchText(inf);
    navigator.clipboard.writeText(text);
    recordContactAction(inf, 'copy_pitch');
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

  const cleanHandle = (handle: string) => {
    return (handle || '').replace(/^@/, '').trim();
  };

  const getInstagramUrl = (inf: Influencer) => {
    if (inf.contact?.instagramUrl) return inf.contact.instagramUrl;
    return `https://www.instagram.com/${cleanHandle(inf.handle)}/`;
  };

  const getTiktokUrl = (inf: Influencer) => {
    if (inf.contact?.tiktokUrl) return inf.contact.tiktokUrl;
    return `https://www.tiktok.com/@${cleanHandle(inf.handle)}`;
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

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Info Influencer</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Riset AI dan kurasi food vlogger asli yang paling relevan dengan lokasi toko Anda untuk memperluas jangkauan promosi.
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
              <span>{isRefreshing ? 'Menganalisis...' : 'Perbarui AI'}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 text-xs font-semibold shadow-2xs">
            <IconUsers className="w-3.5 h-3.5 text-zinc-400" />
            <span>{profileFilled ? `${filteredInfluencers.length} Kreator Ditampilkan` : '0 Kreator Tersedia'}</span>
          </div>
        </div>
      </div>

      {/* BANNER KONDISIONAL JIKA BELUM MENGISI PROFIL */}
      {!profileFilled && profileFilled !== null && (
        <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0 shadow-2xs">
              <IconSparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Belum Mengisi Profil Bisnis UMKM?</p>
              <p className="text-[11px] text-amber-700">Lengkapi data toko singkat agar AI dapat meriset dan mencocokkan influencer lokal terdekat.</p>
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
            placeholder="Cari nama, handle, kota, atau tag kategori..."
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
      {/* GRID CONTENT AREA (9 INFLUENCER PER BATCH)               */}
      {/* ======================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
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
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-10 sm:p-14 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs">
            <IconBuildingStore className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">Rekomendasi Influencer Belum Tersedia</h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              AI kami memerlukan lokasi toko dan jenis usaha Anda untuk meriset food vlogger dan kreator lokal yang tepat sasaran.
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInfluencers.map((inf) => {
              const profileLink = inf.platform === 'instagram' ? getInstagramUrl(inf) : getTiktokUrl(inf);

              return (
                <div 
                  key={inf.id} 
                  className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 hover:border-zinc-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Avatar + Info + Badges */}
                    <div className="flex items-start gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl ${inf.avatarBg} font-bold text-sm flex items-center justify-center shrink-0 border border-zinc-200/60 shadow-2xs`}>
                        {inf.initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h3 className="text-sm font-bold text-zinc-900 truncate" title={inf.name}>
                            {inf.name}
                          </h3>
                          
                          {/* Match Score Badge (Tanpa Emoji) */}
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/70 shrink-0">
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
                            href={profileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordContactAction(inf, 'profile_visit')}
                            className="truncate hover:text-blue-600 hover:underline inline-flex items-center gap-0.5 font-medium text-zinc-600"
                            title={`Buka akun asli ${inf.handle}`}
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

                    {/* Compact Tags dengan Separasi Jelas (Berwarna vs Tidak Berwarna) */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {inf.cityRegion && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md shrink-0">
                          {inf.cityRegion}
                        </span>
                      )}

                      {inf.cityRegion && inf.tags.length > 0 && (
                        <span className="w-px h-3 bg-zinc-200 shrink-0" />
                      )}

                      {inf.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag} 
                          className="text-[10px] font-medium bg-zinc-100/90 text-zinc-600 border border-zinc-200/60 px-2 py-0.5 rounded-md shrink-0"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Description & AI Rationale */}
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
                      onClick={() => {
                        setActiveContactModal(inf);
                        recordContactAction(inf, 'contact_modal');
                      }}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <IconMessageCircle className="w-3.5 h-3.5" />
                      <span>Hubungi</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* TOMBOL "TAMPILKAN LEBIH BANYAK" (BG PUTIH, OUTLINE ITEM) */}
          {/* ======================================================== */}
          {hasMore ? (
            <div className="w-full pt-2 pb-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-900 border border-zinc-900 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <IconRefresh className="w-4 h-4 animate-spin text-zinc-700" />
                    <span>Memuat...</span>
                  </>
                ) : (
                  <span>Tampilkan Lebih Banyak</span>
                )}
              </button>
            </div>
          ) : (
            filteredInfluencers.length > 0 && (
              <div className="py-4 text-center">
                <p className="text-xs text-zinc-400 font-medium">
                  Semua rekomendasi telah ditampilkan.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {profileFilled && !isLoading && filteredInfluencers.length === 0 && (
        <div className="py-12 text-center bg-white rounded-2xl border border-zinc-200/80 p-6">
          <p className="text-sm font-semibold text-zinc-800">Tidak ada influencer yang cocok</p>
          <p className="text-xs text-zinc-400 mt-1">Coba sesuaikan kata kunci pencarian atau platform filter Anda.</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL HUBUNGI INFLUENCER & SALURAN RESMI                 */}
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
                    {activeContactModal.isSmallCreator && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1 py-0.2 rounded">
                        Food Vlogger Lokal
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

            {/* Modal Body: Rate Card, Dampak Toko & Kontak Langsung */}
            <div className="space-y-4 text-xs">
              
              {/* Rate Card & Estimasi Dampak Toko */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 font-medium">Estimasi Rate Card</div>
                  <div className="font-bold text-zinc-900 mt-0.5">{activeContactModal.rateEstimate}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-medium">Potensi Dampak Toko</div>
                  <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold border border-indigo-100 mt-0.5 inline-block">
                    {activeContactModal.estimatedStoreEngagement || '+12.0%'}
                  </span>
                </div>
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
                    onClick={() => recordContactAction(activeContactModal, 'whatsapp')}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/70 rounded-xl font-semibold transition-colors"
                  >
                    <IconBrandWhatsapp className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Resmi</span>
                  </a>

                  {/* Tombol Email Langsung */}
                  <a
                    href={`mailto:${activeContactModal.contact.email}?subject=${encodeURIComponent('Pengajuan Endorsement & Kolaborasi: ' + (businessProfile?.namaUsaha || 'Bizkit UMKM'))}&body=${encodeURIComponent(generatePitchText(activeContactModal))}`}
                    onClick={() => recordContactAction(activeContactModal, 'email')}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-blue-50 hover:bg-blue-100/80 text-blue-800 border border-blue-200/70 rounded-xl font-semibold transition-colors"
                  >
                    <IconMail className="w-4 h-4 text-blue-600" />
                    <span>Kirim Email</span>
                  </a>
                </div>

                {/* Tombol Langsung Kunjungi Akun Resmi Instagram/TikTok */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <a
                    href={getInstagramUrl(activeContactModal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordContactAction(activeContactModal, 'instagram_profile')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-pink-50 hover:bg-pink-100/80 text-pink-700 border border-pink-200/60 rounded-xl text-[11px] font-semibold transition-colors"
                  >
                    <IconBrandInstagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                    <span className="truncate">Instagram Resmi</span>
                    <IconExternalLink className="w-3 h-3 text-pink-400 shrink-0" />
                  </a>

                  <a
                    href={getTiktokUrl(activeContactModal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordContactAction(activeContactModal, 'tiktok_profile')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 rounded-xl text-[11px] font-semibold transition-colors"
                  >
                    <IconBrandTiktok className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                    <span className="truncate">TikTok Resmi</span>
                    <IconExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                  </a>
                </div>

                <div className="mt-2.5 text-[10px] text-zinc-400 space-y-0.5">
                  <div>• No. WhatsApp Admin / CP: <span className="font-medium text-zinc-700">{activeContactModal.contact.whatsapp}</span></div>
                  <div>• Email Endorse / Business: <span className="font-medium text-zinc-700">{activeContactModal.contact.email}</span></div>
                  {activeContactModal.contactCount !== undefined && activeContactModal.contactCount > 0 && (
                    <div className="text-zinc-500">• Total dihubungi UMKM: <span className="font-semibold text-zinc-800">{activeContactModal.contactCount} kali</span></div>
                  )}
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
