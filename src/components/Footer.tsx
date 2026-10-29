import Image from 'next/image';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

export default function Footer() {
  return (
    <footer id="footer" className="w-full bg-[#f4f8fb] py-16 md:py-24 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Column 1: Brand & Contact */}
          <div className="flex flex-col items-start gap-8">
            <div className="flex items-center gap-3">
              <Image src="/LogoToolsUmkm.png" alt="Bizkit" width={32} height={32} className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Sparling Demo', sans-serif" }}>Bizkit</span>
            </div>

            <div className={`flex flex-col gap-3 ${jakarta.className}`}>
               <p className="text-sm font-semibold text-slate-900 mb-1">Email</p>
               <p className="text-[15px] text-slate-600 font-medium">bizkittools@gmail.com</p>
               <p className="text-[15px] text-slate-600 font-medium">+62 812 3456 7890</p>
            </div>

            <button className={`bg-gradient-to-b from-[#0066FF] to-[#0047FF] hover:from-[#1a75ff] hover:to-[#003be6] text-white font-semibold py-2 pl-6 pr-2 rounded-[20px] flex items-center gap-4 transition-all shadow-[0_8px_20px_rgba(0,71,255,0.25),inset_0_2px_0_rgba(255,255,255,0.2),inset_0_-4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_0px_0px_rgba(0,71,255,0),inset_0_4px_8px_rgba(0,0,0,0.2)] cursor-pointer mt-2 ${jakarta.className}`}>
               <span className="text-[14px]">Hubungi Kami</span>
               <div className="bg-white text-[#0047FF] w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
               </div>
            </button>
          </div>

          {/* Column 2: Quick Links */}
          <div className={`flex flex-col gap-4 ${jakarta.className}`}>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Quick Links</h4>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">Beranda</Link>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">Tentang Kami</Link>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">Fitur</Link>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">Harga</Link>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">Kontak</Link>
          </div>

          {/* Column 3: Resources */}
          <div className={`flex flex-col gap-4 ${jakarta.className}`}>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Resources</h4>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">FAQs</Link>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">Pusat Bantuan</Link>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">Kebijakan Privasi</Link>
            <Link href="#" className="text-[15px] text-slate-600 hover:text-blue-600 transition-colors font-medium">Syarat & Ketentuan</Link>
          </div>

          {/* Column 4: Address */}
          <div className={`flex flex-col gap-4 ${jakarta.className}`}>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Alamat</h4>
            <p className="text-[15px] text-slate-600 font-medium leading-relaxed">
               Gedung Inovasi Lantai 3,<br />
               Jalan Sudirman No. 45<br />
               Jakarta Selatan 12190<br />
               Indonesia
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
