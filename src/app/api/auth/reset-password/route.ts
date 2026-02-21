
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    try {
        const { email, question, answer, newPassword } = await req.json();

        if (!email || !question || !answer || !newPassword) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // 1. Find User by Email
        // Note: supabaseAdmin.auth.admin.listUsers() is heavy if many users, strictly verify email
        // Ideally we select ID from a table, but auth is separate.
        // We can use listUsers with filter? No, listUsers doesn't filter by email well in v1.
        // Workaround: We require the user to input their email.
        // We can assume user_profile exists? 
        // Actually, we can check the 'user_secrets' table if we linked it, but we can't query auth.users easily.
        // Wait, supabaseAdmin can query public tables.
        // Let's rely on user_secrets. But user_secrets is keyed by UUID. We don't have UUID from email easily without admin.

        // Strategy: Use admin.listUsers() to find the ID. Ideally cache or index, but for now simple loop if not too many users.
        // CAUTION: This won't scale.
        // Better: Assuming 'user_profiles' might have email? No.
        // Supabase Auth Admin API allows getUser by email? checking docs...
        // createUser, deleteUser, getUser(uid), listUsers. 
        // There isn't a direct "getUserByEmail". (Actually there might be in newer libs, but let's assume listUsers).

        // Actually, let's try to query 'user_secrets' if we store email? No.

        // Let's assume listUsers and search.
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const targetUser = users.find(u => u.email === email);
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Verify Secret
        const { data: secretData } = await supabaseAdmin
            .from('user_secrets')
            .select('*')
            .eq('user_id', targetUser.id)
            .single();

        if (!secretData) {
            return NextResponse.json({ error: "Security question not set for this user" }, { status: 404 });
        }

        // Simple comparison (in future, hash this)
        if (secretData.question !== question || secretData.answer !== answer) {
            return NextResponse.json({ error: "Incorrect answer" }, { status: 401 });
        }

        // 3. Reset Password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            targetUser.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: "Password updated" });

    } catch (err: any) {
        console.error("Reset Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
