import { NextResponse } from 'next/server';
import { 
  getWhatsAppSession, 
  refreshWhatsAppQR, 
  simulateConnect, 
  disconnectWhatsApp,
  incrementMessageCounter
} from '@/lib/whatsappState';
import { 
  getWhatsAppKeyPoolStatus, 
  chatWhatsAppGroq 
} from '@/lib/groqWhatsAppClient';

// GET: Ambil status bot WA & pool load balancer 5 key Groq
export async function GET() {
  try {
    const session = getWhatsAppSession();
    const keyPool = getWhatsAppKeyPoolStatus();

    return NextResponse.json({
      success: true,
      session,
      keyPool,
      model: process.env.GROQ_WA_MODEL || 'qwen/qwen3.8-27b',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Aksi barcode scan, refresh, simulasi koneksi, & uji coba AI chat load balancer
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phoneNumber, prompt } = body;

    if (action === 'refresh_qr') {
      refreshWhatsAppQR();
      return NextResponse.json({ 
        success: true, 
        message: 'QR Code berhasil diperbarui',
        session: getWhatsAppSession() 
      });
    }

    if (action === 'simulate_connect') {
      const updated = simulateConnect(phoneNumber || '+62 821-4567-8900');
      return NextResponse.json({ 
        success: true, 
        message: 'WhatsApp Bot berhasil terhubung!',
        session: updated 
      });
    }

    if (action === 'disconnect') {
      const updated = disconnectWhatsApp();
      return NextResponse.json({ 
        success: true, 
        message: 'Koneksi WhatsApp Bot telah diputus',
        session: updated 
      });
    }

    if (action === 'test_ai') {
      if (!prompt) {
        return NextResponse.json({ success: false, message: 'Prompt tidak boleh kosong' }, { status: 400 });
      }

      // Sistem prompt verifikasi input keuangan UMKM
      const systemPrompt = `Anda adalah Asisten WhatsApp AI untuk platform Bizkit UMKM. 
Tugas Anda adalah membedah pesan pencatatan keuangan dari pedagang/UMKM.
Aturan:
1. Jika pengguna mencatat pemasukan atau pengeluaran, ekstrak:
   - Tipe: "masuk" atau "keluar"
   - Jumlah (angka rupiah)
   - Kategori (misal: Bahan Baku, Operasional, Penjualan Produk, Gaji, dll)
   - Deskripsi
2. Minta verifikasi ke pengguna dengan format ramah dan jelas:
   "Halo Kak! Kami mendeteksi transaksi berikut:
   📌 Jenis: [Pemasukan / Pengeluaran]
   💰 Nominal: Rp [Nominal format rupiah]
   📂 Kategori: [Kategori]
   📝 Keterangan: [Keterangan]

   Ketik *YA* untuk menyimpan ke pembukuan, atau ketik *BATAL* jika ada kesalahan."
3. Jika pesan bukan transaksi, jawab dengan singkat, sopan, dan ingatkan format pencatatan.`;

      const aiResult = await chatWhatsAppGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);

      incrementMessageCounter(true);

      return NextResponse.json({
        success: true,
        reply: aiResult.text,
        keyUsedId: aiResult.keyId,
        latencyMs: aiResult.latencyMs,
        model: aiResult.model,
        updatedKeyPool: getWhatsAppKeyPoolStatus(),
      });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
