'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Hourglass } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Middleware がリダイレクトを処理するため、ここはフォールバック
    // fetchUserProfile を呼ばずに軽量なセッションチェックのみ
    supabase.auth.getSession()
      .then((res) => {
        const session = res?.data?.session;
        if (session) {
          router.replace('/inn');
        } else {
          router.replace('/title');
        }
      })
      .catch((err) => {
        console.error('[RootPage] Failed to get session:', err);
        router.replace('/title');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gray-500 font-serif">
      <Hourglass className="w-12 h-12 animate-pulse mb-4 text-[#a38b6b]" />
      <div className="text-xl tracking-widest animate-fade-in">運命を読み込んでいます...</div>
    </div>
  );
}
