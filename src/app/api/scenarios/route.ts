process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';
import { QuestService } from '@/services/questService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // Base authentication (Moved up to validate requirements)
        let userId: string | null = null;
        let locationId: string | null = null;
        
        const authHeader = req.headers.get('authorization');
        
        // [Security] JWT認証のみ — x-user-id フォールバックを廃止 (v27.1)
        if (authHeader && authHeader.trim() !== '' && authHeader !== 'Bearer' && authHeader !== 'Bearer ') {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) userId = user.id;
        }
        
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Case 1: Fetch Specific Scenario by ID (for QuestPage)
        if (id) {
            let quest: any = null;
            if (id.startsWith('colosseum_')) {
                // Compile Colosseum Scenario Dynamically
                const difficulty = id.replace('colosseum_', ''); // easy, normal, hard
                const { data: groupsData } = await supabaseServer
                    .from('colosseum_enemy_groups')
                    .select('enemy_group_slug')
                    .eq('difficulty', difficulty);

                const groupSlugs = (groupsData && groupsData.length > 0)
                    ? groupsData.map(g => g.enemy_group_slug)
                    : ['bandit_group']; // fallback

                let numBattles = 5;
                let diffLabel = 'Easy';
                let diffVal = 1;
                let rewards = { gold: 400, exp: 200, reputation: 5 };
                if (difficulty === 'normal') {
                    numBattles = 10;
                    diffLabel = 'Normal';
                    diffVal = 2;
                    rewards = { gold: 1000, exp: 400, reputation: 10 };
                } else if (difficulty === 'hard') {
                    numBattles = 10;
                    diffLabel = 'Hard';
                    diffVal = 3;
                    rewards = { gold: 2000, exp: 800, reputation: 20 };
                }

                // Compile nodes
                const nodes: Record<string, any> = {};
                nodes['start'] = {
                    next: 'battle_1',
                    text: `コロシアム (${diffLabel}) に挑戦だ！全${numBattles}戦の連続エネミーバトルとなる。勝ち抜いて豪華な報酬を掴み取るのだ！`,
                    type: 'text',
                    bg_key: 'bg_colosseum',
                    bgm: 'bgm_quest_calm',
                    bgm_key: 'bgm_quest_calm',
                    params: { bg: 'bg_colosseum', type: 'text', speaker_name: 'バルガス', bgm: 'bgm_quest_calm' },
                    choices: [],
                    speaker_name: 'バルガス'
                };

                for (let i = 1; i <= numBattles; i++) {
                    const randomGroup = groupSlugs[Math.floor(Math.random() * groupSlugs.length)];
                    nodes[`battle_${i}`] = {
                        bgm: 'bgm_battle',
                        text: `${i}戦目のバトルが開始される！`,
                        type: 'battle',
                        bg_key: 'bg_colosseum',
                        params: {
                            bg: 'bg_colosseum',
                            bgm: 'bgm_battle',
                            type: 'battle',
                            enemy_name: `対戦相手 (${i}戦目)`,
                            enemy_group_id: randomGroup
                        },
                        bgm_key: 'bgm_battle',
                        choices: [
                            { next: i === numBattles ? 'text_success' : `text_between_${i}_${i+1}`, label: 'win' },
                            { next: 'text_failure', label: 'lose' }
                        ],
                        enemy_group_id: randomGroup
                    };

                    if (i < numBattles) {
                        nodes[`text_between_${i}_${i+1}`] = {
                            next: `battle_${i+1}`,
                            text: `${i}戦目を突破した！息つく暇もなく、次の戦いが待ち受けている。`,
                            type: 'text',
                            bg_key: 'bg_colosseum',
                            bgm: 'bgm_quest_calm',
                            bgm_key: 'bgm_quest_calm',
                            params: { bg: 'bg_colosseum', type: 'text', bgm: 'bgm_quest_calm' },
                            choices: []
                        };
                    }
                }

                nodes['text_success'] = {
                    next: 'end_success',
                    text: `見事、全${numBattles}戦を勝ち抜いたぞ！お前の実力は本物だ。これが称賛のクリア報酬だ！`,
                    type: 'text',
                    bg_key: 'bg_colosseum',
                    bgm: 'bgm_quest_calm',
                    bgm_key: 'bgm_quest_calm',
                    params: { bg: 'bg_colosseum', type: 'text', speaker_name: 'バルガス', bgm: 'bgm_quest_calm' },
                    choices: [],
                    speaker_name: 'バルガス'
                };

                nodes['text_failure'] = {
                    next: 'end_failure',
                    text: `くっ、力及ばずか...。だが、この敗北を糧に強くなればいい。またの挑戦を待っているぞ。`,
                    type: 'text',
                    bg_key: 'bg_colosseum',
                    bgm: 'bgm_quest_calm',
                    bgm_key: 'bgm_quest_calm',
                    params: { bg: 'bg_colosseum', type: 'text', speaker_name: 'バルガス', bgm: 'bgm_quest_calm' },
                    choices: [],
                    speaker_name: 'バルガス'
                };

                nodes['end_success'] = {
                    text: 'コロシアム制覇！強者としての名声が高まった。',
                    type: 'end',
                    bg_key: 'bg_colosseum',
                    bgm: 'bgm_quest_calm',
                    bgm_key: 'bgm_quest_calm',
                    params: {
                        bg: 'bg_colosseum',
                        type: 'end',
                        result: 'success',
                        rewards: rewards,
                        speaker_name: 'バルガス',
                        bgm: 'bgm_quest_calm'
                    },
                    result: 'success',
                    choices: [],
                    speaker_name: 'バルガス'
                };

                nodes['end_failure'] = {
                    text: 'コロシアム敗北。悔しさを胸に、さらなる修行を積もう。',
                    type: 'end',
                    bg_key: 'bg_colosseum',
                    bgm: 'bgm_quest_calm',
                    bgm_key: 'bgm_quest_calm',
                    params: {
                        bg: 'bg_colosseum',
                        type: 'end',
                        result: 'failure',
                        speaker_name: 'バルガス',
                        bgm: 'bgm_quest_calm'
                    },
                    result: 'failure',
                    choices: [],
                    speaker_name: 'バルガス'
                };

                // Get user's location
                const { data: profile } = await supabaseServer
                    .from('user_profiles')
                    .select('current_location_id')
                    .eq('id', userId)
                    .single();

                quest = {
                    id: id,
                    slug: id,
                    title: `コロシアム (${diffLabel})`,
                    description: `全${numBattles}戦の連続エネミーバトルに勝ち残り、報酬を獲得しろ。`,
                    quest_type: 'normal',
                    requirements: {},
                    conditions: {},
                    rewards: rewards,
                    rec_level: 1,
                    difficulty: diffVal,
                    is_urgent: false,
                    client_name: 'バルガス',
                    impact: {},
                    location_id: profile?.current_location_id || null,
                    days_success: 3,
                    days_failure: 3,
                    is_ugc: false,
                    share_text: `コロシアム (${diffLabel}) を制覇しました！`,
                    script_data: {
                        nodes: nodes,
                        short_description: `コロシアム挑戦 (${diffLabel})`
                    }
                };
            } else {
                const { data: officialQuest, error } = await supabaseServer
                    .from('scenarios')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error || !officialQuest) {
                    console.log("Scenario API: Quest not found for id", id);
                    return NextResponse.json({ scenarios: [] });
                }
                quest = officialQuest;
            }

            // --- SECURITY VALIDATION ---
            // debug_bypass: 開発環境では true で有効、本番では ADMIN_SECRET_KEY 一致時のみ有効
            const debugParam = searchParams.get('debug_bypass');
            const debugBypass = debugParam === 'true'
                ? process.env.NODE_ENV === 'development'
                : debugParam === process.env.ADMIN_SECRET_KEY && !!process.env.ADMIN_SECRET_KEY;
            if (!debugBypass) {
                const validation = await QuestService.validateRequirements(supabaseServer, userId, quest.requirements);
                if (!validation.valid) {
                    console.warn(`[Security] User ${userId} blocked from scenario ${id}: ${validation.reason}`);
                    return NextResponse.json({ error: 'Quest prerequisites not met: ' + validation.reason }, { status: 403 });
                }
            } else {
                console.log(`[Debug] Bypassing requirement validation for scenario ${id} (admin bypass)`);
            }
            // ---------------------------

            console.log(`Scenario API: Fetching ID ${id}`);
            console.log(`Scenario API: Keys found:`, Object.keys(quest));
            console.log(`Scenario API: script_data type:`, typeof quest.script_data);
            if (quest.script_data) {
                console.log(`Scenario API: script_data keys:`, Object.keys(quest.script_data));
                if (quest.script_data.nodes) {
                    console.log(`Scenario API: node count:`, Object.keys(quest.script_data.nodes).length);
                }
            } else {
                console.log("Scenario API: script_data is falsy");
            }

            // Map columns if needed
            const mapped = {
                ...quest,
                reward_gold: quest.rewards?.gold || 0,
                impacts: quest.impact, // Map impact -> impacts
            };

            return NextResponse.json({ scenarios: [mapped] });
        }

        // Case 2: Fetch Available Quests by Location
        const { data: profile } = await supabaseServer
            .from('user_profiles')
            .select('current_location_id')
            .eq('id', userId)
            .single();
            
        if (profile) locationId = profile.current_location_id;

        if (!locationId) {
            return NextResponse.json({ error: 'User location not set' }, { status: 400 });
        }

        // v27.1: location_id ベースの直接クエリ（fetchAvailableQuests を廃止）
        const { data: quests, error: qErr } = await supabaseServer
            .from('scenarios')
            .select('*')
            .eq('location_id', locationId);

        if (qErr) {
            console.error("Scenario fetch error:", qErr);
            return NextResponse.json({ error: qErr.message }, { status: 500 });
        }

        const mappedQuests = (quests || []).map((q: any) => {
            const r = q.rewards || {};
            return {
                ...q,
                reward_gold: r.gold || 0,
                impacts: {
                    order: r.alignment_shift?.order || 0,
                    chaos: r.alignment_shift?.chaos || 0,
                    justice: r.alignment_shift?.justice || 0,
                    evil: r.alignment_shift?.evil || 0,
                },
                conditions: q.conditions,
                rewards: q.rewards,
                flow_nodes: q.flow_nodes
            };
        });

        return NextResponse.json({ scenarios: mappedQuests });
    } catch (err: any) {
        console.error("Quest API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
