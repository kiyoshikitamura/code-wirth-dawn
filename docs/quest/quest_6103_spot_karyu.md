# クエスト仕様書：6103 — 天を衝く塔 ―華龍の秘宝と、神の遊戯―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6103 |
| **Slug** | `qst_spot_karyu` |
| **クエスト種別** | スポットシナリオ（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 天命の使者 |
| **出現条件** | メインep12クリア / 華龍拠点滞在 / 悪(Evil)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **ノード数** | [CSV作成後に追記] |
| **サムネイル画像** | `/images/quests/bg_spot_karyu_tower.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
世界の中心「虚無の塔」。華龍の四方に座す四神を討ち、神の残酷な遊戯を終わらせよ。
```

### 長文説明
```
塔の頂上には願いを叶える楽園があるとされる。
しかし、神の結界により近づく事はできない。解くためには四神討伐が必要だ。
すべては、高みで退屈を貪る「神」が仕掛けた遊戯であった。
```

---

## 2. 報酬定義

**ルートA（神の座を継ぐルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:625
```

**ルートB（塔を破壊するルート）— endノードparamsで付与:**
```
Exp:500|Rep:-100|Item:626
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 621 | `spot_orb_seiryu` | 青龍の宝珠 | passive | ATK+3 | 道中(青龍撃破後) |
| 622 | `spot_orb_byakko` | 白虎の宝珠 | passive | DEF+3 | 道中(白虎撃破後) |
| 623 | `spot_orb_suzaku` | 朱雀の宝珠 | passive | HP+5 | 道中(朱雀撃破後) |
| 624 | `spot_orb_genbu` | 玄武の宝珠 | passive | DEF+2, HP+3 | 道中(玄武撃破後) |
| 625 | `spot_divine_glaive` | 天道の薙刀 | equipment/weapon | ATK+15, DEF+10 | ルートA |
| 626 | `spot_deus_machina` | 神殺しの光芒 | skill(card) | dmg50+自傷10%, deck_cost:12 | ルートB |

---

## 3. シナリオノード構成

### 全体フロー
```text
start
  └─[続ける]→ choose_path
       ├─[東の青龍]→ trap_seiryu → boss_seiryu → reward_orb_1 → choose_path
       ├─[西の白虎]→ trap_byakko → boss_byakko → reward_orb_2 → choose_path
       ├─[南の朱雀]→ trap_suzaku → boss_suzaku → reward_orb_3 → choose_path
       ├─[北の玄武]→ trap_genbu  → boss_genbu  → reward_orb_4 → choose_path
       └─[中央の塔へ(要: 宝珠4つ)]→ check_orbs
            ├─[所持]→ final_boss_kami
            │    ├─[勝利]→ final_choice
            │    │    ├─[神の座を継ぐ]→ end_rule
            │    │    └─[塔を破壊する]→ end_destroy
            │    └─[敗北]→ end_failure
            └─[未所持]→ choose_path (戻る)
```

### ノード詳細

#### `start`（type: text）
- **BGM**: `bgm_karyu` / **背景**: `bg_spot_karyu_tower`

**テキスト:**
```
天から神の声明が降り注ぐ。
結界を破るため、四神の宝珠を集めてこいと。
```
**params:** `{"type":"text", "bgm":"bgm_karyu", "bg":"bg_spot_karyu_tower"}`

---

#### `choose_path`（type: text）
- **BGM**: `bgm_quest_mystery` / **背景**: `bg_spot_karyu_tower`

**テキスト:** `どの試練から挑むか。`

**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 東の青龍 | `trap_seiryu` |
| 西の白虎 | `trap_byakko` |
| 南の朱雀 | `trap_suzaku` |
| 北の玄武 | `trap_genbu` |
| 中央の塔へ進む | `check_orbs` |

---

#### `trap_seiryu`（type: modify_state）
- **背景**: `bg_spot_karyu_thunder`

**テキスト:** `落雷の洗礼！ HPが減少した状態で戦闘が始まる。`
**params:** `{"type":"modify_state", "bg":"bg_spot_karyu_thunder", "hp_percent":-20}`

---

#### `boss_seiryu`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_thunder`

**テキスト:** `雷雲を従える「青龍」が姿を現した。東の守護神。`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_karyu_thunder", "enemy_group_id":"spot_karyu_seiryu"}`

---

#### `reward_orb_1`（type: reward）
**テキスト:** `青龍を打倒した。青龍の宝珠を手に入れた！`
**params:** `{"type":"reward", "items":["621"]}`

---

