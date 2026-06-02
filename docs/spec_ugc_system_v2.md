# Code: Wirth-Dawn Specification v12.0（改訂版）
# UGC テンプレート駆動システム

## 1. 概要

### 1.1 設計思想

本仕様書は、ユーザーが独自のクエスト・エネミー・アイテム・スキル・NPCを作成し公開するための「UGCシステム」を定義する。旧仕様（UIエディタ方式）を**全面廃止**し、**テンプレート駆動方式**を採用する。

| 原則 | 説明 |
|------|------|
| テンプレート駆動 | MD（YAML Frontmatter + Markdown）またはJSONテンプレートの編集・インポートがコンテンツ作成のプライマリ手段 |
| ScenarioEngine完全互換 | パースされたデータは公式クエストと同一の `ScenarioFlowNode[]` 形式でDBに保存され、既存エンジンをそのまま利用 |
| データ完全分離 | UGCデータは専用テーブル（`ugc_scenarios` 等）に格納し、公式マスターデータとは物理的に分離 |
| バランス保護 | パワーバジェット制による報酬制限、TP制によるエネミーバランス制御 |
| 安全性 | `ugc://` プロトコルによるアセット参照のみ許可。絶対URL禁止。審査制度による人的チェック |

### 1.2 テンプレート対象

| テンプレート種別 | 対応形式 | 概要 |
|----------------|---------|------|
| クエスト | MD / JSON | シナリオフロー全体 |
| エネミー | MD / JSON | カスタム敵キャラクター |
| アイテム | MD / JSON | カスタム消耗品・換金素材 |
| スキルカード | MD / JSON | カスタム戦闘スキル |
| NPC | MD / JSON | カスタム同行NPC（傭兵） |

### 1.3 旧仕様との差分

| 項目 | 旧仕様（v12.0） | 新仕様（本書） |
|------|----------------|---------------|
| コンテンツ作成 | ゲーム内UIエディタ | テンプレートインポート + 簡易エディタ |
| データ格納 | `scenarios` テーブルに混在 | `ugc_scenarios` 専用テーブル |
| パブリッシュ税 | 100G + アイテム価値 | **廃止** → レートリミット制 |
| 報酬 | 自由設定 | ゴールド/EXP/名声/アライメント禁止、アイテム/スキルのみ |
| クエスト配信 | 全拠点 | Hub（名もなき旅人の拠所）のギルド専用 |
| アセット参照 | 画像URLテキスト入力 | `ugc://` プロトコル + Supabase Storage |
| 音声 | 対応なし | BGM/SE カスタム対応 |

---

## 2. テンプレート仕様

### 2.1 クエストMDテンプレート

YAML Frontmatter にメタデータ、Markdown本文にシナリオノードを記述する。

#### Frontmatter フィールド定義

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|----------|------|
| `version` | `"1.0"` | ✅ | — | テンプレートバージョン |
| `type` | `"quest"` | ✅ | — | テンプレート種別 |
| `title` | string(1-30) | ✅ | — | クエスト名 |
| `short_description` | string(max 40) | ✅ | — | 一覧用キャッチコピー |
| `full_description` | string(max 2000) | — | — | 詳細フレーバーテキスト |
| `client_name` | string(max 20) | — | `"謎の依頼人"` | 依頼人名 |
| `scenario_type` | enum | — | `"Other"` | `Subjugation` / `Delivery` / `Politics` / `Dungeon` / `Other` |
| `difficulty` | int(1-10) | — | `1` | 難易度 |
| `rec_level` | int(1-50) | — | `1` | 推奨レベル |
| `days_success` | int(1-10) | — | `1` | 成功時経過日数 |
| `days_failure` | int(1-10) | — | `1` | 失敗時経過日数 |
| `conditions` | object | — | `{}` | 受注条件（§2.1.1） |
| `rewards` | object | — | — | 報酬（§2.1.2） |

##### 2.1.1 受注条件（`conditions`）

UGCクエストで設定可能な条件フィールド:

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `min_align_order_pct` | int(0-100) | 秩序率がN%以上で受注可能 |
| `min_align_chaos_pct` | int(0-100) | 混沌率がN%以上で受注可能 |
| `min_align_justice_pct` | int(0-100) | 正義率がN%以上で受注可能 |
| `min_align_evil_pct` | int(0-100) | 悪率がN%以上で受注可能 |

> **設定不可**: `min_level`（システム側でLv5固定）、`min_reputation`、`completed_quest`、`location_tags`、`min_prosperity` 等

##### 2.1.2 報酬（`rewards`）

| フィールド | 型 | 設定可否 | 制約 |
|-----------|-----|---------|------|
| `gold` | — | ❌ 禁止 | サーバー側で固定50G付与 |
| `exp` | — | ❌ 禁止 | サーバー側で固定30EXP付与 |
| `reputation` | — | ❌ 禁止 | |
| `alignment_shift` | — | ❌ 禁止 | |
| `items` | array(max 3) | ✅ | パワーバジェット制（§8） |
| `skill_card` | object(max 1) | ✅ | パワーバジェット制（§8） |

#### ノード記法

ノードは `## ノード N: タイトル（タイプ）` の見出しで区切る。

##### ノードタイプ一覧

| タイプ記法 | `type` 値 | 説明 | ユーザー操作 |
|-----------|----------|------|------------|
| `テキスト` / `会話` | `text` | テキスト表示・会話 | 選択肢クリックで進行 |
| `バトル` / `戦闘` | `battle` | 戦闘開始 | 戦闘勝利で次ノードへ |
| `納品` | `check_delivery` | アイテム納品チェック（消費） | 自動判定 |
| `NPC加入` / `同行NPC` | `guest_join` | ゲストNPCをパーティに追加 | 自動処理 |
| `NPC離脱` | `guest_leave` | ゲストNPCの離脱 | 自動処理 |
| `報酬` | `reward` | 道中報酬の付与 | 自動処理 |
| `ランダム分岐` | `random_branch` | 確率で分岐 | 自動判定 |
| `名声変動` | `modify_reputation` | 名声値を増減 | 自動処理 |
| `フラグ操作` | `modify_flag` | 内部変数の加減算 | 自動処理 |
| `罠` | `trap` | HP減少等のデバフ | 自動処理 |
| `成功` | `end`（result: success） | クエスト成功終了 | — |
| `失敗` | `end`（result: failure） | クエスト失敗終了 | — |

