Code: Wirth-Dawn Specification v14.2
# Hub (Inn) Top Screen UI & NPC Dialogue System

## 更新履歴
- **v14.2** (2026-04-13): バトル中アイテム使用システム仕様を追加
- **v14.1** (2026-04-04): UI改修確定、BGM/SEシステム追加
- **v14.0** (2026-04-04): 初版

## 1. 概要 (Overview)
本仕様書は、プレイヤーの拠点（宿屋/名も無き旅人の拠所を含む全20拠点）のトップ画面UI、「名声」と「情勢（繁栄度）」によって変化するNPC対話システム、および拠点BGM・施設SEシステムについて定義する。

## 2. 画面構成 (Screen Layout)
画面は以下の4つの主要エリアで構成される（モバイルレイアウト 390x844 を基準とする）。

### 2.1 グローバル情報ヘッダー
- **上部ナビゲーション行**: `[世界暦]` `[世界の覇権ボタン（flex拡張）]` `[設定アイコン]` の3要素を横並びに配置する。
- **プレイヤー情報**:
  - アバター画像右下に `Lv.X` のバッジを付与。
  - **HPバー**: `user_profiles.hp / max_hp` を実値で表示。通常は緑色。
  - **Vitalityバー**: `user_profiles.vitality / max_vitality` を実値で表示。通常は緑色。`Vitality <= 20` の場合、バーが**赤色**になり点滅（Pulse）する視覚的警告を行う。（※APバーは廃止）
  - Vitalityの数値テキスト表示（例: `25/100`）は表示しない。
  - ゴールドと名声は**同一行に横並び**で表示する: `[コインアイコン] XXXG  [星アイコン] 名声: X`
- **世界情勢**: 聖界暦（経過日数換算）を上部ナビ行に表示。現在地名・フレーバーテキストはメインビジュアルエリアに表示。
- 「世界の覇権」ボタンタップで HegemonyModal を起動する。

### 2.2 メインビジュアルエリア
- 背景画像を用いた没入感のあるエリア。
- **右上**に以下の**アイコンのみの円形ボタン**をコンテキストメニューとして並べて配置する。
  - **歴史（BookOpen）**: メインストーリーや過去の履歴を参照。HistoryArchiveModal を起動。
  - **街の噂話（MessageSquare）**: タップで「噂話モーダル」を起動。滞在拠点の情勢に応じた複数のフレーバーテキスト・リストを表示。
- 左下に現在地名（大テキスト）・フレーバーテキスト（イタリック）を表示。
- 右下に繁栄度バッジを表示。ラベルは以下の5段階:

| prosperity_level | ラベル |
|---|---|
| 5 | 絶頂 |
| 4 | 繁栄 |
| 3 | 停滞 |
| 2 | 衰退 |
| 1 | 崩壊 |

### 2.3 施設ナビゲーショングリッド
- 2列グリッドで構成。
- `1. 宿屋/酒場`, `2. ギルド`, `3. 道具屋`, `4. 神殿` はタップ時に「施設NPC対話モーダル」を開く。
- `5. ステータス` は直接StatusModalへ遷移する。
- マップはメインビジュアルエリアのコンパスアイコンから遷移する。
- 設定は上部ナビゲーション行の設定アイコンからアクセスする。

### 2.4 クリエイターズ工房バナー (Hub限定)
- プレイヤーの現在地が「名も無き旅人の拠所」である場合のみ、ナビゲーショングリッド下部にグラデーション背景の専用バナーを表示。
- バナーテキストには「クリエイターズ工房」のみを表示し、不要なアイコンやテキストを排除する。
- タップで上寄せ表示の「工房モーダル（アセット作成・作品管理など）」を起動。直接エディタへは遷移させない。

## 3. NPC対話システム (NPC Dialogue System)