#### `trap_byakko`（type: modify_state）
- **背景**: `bg_spot_karyu_thunder`

**テキスト:** `猛吹雪が塔を包む。凍てつく風がHPを削る。`
**params:** `{"type":"modify_state", "bg":"bg_spot_karyu_thunder", "hp_percent":-20}`

---

#### `boss_byakko`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_thunder`

**テキスト:** `白銀の毛並みに風を纏った「白虎」が唸りを上げた。西の守護神。`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_karyu_thunder", "enemy_group_id":"spot_karyu_byakko"}`

---

#### `reward_orb_2`（type: reward）
**テキスト:** `白虎を打倒した。白虎の宝珠を手に入れた！`
**params:** `{"type":"reward", "items":["622"]}`

---

#### `trap_suzaku`（type: modify_state）
- **背景**: `bg_spot_karyu_thunder`

**テキスト:** `足元から業火が噴き上がる。灼熱がHPを焼く。`
**params:** `{"type":"modify_state", "bg":"bg_spot_karyu_thunder", "hp_percent":-20}`

---

#### `boss_suzaku`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_thunder`

**テキスト:** `紅蓮の翼を広げた「朱雀」が天井から舞い降りた。南の守護神。`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_karyu_thunder", "enemy_group_id":"spot_karyu_suzaku"}`

---

#### `reward_orb_3`（type: reward）
**テキスト:** `朱雀を打倒した。朱雀の宝珠を手に入れた！`
**params:** `{"type":"reward", "items":["623"]}`

---

#### `trap_genbu`（type: modify_state）
- **背景**: `bg_spot_karyu_thunder`

**テキスト:** `大地が波打ち足場が崩れる。岩に押し潰されそうだ。`
**params:** `{"type":"modify_state", "bg":"bg_spot_karyu_thunder", "hp_percent":-20}`

---

#### `boss_genbu`（type: battle）
- **BGM**: `bgm_battle_strong` / **背景**: `bg_spot_karyu_thunder`

**テキスト:** `黒曜石の甲羅を持つ巨亀「玄武」。蛇の尾が毒を吐く。北の守護神。`
**params:** `{"type":"battle", "bgm":"bgm_battle_strong", "bg":"bg_spot_karyu_thunder", "enemy_group_id":"spot_karyu_genbu"}`

---

#### `reward_orb_4`（type: reward）
**テキスト:** `玄武を打倒した。玄武の宝珠を手に入れた！`
**params:** `{"type":"reward", "items":["624"]}`

---

#### `check_orbs`（type: check_possession）
> 宝珠4つ全所持チェック。現行`check_possession`は1アイテムのみ対応のため、4回連続チェックまたは拡張が必要。

**params:** `{"type":"check_possession", "item_id":"621", "quantity":1}`
※実装時に4アイテムチェックへの対応が必要。

---

#### `final_boss_kami`（type: battle）
- **BGM**: `bgm_spot_final_boss` / **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
塔の最上階。
すべての理を操る「神」自身が牙をむいた。
```
**params:** `{"type":"battle", "bgm":"bgm_spot_final_boss", "bg":"bg_spot_karyu_throne", "enemy_group_id":"spot_karyu_kami"}`

---

#### `final_choice`（type: text）
- **BGM**: `bgm_spot_final_choice` / **背景**: `bg_spot_karyu_throne`

**テキスト:**
```
神は倒れ、力を失いゆく。
消えゆく神が「最後の問い」を投げかける。
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 神の代理人として統べる | `end_rule` |
| 神の理を破壊し自由を掴む | `end_destroy` |

---

#### `end_rule`（type: end）
**テキスト:**
```
神の座を引き継ぎ、新たな絶対者となった。
秩序は守られるが、人々は再び意思を奪われた。天道の薙刀を手に入れた。
```
**params:** `{"type":"end", "result":"success", "rewards":{"exp":500, "gold":10000, "reputation":200, "items":["625"]}}`

---

#### `end_destroy`（type: end）
**テキスト:**
```
神の力を拒否し、塔を破壊した。天界と地上の繋がりは完全に断たれた。
人の時代が幕を開ける。固有スキル『神殺しの光芒』を手に入れた！
```
**params:** `{"type":"end", "result":"success", "rewards":{"exp":500, "reputation":-100, "items":["626"]}}`

---

#### `end_failure`（type: end）
**テキスト:**
```
力及ばず、塔の試練に敗れた。神の嘲笑だけが虚空に響く。
```
**params:** `{"type":"end", "result":"failure"}`
