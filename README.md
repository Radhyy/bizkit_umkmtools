<div align="center">

# 🚀 Bizkit - Platform Manajemen Bisnis & Keuangan UMKM

**Solusi all-in-one cerdas untuk membantu pelaku UMKM Indonesia mengelola keuangan, asisten bisnis berbasis AI WhatsApp, kurasi influencer lokal, dan katalog produk otomatis.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

[🌐 Kunjungi Website](https://bizkit.my.id) • [✨ Fitur Utama](#-fitur-utama) • [🛠️ Panduan Instalasi](#%EF%B8%8F-panduan-instalasi-lokal) • [📱 Penggunaan WhatsApp Bot](#-panduan-penggunaan-whatsapp-ai-bot) • [🚀 Panduan Deployment](#-panduan-deployment-vps--production)

---

</div>

## 📌 Tentang Bizkit

**Bizkit** dirancang khusus untuk memecahkan tantangan operasional harian yang dihadapi oleh pemilik usaha mikro, kecil, dan menengah (UMKM). Seringkali pemilik usaha kesulitan memisahkan uang pribadi dan usaha, malas mencatat pembukuan manual yang rumit di excel, serta kesulitan menemukan konten kreator lokal yang cocok untuk mempromosikan produk mereka.

Dengan Bizkit, pencatatan transaksi semudah mengirim pesan WhatsApp biasa. Asisten AI kami akan otomatis mengkategorikan transaksi, menghitung laba-rugi, mendiagnosis performa bisnis, hingga mencocokkan bisnis Anda dengan influencer lokal yang tepat sasaran.

---

## ✨ Fitur Utama

### 1. 📊 Manajemen Keuangan & Arus Kas Real-time
* **Pencatatan Cepat**: Catat pemasukan dan pengeluaran harian dengan kategori yang rapi.
* **Kalkulasi Laba-Rugi Otomatis**: Ketahui margin keuntungan kotor dan bersih secara instan tanpa rumus rumit.
* **Grafik & Visualisasi Interaktif**: Pantau tren penjualan harian, mingguan, dan bulanan lewat diagram visual yang mudah dipahami.
* **Multi-Format Export**: Unduh laporan keuangan usaha dalam format **Excel (`.xlsx`)**, **CSV**, atau **PDF** untuk arsip dan perpajakan.

### 2. 💬 Asisten Finansial AI via WhatsApp (24/7)
* **Pencatatan Bahasa Alami**: Cukup kirim chat biasa seperti *"tadi laku 15 mangkok bakso total 225rb"* atau *"beli bumbu dapur dan gas 65rb"*, bot akan otomatis mencatatnya ke database.
* **Pengecekan Laporan Instan**: Ketik *"Laporan hari ini"*, *"Omzet minggu ini"*, atau *"Bulan ini untung berapa"* untuk ringkasan real-time.
* **Konsultasi Bisnis Cerdas**: Tanyakan tips efisiensi operasional atau ide promosi langsung lewat WhatsApp.
* **Multi-Key Load Balancing**: Didukung Groq API pool dengan fitur auto-failover demi kecepatan dan uptime maksimal.
* **Kontrol Privasi**: Perintah cepat seperti `Keluar` untuk melepaskan tautan nomor WhatsApp kapan saja.

### 3. 🌟 Kurasi & Matchmaking Influencer UMKM
* **Database Kreator Terverifikasi**: Akses database food vlogger dan micro-influencer lokal yang aktif di Instagram & TikTok.
* **Smart Filtering & Scoring**: AI mencocokkan influencer berdasarkan kota/lokasi toko fisik dan kategori produk UMKM.
* **Auto-Generated Pitch Message**: Buat draf pesan ajakan kolaborasi promosi profesional secara otomatis, siap dikirim via WhatsApp atau Direct Message.
* **Log Riwayat Kolaborasi**: Pantau status kontak, penawaran harga endorse, dan hasil kolaborasi dalam satu tempat.

### 4. 🎨 AI Page Builder & Katalog Digital
* **Pembuatan Halaman Instan**: Buat landing page katalog produk UMKM secara otomatis hanya dengan mengisi deskripsi singkat usaha.
* **AI Product Image Generation**: Integrasi pembuatan visual produk menggunakan kecerdasan buatan.
* **S3 Cloud Storage**: Penyimpanan foto produk dan banner cepat dan aman berbasis Object Storage.

### 5. 💳 Billing & Langganan Fleksibel (Midtrans)
* **Paket Langganan**: Akses paket Free Trial 14 hari, Bulanan, dan Tahunan.
* **Metode Pembayaran Lengkap**: Pembayaran instan melalui QRIS (GoPay, OVO, ShopeePay, DANA) dan Bank Virtual Account (BCA, Mandiri, BNI, BRI, Permata).
* **Sistem Kupon Diskon**: Dukungan kode promo untuk potongan harga langganan.

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi |
| :--- | :--- |
| **Framework Web** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/) |
| **Bahasa Pemrograman** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Tabler Icons](https://tabler-icons.io/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/) |
| **AI LLM Engine** | [Groq Cloud](https://groq.com/) (Qwen 3.8 / Llama 3 models) dengan Pool Load Balancer |
| **WhatsApp Automation** | [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) (Multi-device protocol) |
| **Object Storage** | S3-compatible Storage (AWS S3 / KilatStorage) via `@aws-sdk/client-s3` |
| **Payment Gateway** | [Midtrans Snap API](https://midtrans.com/) |
| **Email Service** | [Nodemailer](https://nodemailer.com/) (SMTP via Gmail App Password) |
| **Process Manager & Server** | [PM2](https://pm2.keymetrics.io/), Nginx Reverse Proxy, Let's Encrypt SSL |

---

## ⚙️ Panduan Instalasi Lokal

Ikuti langkah-langkah berikut untuk menjalankan Bizkit di komputer lokal:

### 1. Prasyarat Sistem
* **Node.js**: versi `18.18.0` atau yang lebih baru (disarankan Node.js 20+ LTS).
* **NPM**: bawaan Node.js.
* **PostgreSQL**: instance database lokal yang aktif (atau cloud DB seperti Neon/Supabase).

### 2. Clone Repositori
```bash
git clone https://github.com/username/tools_umkm.git
cd tools_umkm
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variables
Salin template konfigurasi `.env.example` ke file `.env`:

```bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan nilainya (lihat rincian variabel di bagian [Konfigurasi Environment](#-konfigurasi-environment-variables)).

### 5. Inisialisasi Database
Jalankan migrasi dan sinkronisasi skema Prisma ke database PostgreSQL Anda:

```bash
# Generate Prisma Client
npx prisma generate

# Sinkronisasi skema ke database
npx prisma db push
```

### 6. Jalankan Server Pengembangan
Aplikasi Bizkit memiliki dua proses utama: Web Dashboard Next.js dan WhatsApp Bot Service. Anda dapat menjalankannya sekaligus:

```bash
# Menjalankan Web Dashboard & WhatsApp Bot secara bersamaan
npm run dev

# ATAU jalankan secara terpisah di terminal berbeda:
npm run dev:web  # Hanya Next.js Web App (http://localhost:3000)
npm run dev:wa   # Hanya WhatsApp Bot Service
```

Buka browser Anda dan akses:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 Konfigurasi Environment Variables

Berikut adalah daftar variabel lingkungan yang dibutuhkan oleh sistem Bizkit. Gunakan file template [`.env.example`](./.env.example) sebagai acuan:

> [!IMPORTANT]
> **PERINGATAN KEAMANAN**: Jangan pernah memasukkan API key, secret, atau password asli ke repositori publik (GitHub/GitLab). Selalu gunakan file `.env` lokal dan pastikan file `.env` tercantum di `.gitignore`.

```env
# ==============================================================================
# CONTOH FORMAT KONFIGURASI (.env.example)
# ==============================================================================

# 1. DATABASE (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/bizkit_db?schema=public"

# 2. EMAIL SMTP (Nodemailer untuk OTP & Verifikasi)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="xxxx yyyy zzzz wwww"  # Gunakan Gmail App Password

# 3. GROQ AI ENGINE (Dashboard Assistant & Diagnostic)
# Pisahkan multi-key dengan koma untuk fitur load balancer & auto-failover
GROQ_API_KEYS="gsk_contohKey1xxxxxxxxxxxx,gsk_contohKey2xxxxxxxxxxxx"
GROQ_DEFAULT_MODEL="qwen/qwen3.8-27b"

# 4. WHATSAPP BOT - DEDICATED GROQ POOL
# Kuota khusus bot agar tidak berebut dengan dashboard web
GROQ_WA_API_KEYS="gsk_waKey1xxxxxxxxxxxx,gsk_waKey2xxxxxxxxxxxx"
GROQ_WA_MODEL="qwen/qwen3.8-27b"

# 5. AI IMAGE GENERATION (Pembuat Gambar Produk Katalog)
IMAGE_GEN_KEYS="sk-contohImageKeyxxxxxxxxxxxx"
IMAGE_GEN_MODEL="ag/gemini-3.1-flash-image"

# 6. MIDTRANS PAYMENT GATEWAY
MIDTRANS_SERVER_KEY="Mid-server-contohServerKey"
MIDTRANS_CLIENT_KEY="Mid-client-contohClientKey"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="Mid-client-contohClientKey"
MIDTRANS_IS_PRODUCTION="false"  # "true" untuk production, "false" untuk sandbox

# 7. S3 OBJECT STORAGE (Penyimpanan Banner & Foto Produk)
S3_ACCESS_KEY_ID="contoh_access_key"
S3_SECRET_ACCESS_KEY="contoh_secret_key"
S3_ENDPOINT="https://s3-id-jkt-1.kilatstorage.id"
S3_BUCKET_NAME="bizkit-storage"
S3_REGION="id-jkt-1"

# 8. GOOGLE OAUTH 2.0 (Login dengan Akun Google)
GOOGLE_CLIENT_ID="contoh-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-contohClientSecret"

# 9. APP DOMAIN
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📱 Panduan Penggunaan WhatsApp AI Bot

WhatsApp Bot Bizkit bertindak sebagai asisten keuangan pribadi UMKM yang siap sedia 24 jam.

```mermaid
flowchart LR
    A["Pengguna Chat WA"] --> B["Baileys Client"]
    B --> C["Groq AI Engine"]
    C --> D{"Klasifikasi Niat"}
    D -->|"Catat Transaksi"| E["Prisma DB (Auto Save)"]
    D -->|"Tanya Laporan"| F["Kalkulasi Kas & Kirim Ringkasan"]
    D -->|"Konsultasi Bisnis"| G["Rekomendasi AI UMKM"]
    E --> H["Notifikasi Sukses ke WA"]
    F --> H
    G --> H
```

### 1. Cara Menghubungkan Nomor WhatsApp
1. Masuk ke Dashboard Bizkit di web.
2. Buka menu **Asisten AI** atau **Koneksi WhatsApp**.
3. Scan kode QR yang muncul menggunakan aplikasi WhatsApp di HP Anda (**Menu > Perangkat Tertaut / Linked Devices > Tautkan Perangkat**).
4. Setelah terhubung, bot akan mengirimkan pesan salam dan siap digunakan.

### 2. Contoh Perintah Catat Transaksi
Cukup ketik kalimat sehari-hari tanpa format kaku:
* 💰 *Pemasukan:* `"Alhamdulillah laku catering 20 kotak total 500rb"`
* 💰 *Pemasukan:* `"penjualan offline 150.000 via qris"`
* 💸 *Pengeluaran:* `"beli beras 5kg 75rb sama minyak goreng 35rb"`
* 💸 *Pengeluaran:* `"bayar sewa lapak bulanan 600.000"`

> Bot akan otomatis membaca nama barang, nilai uang, dan jenis kategori (pemasukan/pengeluaran), lalu menyimpannya langsung ke database pembukuan Anda.

### 3. Perintah Ringkasan Laporan
* `"Laporan hari ini"` &rarr; Ringkasan total kas masuk, keluar, dan transaksi hari ini.
* `"Omzet minggu ini"` &rarr; Rekap transaksi 7 hari terakhir.
* `"Bulan ini untung berapa?"` &rarr; Estimasi laba bersih bulan berjalan.

### 4. Perintah Keluar / Unbind Akun
* Ketik **`Keluar`** atau **`Logout`** untuk melepaskan tautan nomor WhatsApp Anda dari sistem jika ingin berganti nomor.

---

## 🗂️ Struktur Direktori Proyek

```text
tools_umkm/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Rute Autentikasi (login, register, forgot-password)
│   ├── (dashboard)/            # Halaman Dashboard Inti
│   │   ├── dashboard/          # Ringkasan Finansial, Overview Kas
│   │   ├── influencer/         # Kurasi & Database Influencer
│   │   ├── page-builder/       # AI Page Builder Katalog Produk
│   │   ├── pricing/            # Halaman Upgrade Paket Midtrans
│   │   └── admin/              # Super Admin Control Center
│   ├── api/                    # API Endpoints (Midtrans, AI, Auth, Export)
│   ├── globals.css             # Konfigurasi Tailwind CSS v4 & Styling Utama
│   └── layout.tsx              # Root Layout Aplikasi
├── components/                 # Komponen UI Reusable (Navbar, Sidebar, Modal, Charts)
├── lib/                        # Utility & Helper Functions
│   ├── prisma.ts               # Prisma Client Singleton
│   ├── groq.ts                 # Groq AI Multi-Key Load Balancer
│   ├── s3.ts                   # S3 Client Helper untuk File Upload
│   └── midtrans.ts             # Midtrans Snap Helper
├── prisma/                     # Konfigurasi Database
│   └── schema.prisma           # Skema Model Database
├── public/                     # Aset Publik (Gambar, Logo, Font Sparling)
├── scripts/                    # Background Services & Utilities
│   ├── wa-service.js           # WhatsApp Bot Engine (Baileys + Groq)
│   └── wa-auth/                # Sesi Autentikasi WhatsApp Multi-Device
├── .env.example                # Template Variabel Lingkungan
├── ecosystem.config.js         # Konfigurasi PM2 Process Manager
├── package.json                # Dependensi & Script Node.js
└── README.md                   # Dokumentasi Resmi Proyek
```

---

## 🚀 Panduan Deployment (VPS / Production)

Aplikasi Bizkit siap di-deploy pada server Linux (Ubuntu 22.04 / 24.04 LTS):

### 1. Setup Server & Dependensi
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git nginx postgresql
sudo npm install -g pm2
```

### 2. Konfigurasi PM2 Process Manager
Jalankan Web App dan WhatsApp Bot secara terpisah di latar belakang menggunakan PM2:

```bash
# Jalankan Next.js Web Dashboard
pm2 start npm --name "bizkit-web" -- start -- -p 3000

# Jalankan WhatsApp Bot Service
pm2 start "node scripts/wa-service.js" --name "bizkit-wa"

# Simpan konfigurasi PM2 agar otomatis jalan saat server reboot
pm2 save
pm2 startup
```

### 3. Konfigurasi Nginx Reverse Proxy
Buat konfigurasi virtual host di `/etc/nginx/sites-available/bizkit`:

```nginx
server {
    listen 80;
    server_name bizkit.my.id www.bizkit.my.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan konfigurasi dan pasang sertifikat SSL gratis via Certbot:

```bash
sudo ln -s /etc/nginx/sites-available/bizkit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d bizkit.my.id -d www.bizkit.my.id
```

---

## 🤝 Berkontribusi

Kontribusi selalu terbuka untuk pengembangan fitur yang lebih bermanfaat bagi UMKM Indonesia!
1. Lakukan **Fork** pada repositori ini.
2. Buat branch baru untuk fitur Anda (`git checkout -b feature/FiturKeren`).
3. Lakukan commit perubahan Anda (`git commit -m 'feat: tambah fitur keren'`).
4. Push ke branch Anda (`git push origin feature/FiturKeren`).
5. Buat **Pull Request**.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi proprietary / privat untuk pengembangan **Bizkit**. Hak cipta dilindungi undang-undang.

<div align="center">
  <p>Dibuat dengan ❤️ untuk kemajuan UMKM Indonesia.</p>
</div>
