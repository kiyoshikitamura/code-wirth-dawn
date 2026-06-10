# クエスト仕様書：5204 — 翡翠蛇の毒牙

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5204 |
| **Slug** | `qst_rep_jade_serpent` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 17（Hard） |
| **難度** | 4 |
| **依頼主** | 地方太守 |
| **出現条件** | 第5話「大義という名の虚妄」（6005）クリア / 滞在拠点: 華龍国拠点 / 名声 70 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 6 |
| **ノード数** | 52ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 17） |
| **サムネイル画像** | `/images/quests/bg_mountain.png` |
---

## 1. クエスト概要

### 短文説明
```
[討伐令] 翡翠鉱脈に巣を作った巨大毒蛇を排除せよ。
```

### 長文説明
```
華龍国の西方、霊山の翡翠鉱脈に巨大な毒蛇が巣を作った。
鉱脈は華龍国の重要な財源であり、採掘が停止して経済に打撃が出ている。
太守は名声ある冒険者に排除を命じた。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:3500|Exp:400|Rep:10|Evil:5`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 巣ごと壊滅（デフォルト） | 3500 | 400 | +10 | Evil:5 |
| 蛇を別の山に誘導（選択肢） | 2500 | 350 | +20 | Justice:8 |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 3日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ travel_01
             └─ travel_02
                 └─ mountain_01
                     └─ choice_path (山道選択)
                          ├─ 渓流沿い → creek_01
                          │               └─ creek_02
                          │                    └─ creek_03
                          │                         └─ merge_cave
                          └─ 尾根道 → ridge_01
                                       └─ ridge_trap (hp_damage 10%)
                                            └─ ridge_02
                                                 └─ merge_cave
                                                      └─ cave_01
                                                           └─ cave_02
                                                                └─ encounter_01
                                                                     └─ choice_snake (遭遇対応)
                                                                          ├─ 攻撃 → attack_01
                                                                          │          └─ battle_guard (子蛇戦)
                                                                          │               ├─ win → nest_01
                                                                          │               └─ lose → end_failure
                                                                          └─ 回避 → avoid_01
                                                                                     └─ avoid_02
                                                                                          └─ nest_01
                                                                                               └─ nest_02
                                                                                                    └─ nest_03
                                                                                                         └─ battle_boss
                                                                                                              ├─ win → victory_01
                                                                                                              │        └─ victory_02
                                                                                                              │             └─ choice_fate
                                                                                                              │                  ├─ 壊滅 → destroy_01
                                                                                                              │                  │          └─ destroy_02
                                                                                                              │                  │               └─ end_success
                                                                                                              │                  └─ 誘導 → lure_01
                                                                                                              │                             └─ lure_02
                                                                                                              │                                  └─ lure_03
                                                                                                              │                                       └─ end_success_peace
                                                                                                              └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_har_city, bgm: bgm_quest_calm, speaker: 太守の使者
```text
「太守閣下から直々の依頼だ。翡翠鉱脈に大蛇が巣を作った」
```

#### `start_02`（text）
**演出:** bg: bg_har_city, bgm: bgm_quest_calm, speaker: 太守の使者
```text
「鉱脈は国の財源だ。採掘が止まれば民の暮らしに響く」
```

#### `start_02_02`（text）
**演出:** bg: bg_har_city, bgm: bgm_quest_calm
```text
（翡翠は華龍国の特産品だ。経済が停滞すれば太守の立場も危ういな）
```

#### `start_03`（text）
**演出:** bg: bg_har_city, bgm: bgm_quest_calm
```text
翡翠鉱脈は霊山の中腹にある。大蛇の巣に辿り着くには山道を越えねばならない。
```

#### `start_03_02`（text）
**演出:** bg: bg_har_city, bgm: bgm_quest_calm
```text
（使者は焦るように指示書を押しつけ、都の宮殿の方へと立ち去った）
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
霊山の麓に着いた。山の空気が澄んでいるが、どこか不穏な気配がある。
```

#### `travel_01_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
（見上げれば霊峰の峰々に厚い雲が立ち込め、鳥の鳴き声すら聞こえない）
```

#### `travel_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_field
```text
山道に入ると、蛇の脱け殻が散乱していた。鱗の大きさから、相当な巨体だ。
```

#### `mountain_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
山道が二手に分かれている。渓流沿いの道と、尾根を行く道だ。
```

#### `choice_path`（choice）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「渓流沿いの道を行く——水場なら蛇の痕跡を追える」 | `creek_01` |
| 「尾根道を行く——高所から巣の位置を見下ろせるはず」 | `ridge_01` |

#### `creek_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
渓流沿いを進む。清水が岩を洗い、心地よい音を立てている。
```

#### `creek_01_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
（水辺の湿った砂の上に、這った跡がはっきりと残されている）
```

#### `creek_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
水辺に巨大な蛇 of 足跡を発見。この方向で間違いない。
```

#### `creek_03`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
**次ノード:** `merge_cave`
```text
渓流を遡ると、岩壁に大きな洞窟の入口が見えた。蛇の巣はあの中だ。
```

#### `ridge_01`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
尾根道を登る。見晴らしは良いが、足場が悪い。突風が吹き——！
```