### 3.1 モーダル構成と配置
- **配置**: すべてのモーダル（NpcDialogModal, RumorsModal, WorkshopModal, HistoryModal等）は、ヘッダーを隠さないように配慮しつつ**画面上端（Headerのすぐ下）**に配置する（items-start, pt-28などを利用）。
- **背景**: 半透明ダークパネル。進入アニメーションは**上からのスライドイン（slide-in-from-top）**またはフェードインを採用。
- **ヘッダー**: NPCの役職（例: `[宿屋の主人]`）、NPC名、NPCアイコン画像。
- **ダイアログ**: NPCの台詞（タイプライター演出付き）。
- **アクション**: 最下部に各施設に応じた個別のアクションラベルを持つメインボタンを配置する。
  - **宿屋**: 「休息する」 → ゴールドを消費し、HPを全快。コストは情勢（Prosperity）に応じて変動する（繁栄≥4: 100G / 停滞3: 200G / 衰退・崩壊≤2: 300G）。所持金不足時はボタンを `disabled` とし「ゴールドが不足しています」と表示。セカンダリアクションとして「冒険者を探す（TavernModal）」を表示（非Hub時のみ）。
  - **道具屋**: 「品揃えを見る」 → ShopModal 起動
  - **神殿**: 「礼拝堂に行く」 → PrayerModal 起動
  - **ギルド**: 「依頼を見る」 → QuestBoardModal 起動（インライン表示）

### 3.2 動的台詞分岐ロジック
1. **名声（Renown）による分岐**:
   - `Renown >= 500`: 英雄への歓迎・尊敬の台詞。
   - `Renown < 0`: 悪名への警戒、または一部施設での裏取引の示唆。
2. **情勢（Prosperity）による分岐**:
   - `Prosperity <= 1` (崩壊): 物資不足、略奪への恐怖、悲観的な台詞。
   - `Prosperity >= 4` (繁栄): 景気の良さ、豊富な物資をアピールする台詞。
3. **デフォルト**: 上記条件に当てはまらない汎用台詞。

## 4. BGMシステム

### 4.1 BGMの選択ルール
拠点に到着した時点で即座に以下のルールに従いBGMを切り替える。

| 条件 | BGMキー | 優先度 |
|---|---|---|
| 現在地 = 名も無き旅人の拠所 | `bgm_inn` | 最高 |
| prosperity_level = 1（崩壊） | `bgm_collapse` | 高（国家BGMより優先） |
| controlling_nation = Roland | `bgm_roland` | 通常 |
| controlling_nation = Markand | `bgm_markand` | 通常 |
| controlling_nation = Yato | `bgm_yato` | 通常 |
| controlling_nation = Karyu | `bgm_karyu` | 通常 |
| その他（Neutral等） | `bgm_field` | デフォルト |

### 4.2 BGMファイル命名規則
- 形式: `/audio/bgm/{bgmキー}.ogg`
- 国家BGMファイル: `bgm_roland.ogg` / `bgm_markand.ogg` / `bgm_yato.ogg` / `bgm_karyu.ogg`
- 共通BGM: `bgm_collapse.ogg`（崩壊時共通）

## 5. SEシステム

### 5.1 施設入場SE
NPC対話モーダルが開く瞬間に再生する。ステータスは対象外。

| 施設 | SEキー |
|---|---|
| 宿屋/酒場 | `se_enter_inn` |
| ギルド | `se_enter_guild` |
| 道具屋 | `se_enter_shop` |
| 神殿 | `se_enter_temple` |

### 5.2 ワールドマップ遷移SE
「マップ」ボタンまたはコンパスアイコンをタップした瞬間に `se_travel`（足音系SE）を再生し、約150ms後に `/world-map` へ遷移する。

## 6. デザイン要件
- テーマカラー: `Slate 950 (#020617)` をベースとし、アクセントカラーに `Gold (#D4AF37)` および `Amber-500` を使用。
- モーダルやボタンのタップ時には `active:scale-95` のフィードバックを実装すること。

---

## 7. バトル中アイテム使用システム (Battle Item System)
<!-- v14.2 (2026-04-13): useBattleItem の仕様を追加 -->

### 7.1 概要

バトル画面の「アイテム」ボタン（ターンエンドボタン左隣）を押すと `battleItems` パネルが表示され、インベントリから `use_timing: 'battle'` に設定されたアイテムを使用できる。

### 7.2 UI/UX 挙動

| 項目 | 仕様 |
|---|---|
| アイテムパネル | 画面下部からのスライドイン表示（`slide-in-from-bottom`） |
| ボタン表示 | アイテムアイコン + 名前 + 個数バッジ（`x{qty}`） |
| HP 満タン時 | heal-only アイテムのボタンをグレーアウト、バッジを「HP満」に変更 |
| 使用不可条件 | 個数 0 / 勝利済み / 敗北済み / HP満タン（heal-onlyの場合） |

