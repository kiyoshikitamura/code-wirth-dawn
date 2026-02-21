import { TRAVEL_ROUTES } from '@/config/travel_data';

export interface Coordinate {
    x?: number;
    y?: number;
    id?: string;
    slug?: string;
    name?: string;
}

/**
 * Calculates travel days using Master Route Data.
 * Fallback to distance logic if no route found (optional safety).
 */
export function calculateTravelDays(from: Coordinate, to: Coordinate): number {
    // 1. Try direct route (Bidirectional)
    const route = TRAVEL_ROUTES.find(r =>
        (r.from === from.slug && r.to === to.slug) ||
        (r.from === to.slug && r.to === from.slug)
    );

    if (route) return route.days;

    // 2. Try Name matching (Legacy support)
    // Some contexts might only have name? Ideally we use slug.

    // 3. Fallback: Distance based (Legacy)
    // Only if x,y exist
    if (typeof from.x === 'number' && typeof to.x === 'number') {
        const dist = Math.sqrt(Math.pow((to.x!) - (from.x!), 2) + Math.pow((to.y!) - (from.y!), 2));
        return Math.max(1, Math.ceil(dist * 0.05));
    }

    return 3; // Safe default
}
