process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * GET /api/og-image?t=trigger_slug&...vars
 * 
 * 号外新聞風のOGPカード画像を動的生成する。
 * Xシェア時にツイートカードとして表示される。
 * 画像サイズ: 1200x630 (X推奨 summary_large_image)
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const trigger = searchParams.get('t') || '';
    const description = buildDescription(trigger, searchParams);
    const subtitle = getSubtitle(trigger);

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#f4e4bc',
                    fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
                }}
            >
                {/* ─── ヘッダー: 号外 ─── */}
                <div
                    style={{
                        backgroundColor: '#2c1810',
                        color: '#f4e4bc',
                        padding: '28px 40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderBottom: '4px double rgba(244,228,188,0.3)',
                    }}
                >
                    <div
                        style={{
                            fontSize: 56,
                            fontWeight: 900,
                            letterSpacing: '0.4em',
                            marginBottom: 4,
                        }}
                    >
                        号 外
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            opacity: 0.6,
                            letterSpacing: '0.2em',
                        }}
                    >
                        THE CODE: WIRTH-DAWN TIMES — WORLD EXTRA EDITION
                    </div>
                </div>

                {/* ─── サブタイトル ─── */}
                {subtitle && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: '12px 40px 0',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 16,
                                color: '#8b4513',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                borderBottom: '1px solid #8b4513',
                                paddingBottom: 4,
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>
                )}

                {/* ─── 本文 ─── */}
                <div
                    style={{
                        flex: 1,
                        padding: '32px 60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: 36,
                            fontWeight: 700,
                            color: '#2c1810',
                            textAlign: 'center',
                            lineHeight: 1.7,
                            maxWidth: '90%',
                        }}
                    >
                        {description}
                    </div>
                </div>

                {/* ─── 装飾線 ─── */}
                <div
                    style={{
                        height: 4,
                        backgroundColor: '#2c1810',
                        marginLeft: 40,
                        marginRight: 40,
                        display: 'flex',
                    }}
                />

                {/* ─── フッター ─── */}
                <div
                    style={{
                        backgroundColor: '#2c1810',
                        color: '#f4e4bc',
                        padding: '16px 40px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 16,
                    }}
                >
                    <div style={{ opacity: 0.7 }}>
                        世界観測局 発行
                    </div>
                    <div style={{ opacity: 0.5, fontSize: 14 }}>
                        code-wirth-dawn.com
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}

/**
 * trigger_slug + URLパラメータからOGP表示用テキストを構築
 */
function buildDescription(trigger: string, params: URLSearchParams): string {
    // 主要テンプレートのサーバーサイド展開（CSV読込はEdge非対応のためインライン）
    const vars: Record<string, string> = {};
    params.forEach((v, k) => {
        if (k !== 't') vars[k] = v;
    });

    const templates: Record<string, string> = {
        world_change: '『{location}』に{description}',
        world_collapse: 'ついに『{location}』が崩壊の時を迎えた',
        main_quest_clear: 'メインストーリー第{chapter}章『{quest_name}』を踏破した',
        quest_first_clear: '依頼『{quest_name}』を達成した',
        ugc_first_blood: '『{quest_name}』を世界で初めて踏破した',
        bounty_hunter_win: '賞金首として狙われたが、刺客を返り討ちにした',
        level_milestone: 'レベル{level}に到達。{flavor}',
        title_tier_up: '称号『{title}』を得た。{flavor}',
        collection_complete: '全ての{category}を記録した',
        collection_half: '{category}図鑑、半数を埋めた',
        all_locations: 'この世界の全ての地を踏破した',
        heroic_death: '{name}。{age}歳でこの世を去り、英霊となった',
        generation_change: '第{generation}世代の旅人が旅路に就いた',
        fame_hero: '『{location}』で英雄として讃えられている',
        fame_villain: '『{location}』の住民は震え上がる',
        location_banned: '『{location}』から追放された',
        ranking_fame_1st: '名声ランキング第1位',
        ranking_alignment_1st: '{axis}ランキング第1位',
        heroic_hire: '英霊『{name}』を仲間に迎えた',
        gold_milestone: '金貨{amount}枚を蓄えた',
    };

    let text = templates[trigger] || trigger || '名もなき旅人の記録';
    for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, v);
    }
    // 未置換のテンプレ変数をクリーンアップ
    text = text.replace(/\{[^}]+\}/g, '');
    return text;
}

/**
 * trigger_slugからサブタイトルを取得
 */
function getSubtitle(trigger: string): string {
    const subtitles: Record<string, string> = {
        world_change: '世界情勢',
        world_collapse: '緊急速報',
        main_quest_clear: '年代記',
        quest_first_clear: '冒険録',
        ugc_first_blood: '世界初踏破',
        bounty_hunter_win: '悪名録',
        level_milestone: '成長の証',
        title_tier_up: '称号昇格',
        collection_complete: '図鑑完成',
        collection_half: '博物学者',
        all_locations: '世界踏破',
        heroic_death: '英雄の最期',
        generation_change: '世代交代',
        fame_hero: '英雄伝',
        fame_villain: '闇の支配者',
        location_banned: '追放者',
        ranking_fame_1st: 'ランキング',
        ranking_alignment_1st: 'ランキング',
        heroic_hire: '運命の邂逅',
        gold_milestone: '大富豪',
    };
    return subtitles[trigger] || '';
}
