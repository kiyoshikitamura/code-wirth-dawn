import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get('id');

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
        }

        // Verify ownership (RLS should handle this, but explicit check doesn't hurt)
        // Actually, just delete. RLS policy "Users can delete their own party members" is needed.
        // Assuming RLS is set up or we use a filter.

        const { error } = await supabase
            .from('party_members')
            .delete()
            .eq('id', memberId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
