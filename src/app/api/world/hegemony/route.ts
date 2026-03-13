import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 全拠点の支配国を取得する
        const { data: locations, error } = await supabase
            .from('locations')
            .select('ruling_nation_id');

        if (error || !locations) {
            console.error("Failed to fetch locations for hegemony:", error);
            // エラー時はフェイルセーフとして等分データを返す
            return NextResponse.json({
                hegemony: [
                    { name: 'ローランド', power: 25, color: 'bg-blue-600' },
                    { name: 'マーカンド', power: 25, color: 'bg-emerald-600' },
                    { name: '華龍神朝', power: 25, color: 'bg-red-600' },
                    { name: '夜刀神国', power: 25, color: 'bg-purple-700' }
                ]
            });
        }

        const totalCount = locations.length || 1;
        const counts: Record<string, number> = {
            'Roland': 0,
            'Markand': 0,
            'Karyu': 0,
            'Yato': 0,
            // 'Neutral' is grouped but we only show the 4 major nations in the bar usually.
        };

        locations.forEach(loc => {
            const nation = loc.ruling_nation_id;
            if (nation && counts[nation] !== undefined) {
                counts[nation]++;
            }
        });

        // パーセンテージ計算 (四捨五入などで合計100になるように調整)
        // 今回は単純な比率計算
        const calcPower = (nationId: string) => {
            return Math.round((counts[nationId] / totalCount) * 100);
        };

        const hegemony = [
            { name: 'ローランド', power: calcPower('Roland'), color: 'bg-blue-600' },
            { name: 'マーカンド', power: calcPower('Markand'), color: 'bg-emerald-600' },
            { name: '華龍神朝', power: calcPower('Karyu'), color: 'bg-red-600' },
            { name: '夜刀神国', power: calcPower('Yato'), color: 'bg-purple-700' }
        ];

        // 合計が100%にならない場合の補正（表示崩れ対策として最大勢力に余りを追加）
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