##### ノード内メタデータ記法

| 記法 | 変換先フィールド | 例 |
|------|----------------|-----|
| `**話者**: 名前` | `speaker_name` | `**話者**: 森の長老` |
| `**画像**: ugc://path` | `speaker_image_url` | `**画像**: ugc://images/scenarios/elder.webp` |
| `**背景**: key` | `bg_key` | `**背景**: bg_forest_day` or `ugc://images/scenarios/bg.webp` |
| `**BGM**: key` | `bgm_key` | `**BGM**: bgm_quest_calm` or `ugc://audio/bgm/custom.mp3` |
| `**SE**: key` | `se_key` | `**SE**: ugc://audio/se/effect.mp3` |

**背景・BGM**: 公式キー（プレフィックスなし）と `ugc://` パスの両方が使用可能。

##### 選択肢・進行記法

| 記法 | 説明 |
|------|------|
| `**選択肢**:` + `- [テキスト] → ノード N` | 分岐選択肢 |
| `→ ノード N`（ノード末尾に単独で記述） | 選択肢なしの自動進行先 |
| 記述なし | 次のノード番号に自動連結 |
| 最終ノード | 明示的な成功/失敗ノードがない場合、`end_success` に自動連結 |

##### バトルノードのエネミー記法

```markdown
**エネミー**:
  名前: エネミー名
  レベル: 10
  HP: 200
  ATK: 12
  DEF: 8
  スキル: [heavy_blow, heal_self]
  画像: ugc://images/enemies/name.webp
  フレーバー: 説明テキスト
```

全フィールドはインデント付きのYAML形式で記述する。

##### 納品ノード記法

```markdown
## ノード N: 素材納品（納品）
**納品アイテム**: item_potion_s × 3
```

##### NPC加入ノード記法

```markdown
## ノード N: 仲間加入（NPC加入）
**NPC**:
  名前: 森の狩人マリア
  レベル: 12
  ATK: 8
  DEF: 5
  耐久度: 100
  カバー率: 15
  AI: striker
  スキル: [arrow, double_slash]
  画像: ugc://images/npcs/maria.webp
  護衛対象: false
```

`護衛対象: true` を指定すると、そのNPCの耐久度が0になった時点でクエスト失敗となる。

##### ランダム分岐ノード記法

```markdown
## ノード N: 罠の回避（ランダム分岐）
**確率**: 60

成功時の演出テキスト。

**選択肢**:
- [成功] → ノード X
- [失敗] → ノード Y
```

##### 罠ノード記法

```markdown
## ノード N: 毒の沼（罠）
**ダメージ**: 20%

足元から毒沼が噴き出した！
```

`ダメージ` はプレイヤー最大HPに対する割合（%）。

### 2.2 クエストJSONテンプレート

MDテンプレートと等価な情報をJSON形式で記述する。

```json
{
  "$template": "wirth-dawn-ugc",
  "version": "1.0",
  "type": "quest",
  "quest": { /* Frontmatterと同一フィールド */ },
  "nodes": [
    {
      "id": "start",
      "type": "text",
      "text": "テキスト本文",
      "speaker_name": "話者名",
      "speaker_image_url": "ugc://images/scenarios/speaker.webp",
      "bg_key": "bg_forest_day",
      "bgm_key": "bgm_quest_calm",
      "choices": [
        { "label": "選択肢テキスト", "next": "node_2" }
      ]
    }
  ]
}
```

`nodes` 配列の各要素は `ScenarioFlowNode` 互換。`id` は一意の文字列。先頭ノードの `id` は `"start"` 固定。

### 2.3 エネミーJSONテンプレート

```json
{
  "$template": "wirth-dawn-ugc",
  "version": "1.0",
  "type": "enemy",
  "enemy": {
    "name": "名前(max 20)",
    "level": 10,
    "hp": 200,
    "atk": 12,
    "def": 8,
    "skills": ["heavy_blow", "heal_self"],
    "action_pattern": [
      { "skill": "heavy_blow", "prob": 40 },
      { "skill": "heal_self", "prob": 30, "condition": "hp_under_50" },
      { "skill": "tackle", "prob": 30 }
    ],
    "image_url": "ugc://images/enemies/name.webp",
    "flavor_text": "説明テキスト(max 200)",
    "asset_type": "enemy"
  }
}
```

`action_pattern` の `condition`: `"hp_under_50"` / `"hp_under_25"` / `"turn_mod_3"`（3ターンごと） / なし（常時）。`prob` の合計は100である必要はない（重み付き抽選）。

TPバリデーション（§8.2）がサーバーサイドで適用される。

### 2.4 アイテムJSONテンプレート

```json
{
  "$template": "wirth-dawn-ugc",
  "version": "1.0",
  "type": "item",
  "item": {
    "name": "名前(max 20)",
    "type": "consumable | trade_good",
    "sub_type": "recovery | material | ...",
    "description": "説明(max 100)",
    "base_price": 1,
    "effect_data": { "heal_hp": 30 },
    "rarity": "common | uncommon | rare",
    "use_timing": "battle | field",
    "image_url": "ugc://images/items/name.webp"
  }
}
```

**作成不可タイプ**: `weapon`, `armor`, `accessory`, `key_item`, `skill`（スキルは別テンプレート）。

`effect_data` で使用可能な効果:

| キー | 型 | 上限 | 説明 |
|------|-----|------|------|
| `heal_hp` | int | 200 | HP回復量 |
| `cure_status` | bool | — | ステータス異常解除 |

**使用不可**: `restore_vitality`（VIT回復）は完全禁止。

### 2.5 スキルカードJSONテンプレート

