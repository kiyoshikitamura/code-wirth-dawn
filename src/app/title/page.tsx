'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const TitlePageInner = dynamic(() => import('./TitlePageInner'), { ssr: false });

export default function TitlePage() {
    return <TitlePageInner />;
}
