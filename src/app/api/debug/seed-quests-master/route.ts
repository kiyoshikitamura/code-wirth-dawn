import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';

const parseRewards = (summary?: string) => {
    const rewards: any = { gold: 0, items: [] };
    if (!summary) return rewards;
    const rews = summary.split('|');
    rews.forEach((rew: string) => {
        const [type, val] = rew.split(':');
        if (type === 'Gold') rewards.gold = parseInt(val, 10);
        else if (type === 'Item') rewards.items.push(parseInt(val, 10));
        else if (type === 'Rep') rewards.reputation = parseInt(val, 10);
        else if (['Order', 'Chaos', 'Justice', 'Evil'].includes(type)) {
            if (!rewards.alignment_shift) rewards.alignment_shift = {};
            rewards.alignment_shift[type.toLowerCase()] = parseInt(val, 10);
        } else if (type === 'Vitality') rewards.vitality_cost = parseInt(val, 10);
        else if (type === 'NPC') rewards.npc_reward = parseInt(val, 10);
        else if (type === 'Move' || type === 'move_to') rewards.move_to = val;
    });
    return rewards;
};

export async function GET(request: Request) {
    if (process.env.VERCEL_ENV === 'production') {
        return NextResponse.json(
            { error: 'Debug routes are not available in production' },
            { status: 403 }
        );
    }

    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!serviceKey) {
        return NextResponse.json({ error: 'No Service Key' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const csvDir = path.join(process.cwd(), 'src', 'data', 'csv');
    const files = [
        { name: 'quests.csv', type: 'main' },
        { name: 'quests_normal.csv', type: 'normal' },
        { name: 'quests_special.csv', type: 'special' }
    ];
    const results = [];

    for (const f of files) {
        const filePath = path.join(csvDir, f.name);
        if (!fs.existsSync(filePath)) continue;

        const csvText = fs.readFileSync(filePath, 'utf-8');
        const records = parse(csvText, { columns: true, skip_empty_lines: true }) as any[];

        for (const row of records) {
            const id = parseInt(row.id, 10);
            if (isNaN(id)) continue;

            // Parse requirements & conditions
            let requirements: any = {};
            let conditions: any = {};
            if (f.type === 'special' && row.requirements) {
                try {
                    requirements = JSON.parse(row.requirements);
                    conditions = JSON.parse(row.requirements);
                } catch (e) {
                    console.warn(`[SeedQuests] Invalid JSON in requirements for ${row.slug}:`, row.requirements);
                }
            }

            // Parse rewards
            const rewards = parseRewards(row.rewards_summary);

            // Parse location_tags
            let location_tags: string[] = [];
            if (f.type === 'normal' && row.location_tags) {
                location_tags = row.location_tags.split('|').map((t: string) => t.trim());
            }

            const upsertData = {
                id,
                slug: row.slug,
                title: row.title,
                quest_type: f.type,
                rec_level: parseInt(row.rec_level, 10) || 1,
                difficulty: parseInt(row.difficulty, 10) || 1,
                time_cost: parseInt(row.time_cost, 10) || 1,
                is_urgent: row.is_urgent === 'true' || row.is_urgent === true,
                client_name: row.client_name || 'Unknown',
                description: row._comment || row.title,
                requirements,
                conditions,
                rewards,
                location_tags
            };

            const { error } = await supabase.from('scenarios').upsert(upsertData, { onConflict: 'id' });
            if (error) {
                results.push({ id, error: error.message });
            } else {
                results.push({ id, status: 'success' });
            }
        }
    }

    return NextResponse.json({ success: true, processed: results.length, errors: results.filter(r => r.error) });
}
