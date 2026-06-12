import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NATIONS, DEFAULT_HEGEMONY } from '@/constants/nations';

export async function GET() {
    try {
        // v27.0: world_states.controlling_nation を使用（ruling_nation_id は初期値のため非同期）
        const { data: states, error } = await supabase
            .from('world_states')
            .select('controlling_nation');

        if (error || !states) {
            console.error("Failed to fetch world_states for hegemony:", error);
            return NextResponse.json({ hegemony: DEFAULT_HEGEMONY });
        }

        // Exclude Neutral hub from total counts and distribution
        const activeStates = states.filter(s => s.controlling_nation !== 'Neutral');
        const totalCount = activeStates.length || 1;
        const counts: Record<string, number> = {};
        NATIONS.forEach(n => { counts[n.id] = 0; });

        activeStates.forEach(s => {
            const nation = s.controlling_nation;
            if (nation && counts[nation] !== undefined) {
                counts[nation]++;
            }
        });

        const hegemony = NATIONS.map(n => ({
            name: n.nameShort,
            power: Math.round((counts[n.id] / totalCount) * 100),
            locations: counts[n.id],
            color: n.color,
        }));

        // 合計が100%にならない場合の補正
        const totalPower = hegemony.reduce((acc, curr) => acc + curr.power, 0);
        if (totalPower !== 100 && totalPower > 0) {
            const diff = 100 - totalPower;
            const maxIdx = hegemony.reduce((maxI, curr, i, arr) => curr.power > arr[maxI].power ? i : maxI, 0);
            hegemony[maxIdx].power += diff;
        }

        return NextResponse.json({ hegemony });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
