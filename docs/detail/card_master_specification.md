# カード（スキル）マスタ60種 仕様定義書

本仕様書は、「Code: Wirth-Dawn」のバトルロジックおよび経済システムの基盤となる、プレイヤブルおよびNPC向けのスキル（カード）マスタデータ全60種の設計ドキュメントです。

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
| `effect_val` | number | 基礎攻撃力または回復量。ダメージ式: `(ユーザーATK * 0.5) + effect_val` |
| `target_type` | string | `single_enemy`, `all_enemies`, `self`, `single_ally`, `all_allies`, `random_enemy` |
| `effect_id` | string | 状態異常（例: `poison`, `taunt`, `stun`） |

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

## 2. スキルマスタ 全60種リスト

### 🟢 カテゴリ1: 汎用スキル（10種）
**販売条件**: 全拠点のショップで安価（500〜1,500G）で販売される、または初期所持。
**特徴**: APコストが低く（1〜2）、手札の回転率をあげるためのコンボ起点。

| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price | 備考 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `card_strike` | 強打 | Skill | 1 | single_enemy | 15 | - | 500 | 基礎的な物理攻撃 |
| 2 | `card_slash` | 斬撃 | Skill | 1 | single_enemy | 12 | bleed_minor | 600 | 軽微な出血を付与 |
| 3 | `card_thrust` | 突き | Skill | 1 | single_enemy | 18 | - | 600 | 威力やや高め |
| 4 | `card_guard` | 防御 | Defense | 1 | self | 10 | def_up | 500 | 防御力を一時上昇 |
| 5 | `card_first_aid` | 応急手当 | Heal | 1 | single_ally | 20 | - | 800 | 基礎的な回復 |
| 6 | `card_shield_bash` | シールドバッシュ | Defense | 2 | single_enemy | 10 | stun | 1,200 | 低確率で行動阻害 |
| 7 | `card_focus` | 集中 | Support | 1 | self | 0 | atk_up | 1,000 | 次の攻撃ダメージ増加 |
| 8 | `card_quick_step` | クイックステップ | Support | 1 | self | 0 | evasion_up | 1,200 | 回避率上昇 |
| 9 | `card_taunt` | 挑発 | Support | 2 | all_enemies | 0 | taunt | 1,000 | 敵の攻撃を自身に集める |
| 10 | `card_throw_stone` | 石投げ | Skill | 1 | single_enemy | 5 | blind_minor | 500 | 微小ダメージと目眩まし |

### 🔵 カテゴリ2: 国家固有スキル（20種: 各国5種）
**販売条件**: 各国家限定（主に首都）のショップで中層〜高層の価格（3,000〜8,000G）で販売。
**特徴**: APコスト（2〜3）。その国の特徴（ローラン＝聖なる力、夜刀＝忍術・陰陽術）を反映。

#### ローラン聖帝国 (Roland)
| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price |
|---|---|---|---|---|---|---|---|---|
| 11 | `card_holy_sword` | 聖剣 | Magic | 3 | single_enemy | 45 | holy_burn | 6,500 |
| 12 | `card_holy_smite` | 裁き | Magic | 3 | random_enemy | 50 | - | 6,000 |
| 13 | `card_prayer` | 祈り | Heal | 2 | all_allies | 15 | regen | 4,500 |
| 14 | `card_heal` | 治癒 | Heal | 2 | single_ally | 40 | - | 4,000 |
| 15 | `card_holy_wall` | 聖壁 | Defense | 3 | all_allies | 20 | barrier | 7,000 |

#### 砂塵の王国マルカンド (Markand)
| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price |
|---|---|---|---|---|---|---|---|---|
| 16 | `card_sand_trap` | 砂の罠 | Support | 2 | single_enemy | 10 | bind | 3,500 |
| 17 | `card_sandstorm` | 砂塵の目眩まし | Support | 2 | all_enemies | 0 | blind | 4,000 |
| 18 | `card_poison_dagger`| 毒刃 | Skill | 2 | single_enemy | 20 | poison | 4,500 |
| 19 | `card_mirage` | 蜃気楼 | Support | 3 | all_allies | 0 | evasion_up | 6,500 |
| 20 | `card_oasis_water` | オアシスの水 | Heal | 2 | single_ally | 30 | cure_status | 5,000 |

#### 夜刀神国 (Yato)
| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price |
|---|---|---|---|---|---|---|---|---|
| 21 | `card_swallow_rev` | ツバメ返し | Skill | 3 | single_enemy | 50 | counter | 7,000 |
| 22 | `card_kunai` | クナイ投げ | Skill | 1 | single_enemy | 15 | bleed | 3,000 |
| 23 | `card_shadow_stitch`| 影縫い | Support | 2 | single_enemy | 0 | stun | 4,500 |
| 24 | `card_purify` | 清め | Heal | 2 | single_ally | 25 | cure_debuff | 5,500 |
| 25 | `card_iai_slash` | 居合切り | Skill | 3 | single_enemy | 60 | - | 8,000 |

#### 華龍神朝 (Karyu)
| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price |
|---|---|---|---|---|---|---|---|---|
| 26 | `card_qigong_heal` | 氣の癒やし | Heal | 2 | single_ally | 35 | regen | 5,500 |
| 27 | `card_dragon_roar` | 龍の咆哮 | Support | 3 | all_enemies | 0 | atk_down | 6,000 |
| 28 | `card_iron_body` | 鉄布衫 | Defense | 2 | self | 30 | def_up_heavy | 4,500 |
| 29 | `card_continuous` | 連撃 | Skill | 3 | single_enemy | 40 | multi_hit | 7,500 |
| 30 | `card_flying_blade` | 飛刀 | Skill | 2 | random_enemy | 25 | pierce | 4,000 |

