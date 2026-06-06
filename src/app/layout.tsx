import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SoundProvider from "@/components/sound/SoundProvider";
import { GoogleAnalytics } from "@next/third-parties/google";
import XPixelTracker from "@/components/analytics/XPixelTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://code-wirth-dawn.com";

export const metadata: Metadata = {
  title: "Code: Wirth-Dawn — Chronicles of the Unnamed",
  description: "名もなき旅人の物語。ブラウザで遊べるJRPG風テキストアドベンチャー。",
  openGraph: {
    title: "Code: Wirth-Dawn — Chronicles of the Unnamed",
    description: "名もなき旅人の物語。ブラウザで遊べるJRPG風テキストアドベンチャー。",
    url: siteUrl,
    siteName: "Code: Wirth-Dawn",
    images: [
      {
        url: `${siteUrl}/ogp-image.png`,
        width: 1200,
        height: 630,
        alt: "Code: Wirth-Dawn",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Code: Wirth-Dawn — Chronicles of the Unnamed",
    description: "名もなき旅人の物語。ブラウザで遊べるJRPG風テキストアドベンチャー。",
    images: [`${siteUrl}/ogp-image.png`],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                var msg = e.message || '';
                if (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1 || msg.indexOf('Failed to load chunk') !== -1) {
                  console.warn('ChunkLoadError detected, reloading page...', e);
                  window.location.reload();
                }
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                var reason = e.reason || {};
                var msg = reason.message || '';
                if (reason.name === 'ChunkLoadError' || msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1 || msg.indexOf('Failed to load chunk') !== -1) {
                  console.warn('ChunkLoadError detected in promise, reloading page...', e);
                  window.location.reload();
                }
              });
            `
          }}
        />
        <SoundProvider />
        {children}
        {process.env.NEXT_PUBLIC_X_PIXEL_ID && <XPixelTracker />}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
