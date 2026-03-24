import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/migrate-scenarios
 * 
 * scenariosテーブルにUGC関連カラムを追加する一時的なmigrationエンドポイント。
 * ADMIN_SECRET_KEY認証必須。実行後に削除すること。
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    
    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!serviceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const results: any[] = [];

    // Test: Check current columns
    const { data: testData, error: testErr } = await supabase
        .from('scenarios')
        .select('id')
        .limit(1);
    
    results.push({ test: 'select_test', data: testData, error: testErr?.message });

    // Try inserting a test row with full_description to see if column exists
    const { error: colCheck } = await supabase
        .from('scenarios')
        .select('full_description')
        .limit(1);
    
    results.push({ test: 'full_description_check', exists: !colCheck, error: colCheck?.message });

    // Try inserting a test row with creator_id
    const { error: creatorCheck } = await supabase
        .from('scenarios')
        .select('creator_id')
        .limit(1);
    
    results.push({ test: 'creator_id_check', exists: !creatorCheck, error: creatorCheck?.message });

    // Try inserting a test row with status
    const { error: statusCheck } = await supabase
        .from('scenarios')
        .select('status')
        .limit(1);
    
    results.push({ test: 'status_check', exists: !statusCheck, error: statusCheck?.message });

    // Try inserting a test row with short_description
    const { error: shortDescCheck } = await supabase
        .from('scenarios')
        .select('short_description')
        .limit(1);
    
    results.push({ test: 'short_description_check', exists: !shortDescCheck, error: shortDescCheck?.message });

    // Get a list of all columns from a full select
    const { data: sampleRow, error: sampleErr } = await supabase
        .from('scenarios')
        .select('*')
        .limit(1)
        .single();
    
    results.push({ 
        test: 'all_columns', 
        columns: sampleRow ? Object.keys(sampleRow) : [], 
        error: sampleErr?.message 
    });

    return NextResponse.json({ results });
}
