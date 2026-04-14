# カード（スキル）マスタ60種 仕様定義書 (v3.0)

本仕様書は、「Code: Wirth-Dawn」のバトルロジックおよび経済システムの基盤となる、プレイヤブルおよびNPC向けのスキル（カード）マスタデータ全60種の設計ドキュメントです。

> **v3.0 改定内容**: バトルエンジンv3.0（`statusEffects.ts` 提案A実装）に基づき、全スキル効果の実装仕様を更新。def_upを固定倍率から固定値DEF加算に変更、bleed_minor・blind・evasion_up・atk_down等の未定義効果を全実装。ツバメ返しのcounter効果を高威力攻撃に変更。

---

## 1. データ構造（テーブル設計）

スキルの実装にあたり、バトル処理用データ（`cards`）と、経済処理用データ（`items`）を分割して管理します。

### `cards` テーブル（バトルロジック用）
バトル中のダメージ計算、アクションポイント（AP）などを制御します。強力なカードほど、APおよびVitality/MPコストを高く設定します。
| カラム名 | 型 | 説明 |
|---|---|---|
| `slug` | string | 一意の識別子（例: `card_power_slash`） |
| `name` | string | スキル名称（UI表示用） |
| `type` | string | `Skill` (物理), `Magic` (魔法), `Defense` (防御), `Heal` (回復), `Support` (支援) |
| `ap_cost` | number | バトル中の消費AP（1〜5）。手札上限6枚の中で、強力なスキルはAPが重い設計。 |
| `cost_type` | string | `vitality` / `mp` |
| `cost_val` | number | 使用時の消費リソース量。 |
| `effect_val` | number | 基礎攻撃力または回復量。def_up系スキルではDEF加算値を表す。 |
| `target_type` | string | `single_enemy`, `all_enemies`, `self`, `single_ally`, `all_allies`, `random_enemy` |
| `effect_id` | string | 状態異常ID（`StatusEffectId`型定義に準拠） |
| `description` | string | バトル画面・ショップでのスキル説明文（実装効果を正確に記載） |

### `items` テーブル（経済ロジック・ショップ用）
プレイヤーが街のショップで購入（解放）するための商品データです。
| カラム名 | 型 | 説明 |
|---|---|---|
| `slug` | string | アイテムの一意の識別子（例: `item_skill_power_slash`） |
| `linked_card_slug`| string | `cards` テーブルへの外部キー連携 |
| `name` | string | ショップ用表示名（「剣術書：パワースラッシュ」など） |
| `is_skill` | boolean | 常に `true` (消費アイテムからの厳密な分離) |
| `base_price` | number | 購入金額。強力なものほど高価。 |
| `availability` | string | 販売拠点の制限ロジックタグ（例: `common`, `nation_roland`, `black_market`, `not_for_sale`） |

---

## 2. StatusEffectId 完全一覧（v3.0実装準拠）

バトルエンジンv3.0で実装済みの状態異常IDを以下に定義します。

| ID | 効果 | 付与先 | 実装詳細 |
|---|---|---|---|
| `atk_up` | 攻撃力UP | プレイヤー | 与ダメージ ×1.5 |
| `def_up` | 防御強化 | プレイヤー | **固定値加算**：受けるダメージを `value`（effect_val）分軽減 |
| `def_up_heavy` | 鉄壁防御 | プレイヤー | def_upと同処理、value=30等の高い値を持つ |
| `taunt` | 挑発 | プレイヤー | 敵の単体攻撃を自身に引きつける |
| `regen` | リジェネ | プレイヤー | ターン終了時 MaxHP×5%回復 |
| `poison` | 毒 | 敵/プレイヤー | ターン終了時 MaxHP×5%ダメージ |
| `stun` | スタン | 敵/プレイヤー | 次ターン行動不能・AP回復なし |
| `bind` | 拘束 | 敵 | stunと同処理 |
| `bleed` | 出血 | プレイヤー | カード使用ごとに**3**の追加ダメージ |
| `bleed_minor` | 軽微な出血 | プレイヤー | カード使用ごとに**1**の追加ダメージ |
| `blind` | 目潰し | 敵 | 敵の攻撃が**50%**の確率でミス |
| `blind_minor` | 軽微な目潰し | 敵 | 敵の攻撃が**30%**の確率でミス |
| `evasion_up` | 回避UP | プレイヤー | 敵の攻撃を**30%**の確率で完全回避 |
| `atk_down` | 攻撃力DOWN | 敵 | 敵の与ダメージ **×0.7**（30%軽減） |
| `fear` | 恐怖 | プレイヤー | デッキに使用不可カード混入 |
| `stun_immune` | スタン耐性 | プレイヤー | 次のスタン付与を1回無効化 |
| `cure_status` | 状態異常解除 | — | 即時：poison/bleed/stun等を解除 |
| `cure_debuff` | デバフ解除 | — | 即時：atk_down/blind等を解除 |
| `ap_max` | AP全回復 | — | 即時：APを最大値まで回復 |

