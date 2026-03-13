import React from 'react';
import { Twitter } from 'lucide-react';

interface XShareButtonProps {
    text: string;
    className?: string;
    variant?: 'primary' | 'outline' | 'large';
}

export default function XShareButton({ text, className = '', variant = 'primary' }: XShareButtonProps) {
    const handleShare = () => {
        const url = new URL('https://twitter.com/intent/tweet');
        url.searchParams.append('text', text);
        // url.searchParams.append('url', window.location.origin); // Optional: add site URL
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
    };

    const baseStyles = "flex items-center justify-center gap-2 font-bold transition-all duration-200 rounded-md";

    const variants = {
        primary: "bg-white text-black hover:bg-gray-200 px-4 py-2",
        outline: "bg-transparent border border-white/20 text-white hover:bg-white/10 px-4 py-2",
        large: "bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] px-6 py-4 text-lg w-full shadow-lg transform hover:-translate-y-1"
    };

    return (
        <button
            onClick={handleShare}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            <Twitter className="w-5 h-5 fill-current" />
            <span>ポストして伝説を刻む</span>
        </button>
    );
}
