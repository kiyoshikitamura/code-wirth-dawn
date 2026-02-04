import React from 'react';
import { NationId } from '@/types/game';

interface LocationBackgroundProps {
    nationId: NationId | string;
    prosperityLevel: number;
    baseImage: string;
    className?: string;
}

/**
 * Renders the location background with dynamic overlays or asset switching
 * based on Spec V4 (Prosperity Level).
 * 
 * V4 Asset Naming: bg_{nation}_{level}.png
 * (e.g. bg_roland_1.png for Ruined Roland)
 */
export const LocationBackground: React.FC<LocationBackgroundProps> = ({
    nationId = 'Neutral',
    prosperityLevel = 4,
    baseImage,
    className = ''
}) => {

    // Filter Effects for Prototyping (If assets missing)
    // Lv 1 (Ruined): Grayscale + Red Tint + High Contrast
    // Lv 2 (Declining): Sepia + Dark
    // Lv 4 (Prosperous): Normal
    // Lv 5 (Zenith): Brightness + Saturation Boost

    const getFilters = (level: number) => {
        switch (level) {
            case 1: return 'grayscale(100%) contrast(120%) sepia(50%) hue-rotate(-50deg)'; // Red/Dark Ruin
            case 2: return 'sepia(60%) brightness(80%)';
            case 3: return 'grayscale(30%)';
            case 5: return 'saturate(130%) brightness(110%)';
            default: return 'none';
        }
    };

    const getOverlayGradient = (level: number) => {
        switch (level) {
            case 1: return 'linear-gradient(to bottom, rgba(50,0,0,0.5), rgba(0,0,0,0.8))'; // Fire/Ash
            case 2: return 'linear-gradient(to bottom, rgba(30,30,20,0.3), rgba(0,0,0,0.6))'; // Slum
            case 5: return 'linear-gradient(to top, rgba(255,215,0,0.1), transparent)'; // Golden glow
            default: return 'none';
        }
    };

    // NOTE: In a real production app, we would construct specific URLs here.
    // For now, we apply CSS filters to the baseImage to simulate the effect
    // without needing 20+ new image assets immediately.

    return (
        <div className={`absolute inset-0 z-0 pointer-events-none ${className}`}>
            {/* Base Image with Filters */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url('${baseImage}')`,
                    filter: getFilters(prosperityLevel)
                }}
            />

            {/* Atmosphere Overlay */}
            <div
                className="absolute inset-0 transition-all duration-1000"
                style={{ background: getOverlayGradient(prosperityLevel) }}
            />

            {/* Particle Effects (CSS only simulation) */}
            {prosperityLevel === 1 && (
                <div className="absolute inset-0 bg-[url('/effects/ash.png')] opacity-20 animate-pulse mix-blend-overlay"></div>
            )}
            {prosperityLevel === 5 && (
                <div className="absolute inset-0 bg-[url('/effects/sparkle.png')] opacity-30 animate-pulse mix-blend-screen"></div>
            )}
        </div>
    );
};
