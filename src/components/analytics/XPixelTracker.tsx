'use client';

import { useEffect } from 'react';
import { initXPixel } from '@/utils/xads';

export default function XPixelTracker() {
  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_X_PIXEL_ID;
    if (pixelId) {
      initXPixel(pixelId);
    }
  }, []);

  return null;
}
