# クエスト仕様書：6013 — 第13話「不死の傭兵王」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6013 |
| **Slug** | `main_ep13` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 13（Hard） |
| **難度** | 3 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 前提クエストクリア: main_ep12 / 滞在拠点: 華龍国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Hard（rec_level: 13） |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ゲストNPC** | ヴォルグ（戦闘後にパーティ加入。クリア後は酒場にもランダム出現） |
| **ノード数** | 11ノード（うち選択肢1件） |
| **サムネイル画像** | `/images/quests/bg_bandit_camp.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第13話
```

### 長文説明
```
闘技都市に君臨する「不死の傭兵王」。神を討つための力を得るため、君は伝説の戦士に挑む。この男を越えられなければ、天上の神々を討つことなど叶わない。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Exp:800|Gold:3500|Rep:20
```

---

## 3. シナリオノード構成

### 簡易フロー
```text
start
  └─ start
  └─ text1
  └─ text1_1
  └─ text2
  └─ text3
  └─ text4
  └─ battle
      ├─[限界を越えて証明する]→ N/A
  └─ text_post_battle
  └─ text_post_battle2
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
黄河の大防衛戦を生き延びた君は、負傷兵たちでごった返す後方の野戦陣地で、ある一人の男と出会った。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
無精髭を生やし、酒瓶を傾ける老境の剣士。だが、その瞳の奥には異常なほど獰猛な狂気と、計り知れない覇気が宿っている。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text1_1
```

---

#### `text1_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
彼は噂に名高い「不死の傭兵王」――ヴォルグ。これまで数え切れないほどの戦場を渡り歩き、死線を超え続けてきた生きた伝説だった。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「……よくここまで生き延びたな、若僧。だが、お前の眼はもう限界だと叫んでいるぜ」ヴォルグは君の剣を見て、鼻で笑った。
```
**次ノード:** `{type:text, bg:bg_bandit_camp, speaker_image_url:/images/npcs/npc_guest_volg.png}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「神だか何だか知らねェが、相手が強すぎるって顔だ。だがな、壁を越えられねぇ奴はここで死ぬ。生き恥を晒して老いさらばえるか、世界を変える特異点になるか……俺に証明してみせろ！」
```
**次ノード:** `{type:text, bg:bg_bandit_camp, speaker_image_url:/images/npcs/npc_guest_volg.png}` (auto-advance)
**params:**
```json
text4
```

---

#### `text4`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
ヴォルグが背に負った大剣を抜いた瞬間、周囲の空気が重く沈み込んだ。先ほど黄河で対峙した熾天使すら凌駕するほどの、濃密な血の匂いと殺気が君を包み込む。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
彼との戦いは、神を討つための試練だ。伝説の傭兵王を越えられなくて、どうして天上の神々を討てようか！
```
**次ノード:** `{type:battle, enemy_group_id:213}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
火花の散る激しい打ち合い。君の体力はとっくに尽きていたが、死地で研ぎ澄まされた直感が、最後の一撃を誘導した。重い剣撃を紙一重で躱し、君の切っ先がヴォルグの首筋で止まる。
```
**次ノード:** `{type:text, bg:bg_bandit_camp}` (auto-advance)
**params:**
```json
text_post_battle2
```

---

#### `text_post_battle2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「……フン、悪くない。ギリギリで命を拾ったな」ヴォルグは満足げに笑い、大剣を下ろした。
```
**次ノード:** `{type:text, bg:bg_bandit_camp, speaker_image_url:/images/npcs/npc_guest_volg.png}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_bandit_camp`

**テキスト:**
```
「お前なら、あの『天上の神』の眉間に一矢報いれるかもしれんな。……行け。俺たちの代わりに、神の玉座に唾を吐いてこい！」その言葉を受けた君の目に、再び強い光が宿った。
```
**次ノード:** `{type:end_success, speaker_image_url:/images/npcs/npc_guest_volg.png}` (auto-advance)
**params:**
```json

```

---


