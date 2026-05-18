import { Metadata } from 'next';
import Link from 'next/link';

/**
 * /share?t=trigger_slug&...vars
 * 
 * OGPメタデータ付きシェアランディングページ。
 * Xカードクローラーがこのページをクロールし、OGP画像を取得して
 * ツイートに号外新聞風のカード画像を表示する。
 * ユーザーがURLをクリックした場合はゲーム本体にリダイレクト案内。
 */

// テンプレートからOGP description を生成
function buildDescription(params: Record<string, string | string[] | undefined>): string {
    const trigger = (params?.t as string) || '';
    const vars: Record<string, string> = {};
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (k !== 't' && typeof v === 'string') vars[k] = v;
        }
    }

    const templates: Record<string, string> = {
        world_change: '「私が滞在する『{location}』に{description}。」',
        world_collapse: '「ついに『{location}』が崩壊の時を迎えた。黒煙が街を覆っている…。」',
        main_quest_clear: '「メインストーリー第{chapter}章『{quest_name}』を踏破した。」',
        quest_first_clear: '「依頼『{quest_name}』を達成した。この世界に足跡を残す。」',
        ugc_first_blood: '「名も無き旅人の依頼『{quest_name}』を世界で初めて踏破した。」',
        bounty_hunter_win: '「名声が地に落ち賞金首として狙われたが、刺客を返り討ちにしてやった。」',
        level_milestone: '「レベル{level}に到達。{flavor}」',
        title_tier_up: '「称号『{title}』を得た。{flavor}」',
        collection_complete: '「全ての{category}を記録した。この世界に、もはや未知はない。」',
        collection_half: '「{category}図鑑、半数を埋めた。まだ見ぬ存在が私を待っている。」',
        all_locations: '「この世界の全ての地を踏破した。20の街と村を巡り終えた旅人がここにいる。」',
        heroic_death: '「我が名は{name}。{age}歳でこの世を去り、英霊として酒場に名を残す。」',
        generation_change: '「先代の意志を継ぎ、第{generation}世代の旅人が旅路に就いた。」',
        fame_hero: '「『{location}』で英雄として讃えられている。この街の人々にとって私は伝説だ。」',
        fame_villain: '「『{location}』の住民は私の名を聞くだけで震え上がる。」',
        location_banned: '「『{location}』から追放された。この街の門は、もう開かれない。」',
        ranking_fame_1st: '「名声ランキング第1位。この世界で最も名の知れた旅人となった。」',
        ranking_alignment_1st: '「{axis}ランキング第1位。この世界で最も{flavor}存在。」',
        heroic_hire: '「酒場で出会った英霊『{name}』を仲間に迎えた。」',
        gold_milestone: '「金貨{amount}枚。この世界で、金は信用と同義だ。」',
    };

    let text = templates[trigger] || '名もなき旅人の物語';
    for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, v);
    }
    text = text.replace(/\{[^}]+\}/g, '');
    return text;
}

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const params = await searchParams;
    const description = buildDescription(params);

    // OGP画像URLを構築（同じパラメータを渡す）
    const ogParams = new URLSearchParams();
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (typeof v === 'string') ogParams.append(k, v);
        }
    }
    const ogImageUrl = `/api/og-image?${ogParams.toString()}`;

    return {
        title: '号外 | Code: Wirth-Dawn',
        description,
        openGraph: {
            title: '号外 — Code: Wirth-Dawn',
            description,
            images: [{
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: '号外 — Code: Wirth-Dawn',
            }],
            type: 'website',
            siteName: 'Code: Wirth-Dawn',
        },
        twitter: {
            card: 'summary_large_image',
            title: '号外 — Code: Wirth-Dawn',
            description,
        },
    };
}

export default async function SharePage({ searchParams }: Props) {
    const params = await searchParams;
    const description = buildDescription(params);
    const trigger = (params?.t as string) || '';

    // サブタイトル
    const subtitles: Record<string, string> = {
        world_change: '世界情勢', world_collapse: '緊急速報',
        main_quest_clear: '年代記', quest_first_clear: '冒険録',
        ugc_first_blood: '世界初踏破', bounty_hunter_win: '悪名録',
        level_milestone: '成長の証', title_tier_up: '称号昇格',
        collection_complete: '図鑑完成', collection_half: '博物学者',
        all_locations: '世界踏破', heroic_death: '英雄の最期',
        generation_change: '世代交代', fame_hero: '英雄伝',
        fame_villain: '闇の支配者', location_banned: '追放者',
        ranking_fame_1st: 'ランキング', ranking_alignment_1st: 'ランキング',
        heroic_hire: '運命の邂逅', gold_milestone: '大富豪',
    };
    const subtitle = subtitles[trigger] || '';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0d1a2e',
            padding: '20px',
        }}>
            {/* 号外カード */}
            <div style={{
                maxWidth: 600,
                width: '100%',
                backgroundColor: '#f4e4bc',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
                {/* ヘッダー */}
                <div style={{
                    backgroundColor: '#2c1810',
                    color: '#f4e4bc',
                    padding: '24px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: 36,
                        fontWeight: 900,
                        letterSpacing: '0.4em',
                        fontFamily: 'serif',
                    }}>
                        号 外
                    </div>
                    <div style={{
                        fontSize: 11,
                        opacity: 0.6,
                        letterSpacing: '0.15em',
                        marginTop: 4,
                    }}>
                        THE CODE: WIRTH-DAWN TIMES
                    </div>
                </div>

                {/* サブタイトル */}
                {subtitle && (
                    <div style={{
                        textAlign: 'center',
                        padding: '12px 24px 0',
                    }}>
                        <span style={{
                            fontSize: 14,
                            color: '#8b4513',
                            fontWeight: 700,
                            borderBottom: '1px solid #8b4513',
                            paddingBottom: 2,
                        }}>
                            {subtitle}
                        </span>
                    </div>
                )}

                {/* 本文 */}
                <div style={{
                    padding: '32px 28px',
                    textAlign: 'center',
                }}>
                    <p style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#2c1810',
                        lineHeight: 1.8,
                        fontFamily: 'serif',
                        margin: 0,
                    }}>
                        {description}
                    </p>
                </div>

                {/* 区切り線 */}
                <div style={{
                    height: 3,
                    backgroundColor: '#2c1810',
                    margin: '0 24px',
                }} />

                {/* フッター */}
                <div style={{
                    backgroundColor: '#2c1810',
                    color: '#f4e4bc',
                    padding: '12px 24px',
                    textAlign: 'center',
                    fontSize: 12,
                    opacity: 0.7,
                }}>
                    世界観測局 発行
                </div>
            </div>

            {/* CTA */}
            <Link
                href="/"
                style={{
                    marginTop: 32,
                    padding: '16px 48px',
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4e4bc 50%, #d4af37 100%)',
                    color: '#2c1810',
                    fontSize: 18,
                    fontWeight: 900,
                    borderRadius: 8,
                    textDecoration: 'none',
                    boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
                    letterSpacing: '0.1em',
                }}
            >
                ゲームを始める
            </Link>

            <p style={{
                marginTop: 16,
                color: 'rgba(255,255,255,0.4)',
                fontSize: 12,
            }}>
                Code: Wirth-Dawn — テキストRPG
            </p>
        </div>
    );
}
