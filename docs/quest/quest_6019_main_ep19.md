# クエスト仕様書：6019 — 第19話「システム・オーバーライド」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6019 |
| **Slug** | `main_ep19` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 22（Hard） |
| **難度** | 6 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 前提クエストクリア: main_ep18 / 滞在拠点: ローランド聖王国拠点 |
| **リピート** | アカウント通じて1回のみ（継承後も非表示） |
| **難易度Tier** | Hard（rec_level: 22） |
| **サムネイル画像** | `/images/quests/bg_boss_altar.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
メインシナリオ第19話
```

### 長文説明
```
神の定めた運命のシステムを内側から破壊する。かつて国境で、砂漠で共に戦った戦友たちが駆けつけ、君の背中を守る。
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:10000|Rep:40
```

---

## 3. シナリオノード構成

### 簡易フロー
```text
start
  └─ start
  └─ text1
  └─ text2
  └─ text2_1
  └─ text3
  └─ text3_1
  └─ battle
      ├─[仲間と共に道を切り開く]→ N/A
  └─ text_post_battle
  └─ end_node
```

### ノード詳細

#### `start`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
神々が座す天界――「神域」への回廊は、冷たく透明なクリスタルで形成されていた。空間そのものが聖なる威圧感に満ちており、ただ息をするのすら苦しい。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text1
```

---

#### `text1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
足元には、数多の星々の瞬きや、下界で今なお続く戦争の炎が透けて見え、神々がどれほど高い場所から人間を見下してきたのかが痛いほど伝わってくる。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text2
```

---

#### `text2`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
『神意ニ逆ラウ愚者ヨ。分ヲ弁エヌ傲慢ナル命ニ、天罰ヲ下ス』
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text2_1
```

---

#### `text2_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
玉座へ続く天の回廊に、三対の黄金の翼を背負った、これまでの戦いでも見たことのない最高位の熾天使（神兵）が舞い降りた。神の門番だ。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text3
```

---

#### `text3`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
「……悪いが、こっちには死に急ぐ暇はないんでね。そこをどけ」君が剣を構えた、その時だった。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
text3_1
```

---

#### `text3_1`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
君の背後にある裂け目から、荒々しい足音と共に何者かが次々と飛び込んでくる。彼らのマントには、ローラン、マルカンド、夜刀、華龍……様々な国の紋章が刻まれていた。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
battle
```

---

#### `battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
かつて国境で、砂漠で、街で共に戦った傭兵や兵士たちが、国境や人種の壁を越え、君という刃の『後陣』を務めるために駆けつけてきたのだ！
```
**次ノード:** `{type:battle, enemy_group_id:220}` (auto-advance)
**params:**
```json
choice1
```

---

#### `text_post_battle`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
「前だけ見て走れェ！背中の羽虫どもは俺たちが引き受ける！」傭兵たちの雄叫びを背に受け、君は最高位の神兵の胸を真っ向から貫き、弾き飛ばした。
```
**次ノード:** `{type:text, bg:bg_boss_altar}` (auto-advance)
**params:**
```json
end_node
```

---

#### `end_node`
**演出パラメータ:**
- **BGM**: `bgm_quest_crisis`
- **SE**: `—`
- **背景画像**: `bg_boss_altar`

**テキスト:**
```
無数の支援を受けながら、ついに最後の関門を突破した。全ての争いの元凶である主神の玉座へと続く、白亜の扉がゆっくりと開かれる。
```
**次ノード:** `{type:end_success}` (auto-advance)
**params:**
```json

```

---