---

## 3. スキルマスタ 全60種リスト

### 🟢 カテゴリ1: 汎用スキル（10種）
**販売条件**: 全拠点のショップで安価（500〜1,500G）で販売される、または初期所持。
**特徴**: APコストが低く（1〜2）、手札の回転率をあげるためのコンボ起点。

| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price | 実装効果 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `card_strike` | 強打 | Skill | 1 | single_enemy | 15 | - | 500 | 単体15固定ダメージ |
| 2 | `card_slash` | 斬撃 | Skill | 1 | single_enemy | 12 | bleed_minor | 600 | 12ダメ＋出血（軽微）2T付与（使用ごと+1dmg） |
| 3 | `card_thrust` | 突き | Skill | 1 | single_enemy | 18 | - | 600 | 単体18固定ダメージ |
| 4 | `card_guard` | 防御 | Defense | 1 | self | 10 | def_up | 500 | 2T間DEF+10（ダメージ10軽減） |
| 5 | `card_first_aid` | 応急手当 | Heal | 1 | single_ally | 20 | - | 800 | HP20回復 |
| 6 | `card_shield_bash` | シールドバッシュ | Defense | 2 | single_enemy | 10 | stun | 1,200 | 10ダメ＋1Tスタン付与 |
| 7 | `card_focus` | 集中 | Support | 1 | self | 0 | atk_up | 1,000 | 3T間ATK×1.5 |
| 8 | `card_quick_step` | クイックステップ | Support | 1 | self | 0 | evasion_up | 1,200 | 3T間30%回避 |
| 9 | `card_taunt` | 挑発 | Support | 2 | all_enemies | 0 | taunt | 1,000 | 2T間挑発（攻撃を引きつける） |
| 10 | `card_throw_stone` | 石投げ | Skill | 1 | single_enemy | 5 | blind_minor | 500 | 5ダメ＋2T軽微目潰し（30%ミス） |

### 🔵 カテゴリ2: 国家固有スキル（20種: 各国5種）
**販売条件**: 各国家限定（主に首都）のショップで中層〜高層の価格（3,000〜8,000G）で販売。
**特徴**: APコスト（2〜3）。その国の特徴（ローラン＝聖なる力、夜刀＝忍術・陰陽術）を反映。

#### ローラン聖帝国 (Roland)
| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price | 実装効果 |
|---|---|---|---|---|---|---|---|---|---|
| 11 | `card_holy_sword` | 聖剣 | Magic | 3 | single_enemy | 45 | holy_burn | 6,500 | 魔法45ダメ（DEF無視） |
| 12 | `card_holy_smite` | 裁き | Magic | 3 | random_enemy | 50 | - | 6,000 | ランダム敵に50魔法ダメ |
| 13 | `card_prayer` | 祈り | Heal | 2 | all_allies | 15 | regen | 4,500 | HP15回復＋3Tリジェネ（HP5%/T） |
| 14 | `card_heal` | 治癒 | Heal | 2 | single_ally | 40 | - | 4,000 | HP40回復 |
| 15 | `card_holy_wall` | 聖壁 | Defense | 3 | all_allies | 20 | barrier | 7,000 | 2T間DEF+20（全体、ダメージ20軽減） |

#### 砂塵の王国マルカンド (Markand)
| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price | 実装効果 |
|---|---|---|---|---|---|---|---|---|---|
| 16 | `card_sand_trap` | 砂の罠 | Support | 2 | single_enemy | 0 | bind | 3,500 | 1T拘束（行動封印） |
| 17 | `card_sandstorm` | 砂塵の目眩まし | Support | 2 | all_enemies | 0 | blind | 4,000 | 2T全体目潰し（50%ミス） |
| 18 | `card_poison_dagger`| 毒刃 | Skill | 2 | single_enemy | 20 | poison | 4,500 | 20ダメ＋3T毒（HP5%/T） |
| 19 | `card_mirage` | 蜃気楼 | Support | 3 | all_allies | 0 | evasion_up | 6,500 | 3T間全体30%回避 |
| 20 | `card_oasis_water` | オアシスの水 | Heal | 2 | single_ally | 30 | cure_status | 5,000 | HP30回復＋状態異常全解除 |