### 🔴 カテゴリ3: NPC/英雄専用スキル（25種）
**販売条件**: ショップでは**非売品**（`not_for_sale`）。
**特徴**: APコストが高い（4〜5）または極めて強力なバフ。プレイヤーはこのスキルを持つ傭兵を高額で雇用するか、イベントを通じて手に入れる。

| No | slug | name | type | AP | target_type | effect_val | effect_id | 対象（例） |
|---|---|---|---|---|---|---|---|---|
| 31 | `card_kings_wall` | 王の城壁 | Defense | 4 | all_allies | 0 | absolute_def | 傭兵王ヴォルグ |
| 32 | `card_dragon_dive` | ドラゴンダイブ | Skill | 5 | all_enemies | 80 | def_ignore | 暴虐の竜騎士 |
| 33 | `card_miracle` | 奇跡 | Heal | 5 | all_allies | 999 | revive | 忘却の聖女 |
| 34 | `card_emp_shield` | 皇帝の盾 | Defense | 3 | single_ally | 0 | taunt_100 | 帝国大将軍レオン |
| 35 | `card_absolute_def` | 絶対防御 | Defense | 4 | self | 50 | invulnerable | 鉄壁のライアン |
| 36 | `card_hundred_fists`| 百裂拳 | Skill | 4 | single_enemy | 75 | multi_hit | 剛腕拳士 |
| 37 | `card_meteor_strike`| メテオストライク | Magic | 5 | all_enemies | 100| burn | 風雷の魔術師 |
| 38 | `card_great_heal` | 完全治癒 | Heal | 4 | single_ally | 999 | - | 司祭長アルベール |
| 39 | `card_holy_nova` | ホーリーノヴァ | Magic | 4 | all_enemies | 60 | blind | 聖騎士ジャンヌ |
| 40 | `card_assassinate` | 暗殺 | Skill | 3 | single_enemy | 50 | poison_fatal | 暗殺卿 |
| 41 | `card_demonic_slash`| 魔刃 | Skill | 4 | single_enemy | 70 | drain | 狂戦士 |
| 42 | `card_blood_rage` | 血の怒り | Support | 2 | self | 0 | atk_up_fatal | 狂戦士 |
| 43 | `card_lion_heart` | 獅子の心 | Support | 3 | all_allies | 0 | morale_up | 獅子将 |
| 44 | `card_swift_wind` | 疾風術 | Support | 2 | all_allies | 0 | spd_up | 魔術師 |
| 45 | `card_earth_shatter`| 岩砕き | Skill | 4 | all_enemies | 55 | stun | 大男バザ |
| 46 | `card_soul_rend` | 魂裂き | Magic | 4 | single_enemy | 60 | mp_drain | ダークエルフ |
| 47 | `card_phantom_strike`| 幻影撃 | Skill | 3 | random_enemy | 45 | blind | 怪盗 |
| 48 | `card_heaven_slash` | 天翔斬 | Skill | 5 | single_enemy | 120| - | 飛龍の将 |
| 49 | `card_dark_sphere` | 黒曜球 | Magic | 4 | all_enemies | 65 | curse | 仙術士 |
| 50 | `card_royal_guard` | 近衛の盾 | Defense | 3 | single_ally | 30 | cover | 龍帝の盾テイ |
| 51 | `card_dragon_scale` | 竜の鱗 | Defense | 4 | self | 40 | counter | 竜騎士 |
| 52 | `card_void_strike` | 虚空撃 | Skill | 4 | single_enemy | 80 | pierce | 剣聖ムサシ |
| 53 | `card_blessing` | 女神の祝福 | Heal | 4 | all_allies | 50 | regen | 慈愛の千代 |
| 54 | `card_death_dance` | 死の舞踊 | Skill | 4 | all_enemies | 50 | bleed | 舞闘家 |
| 55 | `card_time_stop` | 時止めの法 | Support | 5 | all_enemies | 0 | freeze | 陰陽師ハルアキ |

### 🟣 カテゴリ4: 闇市スキル（5種）
**販売条件**: 特定の崩壊進行度が高い拠点やアジト（闇市）で極少量のみ超高額（20,000G〜）で販売。
**特徴**: 強力無比だが、使用後に自身のVitalityを大きく削るなどのデメリット付き。

| No | slug | name | type | AP | target_type | effect_val | effect_id | base_price | 備考 |
|---|---|---|---|---|---|---|---|---|---|
| 56 | `card_blood_drain` | 吸血 | Magic | 3 | single_enemy | 40 | drain | 25,000 | ダメージの半分を回復 |
| 57 | `card_dark_pact` | 闇の代償 | Support | 1 | self | 0 | ap_max | 30,000 | AP全回復。代償にMAX HP-10% |
| 58 | `card_death_strike`| 即死攻撃 | Skill | 4 | single_enemy | 0 | instakill | 50,000 | 相手の耐性を無視して極大ダメージ |
| 59 | `card_mad_frenzy` | 狂戦士の薬 | Support | 1 | self | 0 | berserk | 20,000 | 制御不能になるが攻撃力3倍 |
| 60 | `card_soul_sac` | 魂の生贄 | Magic | 5 | all_enemies | 150| recoil | 40,000 | 超絶ダメージ後、自身も現在HP半減 |