```json
{
  "$template": "wirth-dawn-ugc",
  "version": "1.0",
  "type": "skill_card",
  "card": {
    "name": "名前(max 20)",
    "power": 12,
    "ap_cost": 3,
    "target_type": "single_enemy | all_enemies | self | single_ally",
    "effect_id": "attack | pierce_attack | ...",
    "effect_duration": 0,
    "description": "説明(max 100)",
    "image_url": "ugc://images/cards/name.webp"
  }
}
```

`effect_id` 使用可能値: `attack`, `pierce_attack`, `multi_attack`, `heal`, `buff_self`, `buff_party`, `debuff_enemy`, `aoe_attack`。

**使用不可**: `instakill`, `recoil_attack`, `escape`, `taunt`, `support_activate`。

**制約**: `power` は最大 `25`。`ap_cost` は `1`〜`5`。

### 2.6 NPC JSONテンプレート

```json
{
  "$template": "wirth-dawn-ugc",
  "version": "1.0",
  "type": "npc",
  "npc": {
    "name": "名前(max 20)",
    "level": 12,
    "atk": 8,
    "def": 5,
    "durability": 100,
    "cover_rate": 15,
    "ai_role": "striker | guardian | medic",
    "ai_grade": "random",
    "signature_skills": ["arrow", "double_slash"],
    "image_url": "ugc://images/npcs/name.webp",
    "flavor_text": "説明テキスト(max 200)"
  }
}
```

`ai_grade` は `"random"` 固定（`"smart"` は英霊専用のため UGC では使用不可）。

NPバリデーション（§8.7）がサーバーサイドで適用される。

### 2.7 エネミーMDテンプレート

```markdown
---
version: "1.0"
type: enemy
---

## エネミー定義

名前: フォレストウルフ
レベル: 8
HP: 120
ATK: 8
DEF: 4
スキル: [heavy_blow, tackle]
行動パターン:
  - skill: heavy_blow
    prob: 50
  - skill: tackle
    prob: 50
画像: ugc://images/enemies/forest_wolf.webp
フレーバーテキスト: 森の奥深くに棲む大型の狼。
```

フロントマターに `version` と `type: enemy` を記述し、本文は `## エネミー定義` セクション内にキー/値形式でフィールドを記述する。

### 2.8 アイテムMDテンプレート

```markdown
---
version: "1.0"
type: item
---

## アイテム定義

名前: 回復薬
種別: consumable
説明: HPを30回復する薬品。
レアリティ: common
使用タイミング: battle
効果:
  HP回復: 30
画像: ""
```

`効果:` ブロックの `HP回復` は `effect_data.heal_hp` に対応する。

### 2.9 スキルカードMDテンプレート

```markdown
---
version: "1.0"
type: skill_card
---

## スキルカード定義

名前: 炎の剣
威力: 15
AP消費: 2
対象: single_enemy
効果: attack
効果持続: 0
説明: 炎を纏った剣で斬りつける。
画像: ""
```

`対象` は `single_enemy` / `all_enemies` / `self` / `single_ally` のいずれか。`効果` は `effect_id` に対応する。

### 2.10 NPC MDテンプレート

```markdown
---
version: "1.0"
type: npc
---

## NPC定義

名前: 剣士リーナ
レベル: 10
ATK: 8
DEF: 6
耐久度: 100
カバー率: 15
AI: striker
スキル: [slash, double_slash]
画像: ""
フレーバーテキスト: 旅の剣士。正義感が強い。
護衛対象: false
```

`AI` は `ai_role` に対応し、`striker` / `guardian` / `medic` のいずれか。`護衛対象: true` の場合、NPCの耐久度が0になるとクエスト失敗となる。

---

## 3. データベース設計

### 3.1 テーブル一覧

公式データテーブルとは完全に分離した専用テーブルを使用する。

| テーブル | 概要 |
|---------|------|
| `ugc_scenarios` | UGCクエスト |
| `ugc_enemies` | UGCエネミー |
| `ugc_items` | UGCアイテム |
| `ugc_cards` | UGCスキルカード |
| `ugc_npcs` | UGC同行NPC |
| `ugc_rate_limits` | レートリミット記録 |

### 3.2 `ugc_scenarios`

```sql
CREATE TABLE ugc_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  client_name TEXT DEFAULT '謎の依頼人',
  quest_type TEXT DEFAULT 'normal',
  scenario_type TEXT DEFAULT 'Other',
  difficulty INT DEFAULT 1,
  rec_level INT DEFAULT 1,
  days_success INT DEFAULT 1,
  days_failure INT DEFAULT 1,
  conditions JSONB DEFAULT '{}',
  rewards JSONB DEFAULT '{}',
  flow_nodes JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'published', 'rejected')),
  tested_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rejected_reason TEXT,
  play_count INT DEFAULT 0,
  clear_count INT DEFAULT 0,
  template_version TEXT DEFAULT '1.0',
  source_format TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**slug 命名規則**: `ugc_{userId先頭8文字}_{timestamp}`

### 3.3 `ugc_enemies`

```sql
CREATE TABLE ugc_enemies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  level INT DEFAULT 1,
  hp INT DEFAULT 50,
  atk INT DEFAULT 5,
  def INT DEFAULT 5,
  skills TEXT[] DEFAULT '{}',
  action_pattern JSONB DEFAULT '[]',
  image_url TEXT,
  flavor_text TEXT,
  asset_type TEXT DEFAULT 'enemy'
    CHECK (asset_type IN ('enemy', 'npc_companion')),
  tp_total INT,
  tp_consumed INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.4 `ugc_items`

```sql
CREATE TABLE ugc_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'consumable',
  sub_type TEXT,
  base_price INT DEFAULT 1,
  effect_data JSONB,
  description TEXT,
  use_timing TEXT,
  rarity TEXT DEFAULT 'common',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 `ugc_cards`

```sql
CREATE TABLE ugc_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Skill',
  power INT DEFAULT 5,
  ap_cost INT DEFAULT 1,
  cost_val INT DEFAULT 1, -- v28: 旧VIT/MPコスト値は廃止。UGCではデッキバランスの重み付けとして使用。
  target_type TEXT DEFAULT 'single_enemy',
  effect_id TEXT,
  effect_duration INT DEFAULT 0,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.6 `ugc_npcs`

