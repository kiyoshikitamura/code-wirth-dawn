import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        console.log(`[DEBUG] Initiating hard reset for user: ${userId}`);

        // 1. Delete associated inventory
        const { error: invError } = await supabaseService
            .from('inventory')
            .delete()
            .eq('user_id', userId);
        if (invError) console.error("Error deleting inventory:", invError);

        // 2. Delete associated party members
        const { error: partyError } = await supabaseService
            .from('party_members')
            .delete()
            .eq('owner_id', userId);
        if (partyError) console.error("Error deleting party members:", partyError);

        // 3. Delete associated hub states
        const { error: hubError } = await supabaseService
            .from('user_hub_states')
            .delete()
            .eq('user_id', userId);
        if (hubError) console.error("Error deleting hub states:", hubError);

        // 4. Finally, delete the user profile
        const { error: profileError } = await supabaseService
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error("Error deleting profile:", profileError);
            throw profileError;
        }

        return NextResponse.json({ success: true, message: `All data for user ${userId} has been deleted.` });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
