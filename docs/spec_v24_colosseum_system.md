# spec_v24: コロシアム（闘技場）システム仕様書

**Version**: 1.1
**Date**: 2026-06-18
**Status**: Implemented & Verified

---

## 1. 概要

エンドコンテンツとして、Hub（名もなき旅人の拠所）を除くすべての通常拠点において「コロシアム（闘技場）」機能を実装する。
プレイヤーはゴールドを消費して難易度別の勝ち抜きエネミーバトルに挑戦し、希少な報酬の獲得や他のプレイヤーとのランキング競走（勝利数・最多連勝数）を楽しむことができる。

### 1.1 基本ルール

| 難易度 | 総戦数 | エネミーパターン数 | 挑戦費用（ゴールド） | 獲得報酬量（抽選プールより） |
|:---|:---|:---|:---|:---|
| **Easy** | 5戦 | 15種類 | プレイヤーレベル × 10 G | アイテムまたはスキル1点 |
| **Normal** | 10戦 | 30種類 | プレイヤーレベル × 30 G | アイテムまたはスキル1点 |
| **Hard** | 20戦 | 30種類 | プレイヤーレベル × 50 G | アイテム2点 ＆ スキル2点（報酬量2倍） |

- **ゴールド消費**: 受注（挑戦）時に即時引き去られる。ゴールドが不足している場合は挑戦できない。
- **デッキロック**: クエスト開始時にデッキがロックされ、挑戦中はスキルの変更や装備の変更が不可となる（一般クエストと同様のQuestEngine統合）。
- **戦闘構成**: 各戦闘は難易度ごとに定義された `colosseum_enemy_groups` プールからランダムに敵グループが選出される。
- **進行ノード**: シナリオは「1戦目」「2戦目」...と進行し、最終戦に勝利すると「クリア」、途中で敗北すると「失敗」となる。

---

## 2. データベース設計 (Schema)

コロシアムの進行、統計、ランキング、および報酬制御のために以下のテーブルを追加した。

### 2.1 `colosseum_user_stats`（ユーザー戦績）
各プレイヤーのコロシアム戦績（勝利数、敗北数、現在の連勝数、過去最多連勝数）を記録する。

```sql
CREATE TABLE IF NOT EXISTS public.colosseum_user_stats (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 `ranking_colosseum_cache`（ランキングキャッシュ）
パフォーマンスとリアルタイム更新の負荷低減のため、最大500位までのランキング情報を保持するキャッシュテーブル。

```sql
CREATE TABLE IF NOT EXISTS public.ranking_colosseum_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name TEXT,
    wins INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    rank_by_wins INTEGER,
    rank_by_streak INTEGER,
    aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.3 `colosseum_enemy_groups`（出現エネミープール）
各難易度に出現する敵グループのスラッグを紐づけるマスタテーブル。Easyは15種、Normalは30種、Hardはユニークボスを含めた30種が登録される。

```sql
CREATE TABLE IF NOT EXISTS public.colosseum_enemy_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    difficulty TEXT NOT NULL, -- 'easy', 'normal', 'hard'
    enemy_group_slug TEXT NOT NULL
);
```

### 2.4 `colosseum_reward_pool`（クリア報酬プール）
コロシアムをクリアした際に抽選されるレア・限定アイテム及びスキルのマスタテーブル。各報酬には `rarity` (希少度) が定義され、排出率が重み付け制御される。

```sql
CREATE TABLE IF NOT EXISTS public.colosseum_reward_pool (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_type TEXT NOT NULL, -- 'item', 'skill'
    reward_id TEXT NOT NULL,   -- 各マスタのID（文字列または数値文字）
    name TEXT,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'super_rare'))
);
```

---

## 3. 報酬確率システム (Weighted Probability)

ドロップアイテムおよびスキルは、難易度（Easy / Normal / Hard）ごとの確率ウェイトに基づいて個別にランダム抽選される。高難度になるほど、レア・超レア報酬の排出確率が上がる。

| 難易度 | Common（コモン） | Rare（レア） | Super Rare（スーパーレア） |
|:---|:---|:---|:---|
| **Easy** | 70% (ウェイト: 70) | 25% (ウェイト: 25) | 5% (ウェイト: 5) |
| **Normal** | 40% (ウェイト: 40) | 50% (ウェイト: 50) | 10% (ウェイト: 10) |
| **Hard** | 30% (ウェイト: 30) | 40% (ウェイト: 40) | 30% (ウェイト: 30) |

- **抽選ロジック**: `/api/quest/complete` 内にて、難易度に応じたウェイトマップを使用し、対応する報酬タイプの全プールからウェイトの総和を算出して境界値による抽選を行う。
- **Hard 2倍報酬**: Hardクリア時は、この抽選処理をアイテム・スキルそれぞれにおいて2回ずつ反復実行して付与する。

---

## 4. API エンドポイント

### 4.1 `POST /api/colosseum/start`
コロシアムの挑戦を開始する。

### 4.2 `GET /api/ranking/colosseum`
コロシアムランキングと現在ユーザーの順位をフェッチする。

### 4.3 `POST /api/battle/validate-result`（既存拡張）
戦闘終了検証時、コロシアム中のバトルであれば戦績 (`colosseum_user_stats`) を更新する。

### 4.4 `POST /api/quest/complete`（既存拡張）
コロシアム制覇時に、報酬プールからウェイトに基づいてアイテム・スキルを抽選してユーザーに付与する。

---

## 5. フロントエンド UI/UX

### 5.1 クエストリワードへの直接表示 (Crest integration)
獲得したランダムアイテム・スキルは、個別にバックグラウンド処理するだけでなく、ユーザーに獲得の達成感を与えるため、**クエスト完了リザルトモーダル (`QuestResultModal.tsx`) のメイン報酬枠 (ゴールドや経験値と同列のグリッドカード) として表示される**。
- 紫色のボーダーと輝くシャドウ、および種別に応じたブックアイコン (`BookOpen`) やバッグアイコン (`ShoppingBag`) を使用したカードデザインで描画される。
- クエストのリワードにアイテム・スキルしか存在しない場合であっても、報酬枠の表示がスキップされないようにハイドレーションガードを拡張した。