```sql
CREATE TABLE ugc_npcs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  level INT DEFAULT 1,
  atk INT DEFAULT 5,
  def INT DEFAULT 5,
  durability INT DEFAULT 100,
  cover_rate INT DEFAULT 10,
  ai_role TEXT DEFAULT 'striker',
  ai_grade TEXT DEFAULT 'random',
  signature_skills TEXT[] DEFAULT '{}',
  image_url TEXT,
  flavor_text TEXT,
  np_total INT,
  np_consumed INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.7 `ugc_rate_limits`

```sql
CREATE TABLE ugc_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ugc_rate_user ON ugc_rate_limits(user_id, action, performed_at);
```

### 3.8 既存テーブルへの変更

```sql
ALTER TABLE user_completed_quests
  ADD COLUMN ugc_scenario_id UUID REFERENCES ugc_scenarios(id) ON DELETE SET NULL;

ALTER TABLE inventory
  ADD COLUMN ugc_item_id UUID REFERENCES ugc_items(id) ON DELETE SET NULL;

ALTER TABLE quest_activity_logs
  ADD COLUMN source_type TEXT DEFAULT 'official';
```

### 3.9 RLS ポリシー

```sql
ALTER TABLE ugc_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_crud" ON ugc_scenarios FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "published_read" ON ugc_scenarios FOR SELECT USING (status = 'published');
```

`ugc_enemies`, `ugc_items`, `ugc_cards`, `ugc_npcs` にも同様のポリシーを適用。

---

## 4. アセット管理

### 4.1 Supabase Storage

**バケット名**: `ugc-assets`（public read）

```
ugc-assets/
└── {userId}/
    ├── images/
    │   ├── enemies/{id}.webp
    │   ├── items/{id}.webp
    │   ├── cards/{id}.webp
    │   ├── npcs/{id}.webp
    │   └── scenarios/{id}_{用途}.webp
    └── audio/
        ├── bgm/{filename}.mp3
        └── se/{filename}.mp3
```

### 4.2 アセット制限

| 項目 | 制限 |
|------|------|
| 画像ファイルサイズ | 最大 2MB |
| 画像形式 | JPEG / PNG / WebP |
| 画像解像度 | 最大 1024×1024px |
| BGMファイルサイズ | 最大 5MB |
| SEファイルサイズ | 最大 1MB |
| 音声形式 | MP3 |
| BGM数 / クエスト | 最大 3曲 |
| SE数 / クエスト | 最大 5個 |
| ストレージ総容量 | Free: 10MB / Basic: 50MB / Premium: 200MB |

### 4.3 `ugc://` プロトコル

テンプレート内のアセット参照は `ugc://` プレフィックスのみ許可する。

**変換規則**:
```
ugc://images/enemies/guardian.webp
→ {SUPABASE_URL}/storage/v1/object/public/ugc-assets/{creatorId}/images/enemies/guardian.webp
```

**禁止事項**:
- `http://` / `https://` による絶対URL参照 → バリデーションエラー
- `..` を含むパストラバーサル → バリデーションエラー
- 許可ディレクトリ外のパス → バリデーションエラー

**許可ディレクトリ**: `images/enemies/`, `images/items/`, `images/cards/`, `images/npcs/`, `images/scenarios/`, `audio/bgm/`, `audio/se/`

**公式アセット参照**: 公式のBGM/背景キー（`bgm_quest_calm`, `bg_forest_day` 等）はプレフィックスなしで記述し、既存のアセットマップから解決する。

---

## 5. API 仕様

### 5.1 認証

すべてのUGC APIエンドポイントは `Authorization: Bearer <JWT>` ヘッダーによるJWT認証が必須。`auth.getUser(token)` で取得した `user.id` をすべての操作の主体とする。

### 5.2 エンドポイント一覧

| メソッド | パス | 認証 | 概要 |
|---------|------|------|------|
| `POST` | `/api/ugc/import` | JWT | テンプレートインポート（パース → draft保存） |
| `POST` | `/api/ugc/validate` | JWT | テンプレートバリデーション（ドライラン） |
| `GET` | `/api/ugc/v2/template?type=&format=` | なし | テンプレートファイルのダウンロード（JSON/MD）。UGC_ENABLEDフラグに依存しない |
| `GET` | `/api/ugc/export` | JWT | 既存UGCのテンプレートエクスポート |
| `POST` | `/api/ugc/save` | JWT | 下書き保存（簡易エディタからの部分更新） |
| `POST` | `/api/ugc/publish` | JWT | 公開申請（draft → pending_review） |
| `POST` | `/api/ugc/archive` | JWT | 公開取り下げ（published → draft） |
| `GET` / `DELETE` | `/api/ugc/list` | JWT | マイ作品一覧 / ドラフト削除 |
| `POST` | `/api/ugc/asset/upload` | JWT | 画像・音声ファイルのアップロード |
| `GET` | `/api/ugc/search` | なし | 公開クエストの検索 |
| `POST` | `/api/ugc/calculate` | なし | バランス計算ツール（TP/NP/PB） |
| `POST` | `/api/admin/ugc/review` | Admin | 管理者による審査（承認/却下） |

### 5.3 `POST /api/ugc/import`

テンプレート文字列を受け取り、パース・バリデーション後にdraftとして保存する。
テキスト貼り付け（コピペ）とファイルアップロードの両方に対応。

**Request**:
```json
{
  "content": "---\nversion: \"1.0\"\n...",
  "format": "md"  // "md" | "json" (省略時は自動判別)
}
```

**format 自動判定ルール**（クライアント側で実行）:

| テキスト先頭 | 判定結果 | 理由 |
|------------|---------|------|
| `---` | `md` | YAML frontmatter |
| `{` または `[` | `json` | JSON構造 |
| それ以外 | `md` | キー:値形式のMD |

