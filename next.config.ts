import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // セキュリティ: X-Powered-By ヘッダー除去
  poweredByHeader: false,

  // 画像最適化: WebP 対応
  images: {
    formats: ['image/webp'],
  },

  // 実験的機能
  experimental: {
    // CSS の最適化（未使用CSS削除）
    optimizeCss: true,
  },
};

export default nextConfig;
