import { NextResponse } from 'next/server';
import { PartyService } from '@/services/partyService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const owner_id = searchParams.get('owner_id');

        if (!owner_id) {
            return NextResponse.json({ error: 'Missing owner_id' }, { status: 400 });
        }

        const enrichedParty = await PartyService.getEnrichedPartyMembers(owner_id);
        return NextResponse.json({ party: enrichedParty });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