**Response（成功）**:
```json
{
  "success": true,
  "type": "quest",
  "scenario_id": "uuid",
  "warnings": [],
  "preview": {
    "title": "古き森の守護者",
    "node_count": 7,
    "battle_count": 1,
    "power_budget": { "total": 27, "consumed": 15, "remaining": 12 }
  }
}
```

**Response（失敗）**:
```json
{
  "success": false,
  "errors": [
    { "line": 15, "field": "rewards.gold", "message": "UGCクエストではゴールド報酬を設定できません", "code": "FORBIDDEN_REWARD" }
  ]
}
```

**処理順序**:
1. JWT認証
2. ファイルサイズチェック（200KB上限）
3. レートリミットチェック（`import` アクション）
4. 形式自動判別 + パース
5. Zodスキーマバリデーション
6. `ugc://` URL検証（絶対URL検出）
7. パワーバジェット検証
8. エネミーTPバリデーション
9. NPC NPバリデーション
10. ノード参照整合性チェック（孤立ノード・循環参照）
10. ドラフト枠チェック
11. `ugc_scenarios` に `status: 'draft'` で保存
12. インラインエネミー → `ugc_enemies` 保存
13. カスタム報酬アイテム → `ugc_items` / `ugc_cards` 保存

### 5.4 `GET /api/ugc/search`

**Query Parameters**:

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `q` | string | — | 検索文字列（タイトル or クリエイター名） |
| `sort` | enum | `newest` | `newest` / `popular`（play_count順） |
| `page` | int | `1` | ページ番号 |
| `per_page` | int | `10` | 件数（max 30） |
| `difficulty` | int | — | 難易度フィルタ |
| `type` | string | — | `scenario_type` フィルタ |

**Response**:
```json
{
  "quests": [
    {
      "id": "uuid",
      "title": "古き森の守護者",
      "short_description": "森の奥に棲む獣を退治してほしい",
      "creator_name": "旅人マコト",
      "difficulty": 3,
      "rec_level": 10,
      "scenario_type": "Subjugation",
      "play_count": 12,
      "clear_count": 8,
      "conditions": {},
      "created_at": "2026-06-01T..."
    }
  ],
  "total": 45,
  "page": 1,
  "has_more": true
}
```

### 5.5 `POST /api/ugc/publish`

**処理**:
1. JWT認証
2. 対象シナリオの `creator_id` と一致するか確認
3. `status === 'draft'` であることを確認
4. `tested_at IS NOT NULL` であることを確認（テストプレイ済み）
5. レートリミットチェック（`publish` アクション）
6. 公開枠チェック（Tier別上限）
7. `status` を `'pending_review'` に更新

### 5.6 `POST /api/admin/ugc/review`

**認証**: `x-admin-secret` ヘッダー（`ADMIN_SECRET_KEY` 環境変数と照合）。

**Request**:
```json
{
  "scenario_id": "uuid",
  "action": "approve",  // "approve" | "reject"
  "reason": ""           // reject時に必須
}
```

**処理**:
- `approve`: `status = 'published'`, `published_at = now()`
- `reject`: `status = 'rejected'`, `rejected_reason = reason`, `tested_at = NULL`（再テスト必須にする）

### 5.7 `POST /api/ugc/asset/upload`

**Request**: `multipart/form-data`

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `file` | File | アップロードファイル |
| `asset_type` | string | `image_enemy` / `image_item` / `image_card` / `image_npc` / `image_scenario` / `bgm` / `se` |

**処理**:
1. JWT認証
2. ファイルバリデーション（サイズ・形式・解像度）
3. ストレージ使用量チェック（Tier別上限）
4. 画像の場合はWebP変換（品質80）
5. Supabase Storage にアップロード
6. `ugc://` 形式のパスを返却

**Response**:
```json
{
  "success": true,
  "ugc_path": "ugc://images/enemies/abc123.webp",
  "file_size": 45032,
  "storage_used": 2340000,
  "storage_limit": 10485760
}
```

---

## 6. パブリッシュフロー

### 6.1 ライフサイクル

```
draft → (テストプレイ通過) → pending_review → (管理者審査)
  ↑                                              ↓       ↓
  └──── archive ←── published              rejected
                                              ↓
                                            draft (修正して再申請可能)
```

| 遷移 | トリガー | 条件 |
|------|---------|------|
| draft → pending_review | ユーザーが公開申請 | テストプレイ済み + レートリミット内 + 公開枠内 |
| pending_review → published | 管理者が承認 | — |
| pending_review → rejected | 管理者が却下 | 理由必須 |
| rejected → draft | 自動 | `tested_at` がNULLに戻る（再テスト必須） |
| published → draft | ユーザーが取り下げ | — |

### 6.2 レートリミット

パブリッシュ税に代わり、日次レートリミットで品質管理を行う。

| Tier | `publish` | `save` | `import` |
|------|-----------|--------|----------|
| Free | 1件/日 | 5件/日 | 10回/日 |
| Basic | 3件/日 | 15件/日 | 30回/日 |
| Premium | 10件/日 | 無制限 | 無制限 |

「日」は UTC 0:00 を区切りとする。

### 6.3 テストプレイ

公開申請の前に、クリエイター自身が現在のキャラクターとデッキでクエストを最後まで通しプレイし、クリア（成功ノードに到達）する必要がある。

- テストプレイ中のVitality消費、敗北ペナルティは発生しない
- テストプレイ中の報酬付与は発生しない
- テストプレイ成功時に `tested_at` カラムにタイムスタンプを記録
- テンプレートの再インポート（内容変更）時は `tested_at` がNULLに戻る

---

## 7. クエスト配信

### 7.1 配信場所

UGCクエストは**名もなき旅人の拠所（Hub）のギルドのみ**で受注可能とする。通常拠点のクエストボード（ギルド）には表示しない。