### 7.3 アイテム使用フロー (`useBattleItem`)

```
プレイヤーがアイテムをタップ
 ↓
useBattleItem(item) 実行
 ├ [1] HP満タン & heal-onlyアイテム → ログに「HPが満タンのため使用できない」を追加、アイテム消費なし、早期リターン
 ├ [2] effect_data に応じて効果を処理（複数効果の同時適用可能）
 │    ① escape: true → 逃走フラグ ON
 │    ② heal / heal_hp / heal_amount > 0 → 固定値回復（HP+N 回復、HP前後の数値を表示）
 │    ③ heal_pct > 0 → 割合回復
 │    ④ heal_full / heal_all → 全回復
 │    ⑤ remove_effect → 状態異常解除
 │    ⑥ effect_id (target='enemy') → 敵へのデバフ付与
 │    ⑦ effect_id (target省略 or 自身系) → 自身へのバフ付与
 │    ⑧ いずれにも該当しない → 「何も起きなかった…」（アイテムは消費しない）
 ├ [3] HP変動がある場合 __hp_sync:NNN マーカーを追加（UI のHP表示リアルタイム更新）
 ├ [4] battleItems の個数を楽観的に更新（quantity -1）
 └ [5] inventory と userProfile.hp を更新 → battleState.messages に追記
      → /api/item/use を非同期呼び出し（失敗しても続行）
 ↓
BattleView の useEffect([battleState.messages]) がログをタイプライターに追加
```

### 7.4 ログメッセージ形式

| 効果 | ログ形式 |
|---|---|
| 回復 | `💊 傷薬を使用した。HP +50 回復！ (HP: 80 → 130/200)` |
| 全回復 | `✨ 天使の涙を使用。HP が全回復した！ (+70) HP: 130 → 200/200` |
| HP満タン | `💊 傷薬を使おうとしたが、HPが満タンのため使用できない！` |
| 状態異常解除 | `🌿 解毒草を使用。状態異常「毒」を解除した！` |
| 状態異常解除（未付与） | `🌿 解毒草を使用したが、その状態異常は付与されていない。` |
| 敵デバフ | `🔮 毒塗りの粉を投げつけた！ 敵に「毒」を付与した！(3ターン)` |
| 自身バフ | `✨ 熱砂の香辛料の効果で「攻撃力アップ」が付与された！(2ターン)` |
| 逃走 | `💨 煙玉を使った。煙幕に乗じて逃走した！` |
| 効果なし | `（傷薬を使用したが、何も起きなかった…）` |

### 7.5 バトルアイテムフィルタ条件

`battleItems` は以下の条件でインベントリからフィルタされる：
1. `item_type === 'consumable'` または `type === 'consumable'`
2. `effect_data.use_timing === 'battle'` または `use_timing === 'battle'`
3. `quantity > 0`

### 7.6 DB の effect_data キー仕様

各バトルアイテムの `effect_data` 構成例（`items` テーブル）:

| slug | effect_data |
|---|---|
| `item_potion_s` | `{use_timing: 'battle', heal: 50}` |
| `item_potion` | `{use_timing: 'battle', heal: 150}` |
| `item_high_potion` | `{use_timing: 'battle', heal: 350}` |
| `item_roland_blessing` | `{use_timing: 'battle', heal_pct: 0.5}` |
| `item_roland_elixir` | `{use_timing: 'battle', heal_full: true}` |
| `item_antidote` | `{use_timing: 'battle', remove_effect: 'poison'}` |
| `item_yato_poison` | `{use_timing: 'battle', effect_id: 'poison', target: 'enemy', effect_duration: 3}` |
| `item_yato_smoke` | `{use_timing: 'battle', escape: true}` |
| `item_karyu_tea` | `{use_timing: 'battle', heal: 200}` |
| `item_oasis_water` | `{use_timing: 'battle', heal: 200, effect_id: 'regen'}` |
| `item_desert_spice` | `{use_timing: 'battle', effect_id: 'atk_up', effect_duration: 2}` |
| `item_karyu_charm` | `{use_timing: 'battle', effect_id: 'stun', target: 'enemy', effect_duration: 1}` |