#### `ridge_01_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
```text
（突風に足元をすくわれ、小石が音を立てて谷底へと落ちていく）
```

#### `ridge_trap`（hp_damage）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
足場が崩れ、転落しかけた！ 岩に掴まったが腕を負傷した。
```

#### `ridge_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_tense
**次ノード:** `merge_cave`
```text
傷を押さえながら尾根を越えた。上から巣の位置は把握できた。洞窟に向かう。
```

#### `merge_cave`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
洞窟に入った。翡翠の鉱脈が壁面に光っているが、地面には毒液の跡がある。
```

#### `cave_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
奥に進むと、生温い空気が漂う。蛇の巣は近い。
```

#### `cave_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（壁面を覆う翡翠の緑光が、暗闇を冷たく照らし出している）
```

#### `cave_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
通路の先で、小型の蛇が数匹蠢いている。親蛇の子供だろうか。
```

#### `encounter_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
子蛇たちがこちらに気づいた。攻撃してくるか——それとも回り道するか。
```

#### `choice_snake`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「邪魔だ。排除する」 | `attack_01` |
| 「刺激せず迂回する」 | `avoid_01` |

#### `attack_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
子蛇たちを攻撃する。小さいが毒牙は鋭い——油断はできない！
```

#### `attack_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（大剣を抜き払い、襲いかかってくる子蛇たちを牽制する！）
```

#### `battle_guard`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 120, next: `nest_01`, fail: `end_failure_01`

#### `avoid_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
子蛇を刺激しないよう、壁際を慎重に進む。息を殺し、足音を消す。
```

#### `avoid_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
（静かに重心を移しながら、岩の影を縫うように歩を進めていく）
```

#### `avoid_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
無事に通過できた。子蛇たちは気づかなかったようだ。体力を温存できた。
```

#### `nest_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
洞窟の最奥、翡翠が密集する広大な空間に出た。ここが巣の本体だ。
```

#### `nest_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（中央には大量の卵が産み落とされ、翡翠の輝きを受けて淡く光っている）
```

#### `nest_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
```text
天井から巨大な鱗が覗いている。翡翠色の光を帯びた大蛇——翡翠大蛇だ。
```

#### `nest_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
```text
大蛇がゆっくりと頭をもたげた。翡翠色の瞳がこちらを見つめている。臨戦態勢だ。
```

#### `battle_boss`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9064, next: `victory_01`, fail: `end_failure_01`

#### `victory_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
翡翠大蛇が力なく横たわった。まだ息はあるが、抵抗する力は残っていない。
```

#### `victory_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
（巨躯がズシンと地面を揺らして倒れ込み、洞窟内の毒気が霧散していく）
```

#### `victory_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
巣ごと壊滅させれば鉱脈は安全になる。だが、この蛇は翡翠の精霊とも言われている。別の山に誘導する手もある。
```

#### `choice_fate`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「巣ごと壊滅させる。鉱脈の安全が最優先だ」 | `destroy_01` |
| 「蛇を別の山に誘導する。霊山の精霊を殺すべきではない」 | `lure_01` |

#### `destroy_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
大蛇と卵を全て処分した。鉱脈は完全に安全になった。だが、翡翠の輝きが少し鈍くなった気がする。
```

#### `destroy_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（精霊の死によって、鉱脈を照らしていた光が弱まっていくのを感じた）
```

#### `destroy_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
太守に報告した。鉱脈の再開が命じられ、手厚い報酬を受け取った。
```

#### `end_success`（end_success）
**演出:** bg: bg_har_city
```text
「翡翠鉱脈の脅威を排除した功績、高く評価する」
採掘が再開し、華龍国の経済は息を吹き返した。
```
**rewards:** Gold:3500, Exp:400, Rep:10, Evil:5

#### `lure_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
薬草を焚き、大蛇を別の山へ誘導する。蛇は静かに従った。精霊の知恵があるのかもしれない。
```

#### `lure_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
（大蛇は感謝するかのように一度首を傾げ、闇の奥へ消え去っていった）
```

#### `lure_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
大蛇は隣の霊山に新しい巣を作った。翡翠鉱脈は無事だが、完全な解決とは言いづらい。
```

#### `lure_02_02`（text）
**演出:** bg: bg_mountain, bgm: bgm_quest_calm
```text
（それでも、霊山の豊かな自然は壊されずに保たれた。これでいいはずだ）
```

#### `lure_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
太守には「蛇は排除した」と報告した。嘘はついていない——場所を移しただけだ。
```

#### `end_success_peace`（end_success）
**演出:** bg: bg_karyu_village
```text
「鉱脈は無事か。ご苦労」太守は満足げだ。だが報酬は控えめだった。
山の老人が静かに頭を下げた。「精霊を守ってくれて感謝する」
```
**rewards:** Gold:2500, Exp:350, Rep:20, Justice:8

#### `end_failure_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
大蛇の強烈な尾の一撃が体に叩きつけられる。岩壁に叩きつけられ意識を失った。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_crypt
```text
翡翠大蛇の毒牙が閃いた。全身に毒が回り、意識が遠のいていく。
```
**rewards:** Gold:0