**Hub施設構成**:
```
名もなき旅人の拠所（Hub）
├── ギルド      ← UGCクエストボード（通常クエスト無し・Hub専用）
├── 商店        ← 既存
├── 酒場        ← 既存（傭兵、酒場）
├── 寺院        ← 既存
├── ステータス  ← 既存
└── 図鑑        ← 既存（Hub限定）
```

Hubのギルドタブは通常クエストを表示せず、UGCクエスト専用のクエストボードとして機能する。

### 7.2 受注条件

| 条件 | 値 |
|------|-----|
| **必須レベル** | Lv5以上（サーバーサイドで強制、テンプレートからは変更不可） |
| **一覧閲覧** | Lv制限なし（Lv5未満でも一覧・詳細は閲覧可能。受注ボタンのみ無効化） |
| **アライメント条件** | クリエイターがテンプレートで任意設定可能 |
| **同時受注** | 通常クエストと同様、1つのクエストのみ |

### 7.3 クエスト完了時の処理

UGCクエスト完了時は、通常クエストとは異なる報酬処理を行う。

| 項目 | UGCクエスト | 通常クエスト |
|------|------------|------------|
| ゴールド | 固定 50G（サーバー強制） | テーブル定義値 |
| EXP | 固定 30（サーバー強制） | テーブル定義値 |
| 名声 | 変動なし | テーブル定義値 |
| アライメント | 変動なし | テーブル定義値 |
| カスタムアイテム | テンプレート定義（パワーバジェット内） | — |
| カスタムスキル | テンプレート定義（パワーバジェット内、最大1枚） | — |
| 加齢 | `days_success` / `days_failure` に従う | 同左 |
| VIT摩耗 | 通常と同一ルール | 同左 |
| play_count / clear_count | `ugc_scenarios` をインクリメント | — |
| クリア履歴 | `user_completed_quests.ugc_scenario_id` に記録 | `scenario_id` に記録 |

カスタムアイテムは `inventory` に `is_ugc = true`, `ugc_item_id` で保存される。売却価格は1G固定。

---

## 8. 報酬バランス

### 8.1 パワーバジェット（PB）制

クエスト全体に「パワーバジェット」を割り当て、報酬の総パワーがバジェット内に収まるよう制御する。

**PB算出式**:
```
PB = rec_level × 2 + バトルノード数 × 5 + 総ノード数 × 1
```

| クエスト例 | PB |
|-----------|-----|
| Lv5, バトル1, 全4ノード | 5×2 + 1×5 + 4 = **19** |
| Lv10, バトル2, 全8ノード | 10×2 + 2×5 + 8 = **38** |
| Lv30, バトル3, 全15ノード | 30×2 + 3×5 + 15 = **90** |

### 8.2 アイテムのパワーコスト（PC）

| 種別 | PC算出 |
|------|--------|
| 消耗品（HP回復） | `heal_hp / 10` |
| 消耗品（状態異常解除） | `5` 固定 |
| 換金素材 | `3` 固定（base_price は常に1Gのため） |

### 8.3 スキルカードのパワーコスト（PC）

```
PC = power + effect_bonus - ap_discount

effect_bonus:
  attack, pierce_attack       → 0
  heal                        → +3
  buff_self, buff_party       → +5
  debuff_enemy                → +5
  aoe_attack, multi_attack    → +8

ap_discount:
  ap_cost >= 4 → -3
  ap_cost == 3 → -1
  ap_cost == 2 → 0
  ap_cost == 1 → +5  (低コスト高出力ペナルティ)
```

### 8.4 バリデーション

全報酬の PC 合計が PB を超過した場合、テンプレートのインポートをブロックする。

```
合計 PC ≤ PB → ✅ インポート許可
合計 PC > PB → ❌ バリデーションエラー
```

### 8.5 禁止事項

| 禁止項目 | 理由 |
|---------|------|
| ゴールド報酬 | 経済インフレ防止 |
| EXP報酬 | レベリング速度の制御 |
| 名声報酬 | ゲーム進行条件の公式管理 |
| アライメント報酬 | 世界情勢への公式外の影響排除 |
| VIT回復アイテム | 寿命ループによるゲーム根幹の破壊防止 |
| 装備品（weapon/armor/accessory） | 戦闘バランスの保護 |
| 重要アイテム（key_item） | 進行フラグの安全性 |
| 即死スキル（instakill） | バランス崩壊防止 |
| スマートAI（ai_grade: smart） | 英霊専用機能の希少性維持 |

### 8.6 TPバリデーション（エネミー）

カスタムエネミーのステータスはTP（脅威度ポイント）制で制御する。

**Total TP**: `10 + level × 5`

| ステータス/スキル | TPコスト |
|---|---|
| HP +1 | 1 TP |
| ATK +1 | 2 TP |
| DEF +1 | 2 TP |
| 全体攻撃スキル（aoe系） | 20 TP |
| `drain_vit`（寿命吸収） | 30 TP |
| その他スキル | 0 TP |

消費 TP > Total TP の場合、バリデーションエラー。

### 8.7 NPバリデーション（NPC）

カスタムNPCのステータスはNP（NPCポイント）制で制御する。

**Total NP**: `10 + level × 5`

| ステータス/スキル | NPコスト |
|---|---|
| ATK +1 | 2 NP |
| DEF +1 | 2 NP |
| 耐久度(durability) +10 | 1 NP |
| カバー率(cover_rate) +5% | 2 NP |
| スキル1つ | 3 NP |

例: Lv12 NPC（NP上限 = 10 + 12×5 = 70）
- ATK 8 → 16 NP
- DEF 5 → 10 NP
- 耐久度 100 → 10 NP
- カバー率 15% → 6 NP
- スキル 2つ → 6 NP
- 合計 = 48 NP ≤ 70 ✅ OK

消費 NP > Total NP の場合、バリデーションエラー。

### 8.8 バランス計算ツール

TP/NP/PBの計算はクリエイターズ工房の「バランス計算」タブで事前確認できる。

#### `POST /api/ugc/calculate`

**認証不要**（公開API）

