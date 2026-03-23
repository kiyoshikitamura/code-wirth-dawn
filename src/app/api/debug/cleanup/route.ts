import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';

function getValidSlugs(filename: string): Set<string> {
    const filePath = path.join(process.cwd(), 'src', 'data', 'csv', filename);
    if (!fs.existsSync(filePath)) return new Set();
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
    return new Set(records.map((r: any) => r.slug).filter(Boolean));
}

function getValidIds(filename: string): Set<number> {
    const filePath = path.join(process.cwd(), 'src', 'data', 'csv', filename);
    if (!fs.existsSync(filePath)) return new Set();
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
    return new Set(records.map((r: any) => Number(r.id)).filter(Boolean));
}

export async function POST(req: Request) {
    if (!hasServiceKey || !supabaseAdmin) {
        return NextResponse.json({ error: 'Service Role Key is missing.' }, { status: 500 });
    }

    try {
        const deletedStats: any = {};

        // 1. Clean Scenarios
        const validNormalQuests = getValidSlugs('quests_normal.csv');
        const validSpecialQuests = getValidSlugs('quests_special.csv');
        const validScenarios = new Set([...validNormalQuests, ...validSpecialQuests]);
        
        const { data: allScenarios } = await supabaseAdmin.from('scenarios').select('slug');
        if (allScenarios) {
            const slugsToDelete = allScenarios.map(s => s.slug).filter(slug => !validScenarios.has(slug) && slug !== 'main_ep00');
            if (slugsToDelete.length > 0) {
                const { error, count } = await supabaseAdmin.from('scenarios').delete().in('slug', slugsToDelete);
                deletedStats.scenarios = count || slugsToDelete.length;
            }
        }

        // 2. Clean Items
        const validItemIds = getValidIds('items.csv');
        const { data: allItems } = await supabaseAdmin.from('items').select('id');
        if (allItems) {
            const idsToDelete = allItems.map(i => i.id).filter(id => !validItemIds.has(id));
            if (idsToDelete.length > 0) {
                const { error, count } = await supabaseAdmin.from('items').delete().in('id', idsToDelete);
                deletedStats.items = count || idsToDelete.length;
            }
        }

        // 3. Clean Enemies
        const validEnemyIds = getValidIds('enemies.csv');
        const { data: allEnemies } = await supabaseAdmin.from('enemies').select('id');
        if (allEnemies) {
            const idsToDelete = allEnemies.map(e => e.id).filter(id => !validEnemyIds.has(id));
            if (idsToDelete.length > 0) {
                const { error, count } = await supabaseAdmin.from('enemies').delete().in('id', idsToDelete);
                deletedStats.enemies = count || idsToDelete.length;
            }
        }

        // 4. Clean NPCs
        const validNpcSlugs = getValidSlugs('npcs.csv');
        validNpcSlugs.add('npc_guest_gawain');
        validNpcSlugs.add('npc_guest_volg');
        validNpcSlugs.add('npc_guest_shadow');

        const { data: allNpcs } = await supabaseAdmin.from('npcs').select('slug');
        if (allNpcs) {
            const slugsToDelete = allNpcs.map(n => n.slug).filter(slug => !validNpcSlugs.has(slug));
            if (slugsToDelete.length > 0) {
                const { error, count } = await supabaseAdmin.from('npcs').delete().in('slug', slugsToDelete);
                deletedStats.npcs = count || slugsToDelete.length;
            }
        }

        const { data: allPartyMembers } = await supabaseAdmin.from('party_members').select('slug').eq('origin_type', 'system');
        if (allPartyMembers) {
            const slugsToDelete = allPartyMembers.map(n => n.slug).filter(slug => !validNpcSlugs.has(slug));
            if (slugsToDelete.length > 0) {
                const { error, count } = await supabaseAdmin.from('party_members').delete().in('slug', slugsToDelete);
                deletedStats.party_members = count || slugsToDelete.length;
            }
        }

        return NextResponse.json({ success: true, deletedStats });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
