'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Hourglass } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { fetchUserProfile } = useGameStore();

  useEffect(() => {
    async function checkStatus() {
      await fetchUserProfile();
      const profile = useGameStore.getState().userProfile;

      // Decision Logic
      if (profile && profile.title_name !== '名もなき旅人' && profile.gender !== 'Unknown') {
        router.push('/inn');
      } else {
        router.push('/title');
      }
    }
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gray-500 font-serif">
      <Hourglass className="w-12 h-12 animate-pulse mb-4 text-[#a38b6b]" />
      <div className="text-xl tracking-widest animate-fade-in">運命を読み込んでいます...</div>
    </div>
  );
}