#### 夜刀神国 (Yato)
| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price | 実装効果 |
|---|---|---|---|---|---|---|---|---|---|
| 21 | `card_swallow_rev` | ツバメ返し | Skill | 3 | single_enemy | 50 | ~~counter~~ | 7,000 | **高威力の神速一撃（50固定ダメ）**。counterは未実装のため攻撃として処理。 |
| 22 | `card_kunai` | クナイ投げ | Skill | 1 | single_enemy | 15 | bleed | 3,000 | 15ダメ＋2T出血（使用ごと+3dmg） |
| 23 | `card_shadow_stitch`| 影縫い | Support | 2 | single_enemy | 0 | stun | 4,500 | 1Tスタン付与（ダメなし） |
| 24 | `card_purify` | 清め | Heal | 2 | single_ally | 25 | cure_debuff | 5,500 | HP25回復＋atk_down/blind等デバフ解除 |
| 25 | `card_iai_slash` | 居合切り | Skill | 3 | single_enemy | 60 | - | 8,000 | 60大ダメージ単体攻撃 |

#### 華龍神朝 (Karyu)
| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price | 実装効果 |
|---|---|---|---|---|---|---|---|---|---|
| 26 | `card_qigong_heal` | 氣の癒やし | Heal | 2 | single_ally | 35 | regen | 5,500 | HP35回復＋3Tリジェネ（HP5%/T） |
| 27 | `card_dragon_roar` | 龍の咆哮 | Support | 3 | all_enemies | 0 | atk_down | 6,000 | 2T間全体ATK×0.7（30%減） |
| 28 | `card_iron_body` | 鉄布衫 | Defense | 2 | self | 30 | def_up_heavy | 4,500 | 3T間DEF+30（ダメージ30軽減） |
| 29 | `card_continuous` | 連撃 | Skill | 3 | single_enemy | 40 | multi_hit | 7,500 | 2回攻撃（各20dmg）合計40ダメ |
| 30 | `card_flying_blade` | 飛刀 | Skill | 2 | random_enemy | 25 | pierce | 4,000 | 25ダメ（DEF無視貫通） |

### 🔴 カテゴリ3: NPC/英雄専用スキル（25種）
**販売条件**: ショップでは**非売品**（`not_for_sale`）。
**特徴**: APコストが高い（4〜5）または極めて強力なバフ。