**Request**:
```json
{
  "type": "enemy",
  "params": { "level": 10, "hp": 100, "atk": 12, "def": 8, "skills": ["heavy_blow", "heal_self"] }
}
```
```json
{
  "type": "npc",
  "params": { "level": 12, "atk": 8, "def": 5, "durability": 100, "cover_rate": 15, "skills": ["arrow", "double_slash"] }
}
```
```json
{
  "type": "quest_rewards",
  "params": {
    "rec_level": 10, "battle_count": 2, "node_count": 8,
    "items": [{ "type": "consumable", "heal_hp": 80 }],
    "skill_card": { "power": 12, "ap_cost": 3, "effect_id": "attack" }
  }
}
```

**Response**:
```json
{
  "total_points": 60,
  "consumed_points": 48,
  "remaining_points": 12,
  "is_valid": true,
  "breakdown": {
    "atk": { "value": 8, "cost": 16 },
    "def": { "value": 5, "cost": 10 },
    "durability": { "value": 100, "cost": 10 },
    "cover_rate": { "value": 15, "cost": 6 },
    "skills": { "count": 2, "cost": 6 }
  }
}
```

---

## 9. サブスクリプション枠管理

| Tier | 公開枠 | ドラフト枠 | カスタムアセット | ストレージ |
|------|--------|-----------|---------------|----------|
| Free | 2 | 5 | エネミー5 / アイテム5 / スキル5 / NPC5 | 10MB |
| Basic | 10 | 20 | 各20 | 50MB |
| Premium | 50 | 100 | 無制限 | 200MB |

枠チェックは各API操作時にサーバーサイドで実施。超過時は `403 Forbidden`。

---

## 10. セキュリティ

| リスク | 対策 |
|--------|------|
| 認証バイパス | JWT必須。bodyのuserIdはJWTと一致チェック |
| 巨大ファイル | テンプレート: 200KB、画像: 2MB、BGM: 5MB、SE: 1MB |
| XSS | テキストフィールドのHTMLタグ除去 |
| パストラバーサル | `ugc://` パスの `..` 検出ブロック |
| 絶対URL | `http://`/`https://` 開始のURL一律拒否 |
| TPバイパス | サーバーサイドでTP完全再計算 |
| PBバイパス | サーバーサイドでPB完全再計算 |
| 禁止報酬 | Zodスキーマで `gold`/`exp`/`reputation` を構造的に除外 |
| DoS | レートリミット + ファイルサイズ上限 |
| 不正ノード参照 | 全ノードIDの存在チェック + 循環参照DFS検出 |
| 不適切コンテンツ | NGワード自動チェック + 管理者人的審査 |

---

## 11. UI 仕様

### 11.1 クリエイターズ工房（`/editor`）

Hub（名もなき旅人の拠所）滞在時のみアクセス可能。

**4タブ構成**:

| タブ | 概要 |
|------|------|
| インポート | テンプレートのアップロード/貼り付け + バリデーション + 保存 |
| マイ作品 | 自分のUGCクエスト一覧（ステータス管理・テストプレイ・公開申請・削除） |
| テンプレート | テンプレートファイルのダウンロード + 記法リファレンス |
| バランス計算 | TP/NP/PBの自動計算ツール |

**インポートタブ**: ドラッグ&ドロップエリア / テキスト貼り付けエリア / リアルタイムバリデーション結果 / プレビュー / 下書き保存・テストプレイボタン

**マイ作品タブ**: ステータスバッジ（draft/pending/published/rejected）/ 却下理由表示 / 各種アクションボタン / 枠使用状況

**テンプレートタブ**: テンプレート種別×形式の選択 / ダウンロードボタン / 記法クイックリファレンス / 拠点ID・スキルID一覧

### 11.2 UGCクエストボード（Hubギルド）

Hubのギルドタブ（クエストボード）をUGCクエスト専用として差し替え。

**構成要素**:
- 検索バー（クエスト名/クリエイター名）
- 並び替え（新着/人気）
- クエストカード一覧（タイトル/作者/推奨レベル/プレイ回数/概要）
- 詳細モーダル（フレーバーテキスト/受注条件/ノード数/クリア率）
- 受注ボタン（Lv5未満は無効化 + 理由表示）
- ページネーション

### 11.3 バランス計算ツール

クリエイターズ工房の4番目のタブとして設置。

**3モード切替**:

| モード | 入力フィールド | 出力 |
|--------|-------------|------|
| エネミー（TP） | レベル / HP / ATK / DEF / スキル選択 | TP消費 / 上限 / 残り |
| NPC（NP） | レベル / ATK / DEF / 耐久度 / カバー率 / スキル選択 | NP消費 / 上限 / 残り |
| クエスト報酬（PB） | 推奨レベル / バトル数 / ノード数 / 報酬アイテム・スキル | PB消費 / 上限 / 残り |

- プログレスバーでバジェット消費を視覚的に表示
- 超過時は赤色でエラー表示 + 具体的な調整アドバイス
- 数値変更はリアルタイムで反映（APIコール不要、クライアントサイド計算）

### 11.3 管理者審査UI（`/admin/dashboard`）

既存の管理者ダッシュボードに「UGC審査」セクションを追加。

- `pending_review` 一覧
- クエスト内容プレビュー（全ノードテキスト・エネミー構成・報酬内容）
- 承認/却下ボタン
- 却下理由入力（テンプレート: 著作権侵害/不適切コンテンツ/バグ/その他）

---

## 12. Feature Flag

```
環境変数: NEXT_PUBLIC_UGC_ENABLED = "true" | "false"
```

`false` の場合:
- `/editor` ページは「Coming Soon」表示
- Hubギルドの UGCクエストボードは非表示
- `/api/ugc/*` は `503 Service Unavailable` を返却

リリース初期は `false` に設定し、準備完了後に `true` に切り替える。

---

## 13. プレイガイドおよび動的ルーティング（v12.1 追加仕様）

### 13.1 UGCクエストプレイガイド
UGCクエストの作成・導入・プレイ方法をユーザーに提示するため、公式プレイガイド内に「UGCガイド」セクションを新設し、専用のマークダウンドキュメントから動的に生成する。

