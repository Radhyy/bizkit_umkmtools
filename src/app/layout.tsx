import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bizkit",
  description: "Platform digital terpadu untuk kelola bisnis UMKM",
  icons: {
    icon: "/PP-BizKit.png",
    shortcut: "/PP-BizKit.png",
    apple: "/PP-BizKit.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className="h-full antialiased font-jakarta"
    >
      <head>
        <link rel="icon" href="/PP-BizKit.png" type="image/png" />
        <link rel="shortcut icon" href="/PP-BizKit.png" type="image/png" />
        <link rel="apple-touch-icon" href="/PP-BizKit.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link 
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
