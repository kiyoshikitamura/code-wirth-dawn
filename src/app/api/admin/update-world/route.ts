import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { WorldState } from '@/types/game';
import { WORLD_ID } from '@/utils/constants';
import { getBackgroundByAttribute } from '@/utils/visuals';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // In a real app, this would be triggered by a scheduled job or admin action.
        // Here we simulate a recalculation request or handle direct updates.
        const { id = WORLD_ID, location_name = '名もなき旅人の拠所', impacts = {} } = await req.json();

        // 1. Fetch current scores (Simulated or from DB)
        // Ideally we aggregate action_logs, but let's assume we update the world_state table directly for this prototype.
        // For this endpoint, let's say we are "Initializing" or "Forcing" a state, or re-calculating based on existing columns.

        // Let's fetch current state first to mock calculation if needed, 
        // or just generate random/default values if they are 0.
        // 1. Fetch current scores
        // 0. Ensure Location Exists (Foreign Key Requirement)
        // If location_name is not in 'locations' table, we cannot insert into 'world_states' due to FK.
        // For auto-init, we might need to create a dummy location if it's truly new?
        // Or strictly fail. But '名もなき旅人の拠所' should exist from setup.

        // Let's check if location exists
        const { data: locData, error: locCheckError } = await supabase
            .from('locations')
            .select('id')
            .eq('name', location_name)
            .maybeSingle();

        if (!locData) {
            console.warn(`[UpdateWorld] Location '${location_name}' missing! Creating default entry...`);
            // Create default location entry to satisfy FK
            const { error: locInsertError } = await supabase
                .from('locations')
                .insert([{
                    name: location_name,
                    x: 500, y: 500,
                    type: 'Field',
                    description: 'Auto-generated location.'
                }]);
            if (locInsertError) {
                console.error("Failed to create missing location:", locInsertError);
                return NextResponse.json({ error: "Invalid Location and Auto-create failed" }, { status: 400 });
            }
        }

        // 1. Get Current State (for history diff)
        const { data: currentState } = await supabase
            .from('world_states')
            .select('*')
            .eq('location_name', location_name)
            .maybeSingle();

        // 2. Calculate New State (Simple Delta Application)
        const currentOrder = currentState?.order_score ?? 10;
        const currentChaos = currentState?.chaos_score ?? 10;
        const currentJustice = currentState?.justice_score ?? 10;
        const currentEvil = currentState?.evil_score ?? 10;

        // impacts is already parsed from the top

        let newOrder = Math.max(0, currentOrder + (impacts?.order || 0));
        let newChaos = Math.max(0, currentChaos + (impacts?.chaos || 0));
        let newJustice = Math.max(0, currentJustice + (impacts?.justice || 0));
        let newEvil = Math.max(0, currentEvil + (impacts?.evil || 0));

        // ... (Status/Attribute Logic) ...
        const totalScore = newOrder + newChaos + newJustice + newEvil;
        const status = totalScore > 100 ? '崩壊' : (totalScore < 20 ? '衰退' : '繁栄');

        // Determine Attribute (Simple Max)
        // Determine Attribute (Simple Max)
        const scores = { '至高の平穏': newOrder, '自由なる活気': newChaos, '鉄の規律': newJustice, '血塗られた混迷': newEvil };
        // Determine primary attribute name
        let attribute_name = '至高の平穏';
        let maxVal = -1;
        if (newOrder > maxVal) { maxVal = newOrder; attribute_name = '至高の平穏'; }
        if (newChaos > maxVal) { maxVal = newChaos; attribute_name = '自由なる活気'; }
        if (newJustice > maxVal) { maxVal = newJustice; attribute_name = '鉄の規律'; }
        if (newEvil > maxVal) { maxVal = newEvil; attribute_name = '血塗られた混迷'; }

        // --- Territory Control Logic ---
        // Nation Archetypes
        // --- 領土支配ロジック ---
        // DBから国家を取得
        const { data: nationsData } = await supabase.from('nations').select('*');
        const NATIONS: Record<string, { order: number, chaos: number, justice: number, evil: number }> = {};
        const NATIONS_TARGETS: Record<string, { key: string, ideal: number }> = {};

        if (nationsData) {
            nationsData.forEach(n => {
                NATIONS[n.id] = {
                    order: n.ideal_order,
                    chaos: n.ideal_chaos,
                    justice: n.ideal_justice,
                    evil: n.ideal_evil
                };

                // 摩擦ロジックのための主要な理想を決定 (簡略化: 最大値がターゲットキー)
                let maxVal = -1;
                let maxKey = 'order';
                if (n.ideal_order > maxVal) { maxVal = n.ideal_order; maxKey = 'order'; }
                if (n.ideal_chaos > maxVal) { maxVal = n.ideal_chaos; maxKey = 'chaos'; }
                if (n.ideal_justice > maxVal) { maxVal = n.ideal_justice; maxKey = 'justice'; }
                if (n.ideal_evil > maxVal) { maxVal = n.ideal_evil; maxKey = 'evil'; }

                NATIONS_TARGETS[n.id] = { key: maxKey, ideal: 100 }; // とりあえず理想は100デフォルト
            });
        }

        // 支配国の決定
        const { data: loc } = await supabase.from('locations').select('type, nation_id').eq('name', location_name).single();
        let controlling_nation = currentState?.controlling_nation || loc?.nation_id || 'Neutral';

        // 首都はサイドを変更しない。その他は最も近いアーキタイプにシフトする。
        if (loc?.type !== 'Capital') {
            let minDist = Infinity;
            let closest = controlling_nation;

            for (const [nation, arch] of Object.entries(NATIONS)) {
                // 4次元アライメント空間でのユークリッド距離
                const dist = Math.sqrt(
                    Math.pow(newOrder - arch.order, 2) +
                    Math.pow(newChaos - arch.chaos, 2) +
                    Math.pow(newJustice - arch.justice, 2) +
                    Math.pow(newEvil - arch.evil, 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    closest = nation;
                }
            }
            controlling_nation = closest;
        }

        // API更新用のV4ロジック
        // 新しい支配国に基づいて摩擦を計算 (変更がない場合は現在の支配国)
        let targetControllingNation = controlling_nation;

        // NATIONS_TARGETS はDBから上記ですでに生成済み
        // ハードコードされた定義を削除


        const target = NATIONS_TARGETS[targetControllingNation];
        let friction = 0;
        let prosperity_level = currentState?.prosperity_level || 4;

        if (target) {
            // Map 'order' to 'newOrder' variable name etc.
            const values = { 'order': newOrder, 'chaos': newChaos, 'justice': newJustice, 'evil': newEvil };
            const currentVal = values[target.key as keyof typeof values] || 0;
            friction = Math.abs(target.ideal - currentVal);

            // Recalculate level based on friction immediately? Or leave it for batch?
            // Let's recalculate immediately for feedback.
            // But we don't have existing friction trend history here for "slow moving".
            // Let's stick to the rule: Friction determines Target Level.
            // If forcing update via API, maybe we jump to Target Level or move 1 step?
            // Let's move 1 step.

            let targetLevel = 3;
            if (friction <= 20) targetLevel = 5;
            else if (friction <= 50) targetLevel = 4;
            else if (friction <= 80) targetLevel = 2;
            else targetLevel = 1;

            if (prosperity_level < targetLevel) prosperity_level++;
            else if (prosperity_level > targetLevel) prosperity_level--;
        }

        // 3. Upsert World State
        const { data: updatedState, error: updateError } = await supabase
            .from('world_states')
            .upsert({
                location_name,
                order_score: newOrder,
                chaos_score: newChaos,
                justice_score: newJustice,
                evil_score: newEvil,
                status,
                attribute_name,
                controlling_nation,
                prosperity_level, // V4
                last_friction_score: friction, // V4
                updated_at: new Date().toISOString()
            }, { onConflict: 'location_name' })
            .select()
            .single();

        if (updateError) throw updateError;

        // NOTE: The new code snippet removed the calculation of `flavor_text` and `background_url`.
        // For the history generation below, `flavor_text` is still used.
        // To make the code syntactically correct and functional, I'll re-introduce a placeholder for `flavor_text`
        // and `background_url` based on the new `attribute_name` logic, similar to the original code's intent.
        let flavor_text = '';
        switch (attribute_name) {
            case '至高の平穏': flavor_text = '犯罪はなく、法が守られた平和な世界。人々は安寧の中で暮らしている。'; break;
            case '自由なる活気': flavor_text = '荒っぽいが、人々の善意と活気に満ちた世界。自由の風が吹いている。'; break;
            case '鉄の規律': flavor_text = '圧政により静まり返った、冷徹な秩序。息苦しいほどの静寂が支配する。'; break;
            case '血塗られた混迷': flavor_text = '略奪と暴力が支配する、救いのない暗黒。弱き者に居場所はない。'; break;
            default: flavor_text = '世界の情勢が変化しています。'; break;
        }
        const background_url = getBackgroundByAttribute(attribute_name);

        // 4. World History & Headline Generation
        // Only record if Status or Attribute CHANGED, or if it's a significant update
        // For prototype, let's record if they are different from 'currentState'
        const oldStatus = currentState?.status;
        const oldAttribute = currentState?.attribute_name;

        if (status !== oldStatus || attribute_name !== oldAttribute || !currentState) {
            let headline = '世界の情勢が変化';

            if (status === '崩壊' && oldStatus !== '崩壊') {
                headline = '拠所、陥落す';
            } else if (status === '繁栄' && oldStatus === '崩壊') {
                headline = '希望の光、再び';
            } else if (attribute_name !== oldAttribute) {
                // Formatting based on new attribute
                switch (attribute_name) {
                    case '至高の平穏': headline = '恒久の平和、到来す'; break;
                    case '自由なる活気': headline = '喧騒と自由の幕開け'; break;
                    case '鉄の規律': headline = '静寂なる統制の始まり'; break;
                    case '血塗られた混迷': headline = '混沌、世界を覆う'; break;
                    default: headline = '世界に変革の兆し'; break;
                }
            }

            // Insert History
            // NOTE: User DB schema does not have score columns in world_history.
            // We only record text changes.
            const historyEntry = {
                location_name: location_name, // Using location_name as FK-like reference
                headline: headline,
                news_content: flavor_text, // Use flavor text as content
                old_status: oldStatus || null,
                new_status: status,
                old_attribute: oldAttribute || null,
                new_attribute: attribute_name,
                // occured_at defaults to NOW()
            };

            const { error: histError } = await supabase
                .from('world_history')
                .insert([historyEntry]);

            if (histError) console.error("History Insert Failed:", histError);
        }

        return NextResponse.json({ success: true, state: updatedState });
    } catch (err: any) {
        console.error("[API/UpdateWorld] Critical Error:", err);
        return NextResponse.json({
            error: err.message,
            details: err,
        }, { status: 500 });
    }
}