- **ルーティング**: `/play-guide/ugc`
- **表示内容**: `docs/ugc_play_guide.md`
- **実装方式**:
  - `src/app/play-guide/ugc/page.tsx` を新規作成。
  - サーバーサイドで `docs/ugc_play_guide.md` の内容を読み込み、共通の `PlayGuideView` コンポーネントに渡してパース・描画する。
  - これにより、他の公式プレイガイドと同様のマークダウンパーサー、検索結果ハイライト、目次（TOC）などの機能をそのまま再利用する。

### 13.2 公式プレイガイドとの統合
- `docs/play_guide.md` にUGCシステムについての説明および `/play-guide/ugc` へのリンク（UGCガイドを開く）を追加。
- プレイガイド一覧（および検索対象）にUGCプレイガイドを組み込む。

### 13.3 クリエイターズ工房との連携
- クリエイターズ工房（`/workshop` ページ）の上部ヘッダー（ナビゲーションバー）に、プレイガイドへの直通リンク（UGCガイドを開くボタン）を設置。
- ボタンはヘッダー右端に配置し、本ゲームのビジュアルテーマに沿った配色（ゴールド/ブラウン系）および `BookOpen` アイコンを使用する。

---

## 14. 簡易クエストビルダー（v12.2 追加仕様）

### 14.1 概要

テンプレートアップロード（MD/JSON）をメインとしつつ、モバイルユーザーがUI操作のみでクエストを作成できる「簡易クエストビルダー」をクリエイターズ工房に新設する。4段階のステップ式ウィザードUIを採用し、モバイル環境でも迷わず直感的にクエストを作成できる。

### 14.2 テンプレート方式との差分

| 項目 | テンプレート方式 | 簡易ビルダー |
|------|----------------|-------------|
| ノード数上限 | 100 | **20** |
| 使用可能ノードタイプ | 9種 | **5種**（text, battle, delivery, trap, success/failure） |
| エネミー定義 | フルカスタム（TP制） | **プリセット24種＋レベル微調整** |
| NPC定義 | フルカスタム（NP制） | ❌ 不可 |
| 報酬 | カスタムアイテム/スキル作成可 | **プリセット報酬アイテム12種から選択** |
| BGM/SE | カスタムアップロード可 | **公式BGMキー選択のみ** |
| 画像 | `ugc://` カスタム画像 | **公式背景キー選択のみ** |
| 分岐構造 | 自由グラフ（最大5択） | **最大2択、分岐深度1段階** |

### 14.3 除外ノードタイプ

| 除外タイプ | 理由 |
|-----------|------|
| `npc_join` / `npc_leave` | NPC定義（NP制、AI設定）がモバイルUIの複雑さを大幅に上げるため |
| `random_branch` | 確率分岐はフロー構造を複雑にし、テスト/デバッグも困難なため |

### 14.4 プリセットエネミー（24種）

4カテゴリ × 6種で構成。レベルスケーリング: `HP = base × (selected_level / base_level)`, `ATK/DEF = base × (selected_level / base_level) × 0.9`。スキル構成はプリセット固定。TPバリデーションはサーバーサイドで通常通り適用。

| カテゴリ | 種数 | レベル帯 |
|---------|------|---------|
| 初級 | 6 | Lv 1-8 |
| 中級 | 6 | Lv 9-16 |
| 上級 | 6 | Lv 17-30 |
| ボス級 | 6 | Lv 15-30 |

### 14.5 プリセット報酬アイテム（12種）

消耗品8種＋換金素材4種の公式アイテムから選択。`base_price` はUGC規定通り1G固定で上書き。パワーバジェット制は通常通り適用。

### 14.6 フロー制約

- 最大ノード数: 20
- 選択肢数/ノード: 最大2択
- 分岐深度: 最大1段階（分岐先ノードからの再分岐は不可）
- テキスト長/ノード: 最大500文字

### 14.7 アーキテクチャ

- **新規APIなし**: ビルダーのデータはクライアントサイドで UGC JSON テンプレート（§2.2互換）に変換し、既存の `/api/ugc/v2/import` に送信
- **DB変更なし**: `ugc_scenarios.source_format = 'builder'` で識別（既存カラム活用）
- **ステップ式ウィザード**: 4ステップ構成の逐次入力フォーム。CSSによる簡易フロー図表示を含み、外部ライブラリ不使用
- **プリセットデータ**: クライアントサイド定数（APIコール不要）
- **バランス計算**: クライアントサイドでリアルタイム実行（既存 `ugcBalanceCalc.ts` のロジック再利用）

### 14.8 UI構成

クリエイターズ工房（`/workshop`）に5番目のタブ「簡易作成」（`Wand2` アイコン）として追加。`next/dynamic` + `{ ssr: false }` で遅延ロード。

- **PC表示幅制限と共通コンテナ**: PCなどの大画面でボタンの巨大化やレイアウトの引き伸ばしを防ぐため、工房全体を `max-w-[450px]` の枠に制限し、アンティーク調のウッドブラウン境界線（`md:border-4 md:border-[#3e2723] md:rounded-[24px]`）で囲み画面中央に配置する。また、タブバーの左右に横スクロール用の矢印ボタン（Chevron）を配置し、見切れるタブ項目へのPCスクロールを補完する
- **ステップ1: 基本情報**: クエストのタイトル、概要、依頼人、推奨レベル、日数制限などを設定するフォーム
- **ステップ2: フロー構築**: ノードを縦一列のリスト形式で追加・編集・並べ替える。分岐はテキストノードの選択肢からジャンプ先のノードを選択することで表現し、リスト上ではインデントによって表現する
- **ステップ3: 報酬設定**: プリセット報酬アイテムから最大3個を選択し、パワーバジェットをリアルタイムに検証・調整する
- **ステップ4: プレビュー＆保存**: クエスト情報のサマリーと、テキストによる簡易フローマップ、およびバリデーション結果を確認し、下書きとして保存または公開申請する
