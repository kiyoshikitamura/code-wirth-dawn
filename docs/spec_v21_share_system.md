# Spec v21: 号外シェアシステム

## 1. 概要

プレイヤーの重要なゲーム体験をX(Twitter)でシェアする「号外」システムの拡張仕様。
全20種のトリガーを定義し、CSV駆動のテンプレートテキスト + OGP動的画像カード付きシェアを実現する。

## 2. アーキテクチャ

```
[ゲーム内トリガー] → [APIで share_data 生成] → [フロントで XShareButton 表示]
                                                         ↓
                                              [X intent/tweet?text=...&url=...]
                                                         ↓
                                              [/share?t=slug&vars... ページ]
                                                 ├── OGメタデータ (generateMetadata)
                                                 └── OGP画像 (/api/og-image?t=...)
                                                         ↓
                                              [Xカードクローラーが画像取得]
                                                         ↓
                                              [タイムラインに号外カード表示]
```

### 2.1 CSV駆動テンプレート

- `src/data/csv/share_texts.csv`: トリガー別テンプレート + ハッシュタグ
- `src/data/csv/share_flavors.csv`: レベル/称号Tier/カテゴリ別フレーバー
- `src/lib/shareTextLoader.ts`: CSV読み込み + テンプレート変数展開

### 2.2 OGP画像 (Edge Runtime)

- `/api/og-image?t=slug&vars...`: 1200x630の号外新聞風カード画像
- Next.js `ImageResponse` でサーバーサイド生成
- 号外ヘッダー + サブタイトル + 本文 + フッター

### 2.3 シェアランディングページ

- `/share?t=slug&vars...`: OGメタデータ付きページ
- アクセス時はゲーム本体への導線を表示
- `twitter:card = summary_large_image` で大型画像カード

## 3. 全20種トリガー定義

| # | slug | 名称 | 回数性 | 発火箇所 |
|:-:|:---|:---|:---:|:---|
| 1 | world_change | 世界情勢変動 | 繰返 | world-simulation.ts |
| 2 | world_collapse | 拠点崩壊 | 繰返 | world-simulation.ts |
| 3 | main_quest_clear | メイン章クリア | キャラ1回 | quest/complete |
| 4 | quest_first_clear | クエスト初回 | 世代1回 | quest/complete |
| 5 | ugc_first_blood | UGC初踏破 | 1回 | quest/complete |
| 6 | bounty_hunter_win | 賞金稼ぎ撃退 | 繰返 | move/encounter-result |
| 7 | level_milestone | Lv節目 (10,20,30,40,50) | 世代1回 | quest/complete |
| 8 | title_tier_up | 称号Tier昇格 | 世代1回 | profile, report-action |
| 9 | collection_complete | 図鑑完成 | 1回 | bestiary/item/skills |
| 10 | collection_half | 図鑑半数 | キャラ1回 | bestiary/item/skills |
| 11 | all_locations | 全拠点制覇 | 世代1回 | move |
| 12 | heroic_death | 英霊化 | 繰返 | character/retire |
| 13 | generation_change | 世代継承 | 繰返 | profile/init |
| 14 | fame_hero | 英雄(名声+200) | 繰返 | quest/complete |
| 15 | fame_villain | 犯罪王(名声-200) | 繰返 | quest/complete |
| 16 | location_banned | 拠点追放 | 繰返 | quest/complete |
| 17 | ranking_fame_1st | 名声R1位 | 繰返 | RankingModal(フロント) |
| 18 | ranking_alignment_1st | アラインR1位 | 繰返 | RankingModal(フロント) |
| 19 | heroic_hire | 英霊雇用 | 繰返 | tavern/hire |
| 20 | gold_milestone | 金10万 | 世代1回 | quest/complete |

## 4. 重複防止テーブル

```sql
CREATE TABLE user_share_triggers (
    user_id UUID NOT NULL,
    trigger_slug TEXT NOT NULL,
    trigger_key TEXT NOT NULL DEFAULT '',
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, trigger_slug, trigger_key)
);
```

| 回数性 | 動作 | 世代交代時 |
|:---|:---|:---|
| 1回 | INSERT → 2回目以降は発火しない | 維持 |
| キャラ1回 | INSERT → 2回目以降は発火しない | 維持 |
| 世代1回 | INSERT → 2回目以降は発火しない | DELETE |
| 繰返 | INSERT不要 | — |

PERSISTENT_TRIGGERS（世代交代で維持）:
- `main_quest_clear` (キャラ1回)
- `collection_half` (キャラ1回)
- `collection_complete` (1回)

## 5. 訪問記録テーブル

```sql
CREATE TABLE user_visited_locations (
    user_id UUID NOT NULL,
    location_id UUID NOT NULL,
    first_visited_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, location_id)
);
```

## 6. APIレスポンス統一フォーマット

```json
{
  "share_text": "後方互換（最優先テキスト）",
  "share_data_list": [
    {
      "text": "完成テキスト + ハッシュタグ",
      "slug": "level_milestone",
      "vars": { "level": "30", "flavor": "もはや駆け出しではない。" }
    }
  ]
}
```

フロント側でシェアURL構築:
```typescript
const shareUrl = `${origin}/share?t=${sd.slug}&${new URLSearchParams(sd.vars)}`;
```

## 7. 世代交代フロー

`lifeCycleService.processInheritance()` で以下を実行:
1. `user_visited_locations` を全DELETE
2. `user_share_triggers` から PERSISTENT_TRIGGERS 以外を DELETE
3. 通常の継承処理（gold, 名声, 形見）

## 8. 関連ファイル

### 新規
- `src/data/csv/share_texts.csv`
- `src/data/csv/share_flavors.csv`
- `src/app/api/og-image/route.tsx`
- `src/app/share/page.tsx`
- `src/lib/shareTextLoader.ts`
- `src/lib/shareUtils.ts`
- `supabase/migrations/20260515073000_share_system_tables.sql`

### 改修
- `src/components/shared/XShareButton.tsx` (shareUrl prop追加)
- `src/app/api/quest/complete/route.ts` (#3,4,5,7,14,15,16,20)
- `src/app/api/profile/route.ts` (#8)
- `src/app/api/report-action/route.ts` (#8)
- `src/app/api/move/route.ts` (#11)
- `src/app/api/move/encounter-result/route.ts` (#6)
- `src/app/api/character/retire/route.ts` (#12)
- `src/app/api/profile/init/route.ts` (#13)
- `src/app/api/tavern/hire/route.ts` (#19)
- `src/app/api/profile/reset/route.ts` (新テーブルクリア)
- `src/services/lifeCycleService.ts` (世代交代リセット)