| No | slug | name | type | AP | target_type | effect_val | effect_id | 実装効果 |
|---|---|---|---|---|---|---|---|---|
| 31 | `card_kings_wall` | 王の城壁 | Defense | 4 | all_allies | 0→50 | def_up | 3T間DEF+50（全体）|
| 32 | `card_dragon_dive` | ドラゴンダイブ | Skill | 5 | all_enemies | 80 | pierce | 全体80魔法ダメ（DEF無視） |
| 33 | `card_miracle` | 奇跡 | Heal | 5 | all_allies | 999 | revive | 全体HP全回復 |
| 34 | `card_emp_shield` | 皇帝の盾 | Defense | 3 | single_ally | 0 | taunt | 確定タウント（単体） |
| 35 | `card_absolute_def` | 絶対防御 | Defense | 4 | self | 50 | def_up_heavy | 2T間DEF+50（自身） |
| 36 | `card_hundred_fists`| 百裂拳 | Skill | 4 | single_enemy | 75 | multi_hit | 2回攻撃、合計75ダメ |
| 37 | `card_meteor_strike`| メテオストライク | Magic | 5 | all_enemies | 100 | poison | 全体100魔法ダメ＋毒2T |
| 38 | `card_great_heal` | 完全治癒 | Heal | 4 | single_ally | 999 | - | 単体HP全回復 |
| 39 | `card_holy_nova` | ホーリーノヴァ | Magic | 4 | all_enemies | 60 | blind | 全体60魔法ダメ＋目潰し1T |
| 40 | `card_assassinate` | 暗殺 | Skill | 3 | single_enemy | 50 | poison | 50ダメ＋毒3T |
| 41 | `card_demonic_slash`| 魔刃 | Skill | 4 | single_enemy | 70 | - | 70大ダメージ |
| 42 | `card_blood_rage` | 血の怒り | Support | 2 | self | 0 | atk_up | 3T間ATK×1.5 |
| 43 | `card_lion_heart` | 獅子の心 | Support | 3 | all_allies | 0 | atk_up | 3T間全体ATK×1.5 |
| 44 | `card_swift_wind` | 疾風術 | Support | 2 | all_allies | 0 | evasion_up | 2T間全体30%回避 |
| 45 | `card_earth_shatter`| 岩砕き | Skill | 4 | all_enemies | 55 | stun | 全体55ダメ＋スタン1T |
| 46 | `card_soul_rend` | 魂裂き | Magic | 4 | single_enemy | 60 | - | 60魔法ダメ |
| 47 | `card_phantom_strike`| 幻影撃 | Skill | 3 | random_enemy | 45 | blind | 45ダメ＋目潰し1T |
| 48 | `card_heaven_slash` | 天翔斬 | Skill | 5 | single_enemy | 120 | - | 120超大ダメージ |
| 49 | `card_dark_sphere` | 黒曜球 | Magic | 4 | all_enemies | 65 | atk_down | 全体65魔法ダメ＋ATK DOWN 2T |
| 50 | `card_royal_guard` | 近衛の盾 | Defense | 3 | single_ally | 30 | def_up | DEF+30で仲間を庇う |
| 51 | `card_dragon_scale` | 竜の鱗 | Defense | 4 | self | 40 | def_up | 2T間DEF+40（自身） |
| 52 | `card_void_strike` | 虚空撃 | Skill | 4 | single_enemy | 80 | pierce | 80ダメ（DEF無視） |
| 53 | `card_blessing` | 女神の祝福 | Heal | 4 | all_allies | 50 | regen | 全体50回復＋リジェネ3T |
| 54 | `card_death_dance` | 死の舞踊 | Skill | 4 | all_enemies | 50 | bleed | 全体50ダメ＋出血2T |
| 55 | `card_time_stop` | 時止めの法 | Support | 5 | all_enemies | 0 | stun | 全体スタン2T |

### 🟣 カテゴリ4: 闇市スキル（5種）
**販売条件**: 特定の崩壊進行度が高い拠点やアジト（闇市）で極少量のみ超高額（20,000G〜）で販売。
**特徴**: 強力無比だが使用後に自身のVitalityを大きく削るなどのデメリット付き。

| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price | 実装効果 |
|---|---|---|---|---|---|---|---|---|---|
| 56 | `card_blood_drain` | 吸血 | Magic | 3 | single_enemy | 40 | drain | 25,000 | 40魔法ダメ |
| 57 | `card_dark_pact` | 闇の代償 | Support | 1 | self | 0 | ap_max | 30,000 | AP全回復。代償：MaxHP10%自傷 |
| 58 | `card_death_strike`| 即死攻撃 | Skill | 4 | single_enemy | 0 | instakill | 50,000 | **30%確率で即死**。失敗時通常攻撃 |
| 59 | `card_mad_frenzy` | 狂戦士の薬 | Support | 1 | self | 0 | berserk | 20,000 | 3T間ATK UP |
| 60 | `card_soul_sac` | 魂の生贄 | Magic | 5 | all_enemies | 150 | recoil | 40,000 | 全体150大ダメ（DEF無視）＋MaxHP10%自傷 |

---

## 4. ツバメ返し（card_swallow_rev）設計注記

`counter`（次の敵攻撃を反射するカウンタースタンス）の実装には `BattleState` への新フィールド追加と `processEnemyTurn` での反射処理が必要なため、**現在は高威力攻撃（50固定ダメージ）として実装**。

将来の実装時の仕様案（参考）:
- カード使用 → `battleState.counterStance = true`
- 次の敵攻撃 → ダメージを反射、`counterStance = false`
- 反射中はDEF+10も付与

---

## 5. 変更履歴

| バージョン | 日付 | 主な変更内容 |
|---|---|---|
| v1.0 | 2026-03 | 初版：60種カードマスタ定義 |
| v2.0 | 2026-04-10 | ショップアイテム連携、画像URL追加 |
| **v3.0** | **2026-04-11** | **バトルエンジンv3.0対応：def_up固定値化、9種StatusEffectId追加、全カード説明文更新、ツバメ返し仕様変更** |
