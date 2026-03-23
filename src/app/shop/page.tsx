'use client';

// [UIUX-Expert] /shopページは旧レガシーUIのため廃止。
// MobileNavの「商店」ボタンからinnへリダイレクトし、ShopModalで道具屋を開く。
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/inn');
    }, [router]);
    return null;
}
