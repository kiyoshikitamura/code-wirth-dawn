Code: Wirth-Dawn Specification v15.0 (Character Creation)
# Character Creation & Aging Mechanics

## 1. 概要 (Overview)
キャラクター作成時の入力パラメータ、初期ステータスの決定ロジック、加齢/老化による能力減衰を定義する。

<!-- v15.0: 初期ステータスを全体的に上方修正。基底値・年齢補正にランダム変数を導入。 -->

---

## 2. キャラクター作成 (Character Creation)

### 2.1 入力パラメータ
| パラメータ | 型 | 検証 |
|---|---|---|
| 名前 (Name) | TEXT | 1〜16文字 |
| 性別 (Gender) | ENUM | 'Male' / 'Female' / 'Unknown' |
| 開始年齢 (Age) | INT | 15〜40 歳 |

### 2.2 初期ステータス（基底値）

<!-- v15.0: HP/ATK/DEFを上方修正。ランダム変数を加算して個性を演出 -->

| ステータス | 計算式 | 備考 |
|---|---|---|
| Level | 1 | 固定 |
| EXP | 0 | 固定 |
| HP / Max HP | `85 + Math.floor((Age - 15) * randFloat(1.5, 2.0))` | 15歳=85, 40歳=122〜135 のランダム幅 |
| ATK | `randInt(1, 3)` | 基底値でランダム（年齢補正が別途加わる） |
| DEF | `randInt(1, 3)` | 基底値でランダム（年齢補正が別途加わる） |
| Gold | `800 + randInt(100, 400)` | 900〜1200G のランダム幅 |
| Vitality | 年齢補正で決定（§2.3参照） | |
| Max Vitality | Vitality と同値（作成時点） | |
| Max Deck Cost | 12 | `BASE_DECK_COST(8) + (1 * COST_PER_LEVEL(2)) + 2` |
| avatar_url | `/avatars/adventurer.jpg` | デフォルト画像（固定） |

**ランダム関数定義:**
```typescript
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => min + Math.random() * (max - min);
```

### 2.3 年齢による初期ステータスボーナス・制約

初期開始年齢は15〜40歳の間で選択可能。年齢帯ごとに Vitality とステータスボーナスが決まる。
UI上では、年齢スライダーを動かした際に「動的フレーバーテキスト」と「適用される初期ステータス（ステータスプレビュー）」がリアルタイムに表示される。

<!-- v15.0: 全補正値をランダム変数化 -->

| 年齢帯 | フレーバーテキスト | Vitality | HP ボーナス | ATK ボーナス | DEF ボーナス |
|---|---|---|---|---|---|
| 15-19 | 「若さは最大の武器...」 | 100（固定） | `+ randInt(0, 10)` | `+ randInt(0, 2)` | `+ randInt(0, 2)` |
| 20-29 | 「心身ともに円熟の時...」 | `randInt(85, 95)` | `+ randInt(0, 10)` | `+ randInt(0, 2)` | `+ randInt(0, 2)` |
| 30-39 | 「経験は盾となり...」 | `randInt(70, 80)` | `+ randInt(10, 20)` | `+ randInt(1, 3)` | `+ randInt(1, 3)` |
| 40 | 「黄昏の時が近づく...」 | 60（固定） | `+ randInt(20, 30)` | `+ randInt(2, 4)` | `+ randInt(2, 4)` |

**最終 HP 例（15歳）:**
```
baseHp = 85 + floor(0 * randFloat(1.5, 2.0)) = 85
hp = 85 + randInt(0, 10) = 85〜95
```

**最終 HP 例（40歳）:**
```
baseHp = 85 + floor(25 * randFloat(1.5, 2.0)) = 122〜135
hp = baseHp + randInt(20, 30) = 142〜165
atk = randInt(1,3) + randInt(2,4) = 3〜7
```

---

## 3. 加齢ロジック (Aging Logic)
<!-- v11.0: questService.processAging() の実装を正として反映 -->

### 3.1 年齢の進み方
- クエスト完了時に `daysPassed` 日が経過。
- `age_days` に加算し、365日到達でインクリメント。

```typescript
function processAging(age: number, ageDays: number, daysPassed: number) {
  let newAge = age;
  let newAgeDays = ageDays + daysPassed;
  let decay = { vit: 0, atk: 0, def: 0 };

  while (newAgeDays >= 365) {
    newAge++;
    newAgeDays -= 365;
    // Apply decay based on new age
  }
  return { newAge, newAgeDays, decay };
}
```

### 3.2 老化による能力減衰 (Decay)
<!-- v11.0: processAging() の実装値を正確に反映 -->

| 年齢帯 | Vitality 減算 | ATK 減算 | DEF 減算 | 備考 |
|---|---|---|---|---|
| 40-49 | -2 / 年 | -1 / **偶数年** | -1 / **偶数年** | `newAge % 2 === 0` 判定 |
| 50-59 | -5 / 年 | -1 / 年 | -1 / 年 | |
| 60+ | -10 / 年 | -2 / 年 | -2 / 年 | 急激な衰え |

> **Note (v11.0)**: 40代の「2年に1回」は実装では `newAge % 2 === 0`（偶数年）判定で実装されている。

### 3.3 減衰の適用
```
updates.max_vitality = Max(0, current_max_vitality - decay.vit)
updates.vitality = Min(current_vitality, updates.max_vitality)
updates.atk = Max(1, current_atk - decay.atk)
updates.def = Max(1, current_def - decay.def)
```

- ATK/DEF の最低値は **1**（0にはならない）。

---

## 4. UserProfile 日齢フィールド
<!-- v11.0: types/game.ts を反映 -->
```typescript
export interface UserProfile {
  age?: number;           // 現在の年齢
  age_days?: number;      // 現年齢内の経過日数 (365でリセット)
  vitality?: number;      // 現在Vitality
  max_vitality?: number;  // 加齢で減少するVitality上限
  gender?: 'Male' | 'Female' | 'Unknown';
  title_name?: string;    // ランダム生成等で付与される称号
  // ...
}
```

### 4.1 UI表現への適用 (v12.0)
- **現在年齢表示**: プレイヤーの現在年齢は `age + (age_days / 365)` を基準としてUI表示する。
- **暦（カレンダー）表示**: `age_days`（クエスト経過日数の累計）を利用し、ゲーム内の世界観に合わせた暦に変換して画面上部のヘッダーに表示する。
- **健康状態 (Vitality)**: `vitality` が **20以下** となった場合、赤色点滅等の目立つ警告表示を行う。

---

## 5. UI/UX

### 5.1 キャラクター作成フロー
1. タイトル画面（Wait Mode）から「Tap to Start」でメニュー展開（Menu Mode）へ移行。
2. 「New Game」を選択するとキャラクター作成画面へ遷移。
3. キャラクター作成画面が表示され、名前（イタリック体）・性別（ボタン）・年齢（スライダー 15〜40歳）を入力。
4. スライダーの年齢値に応じて、羽根ペンで書かれたような「動的フレーバーテキスト」が即座に切り替わって表示される。
   - 15〜19歳：「若さは最大の武器...」
   - 20〜29歳：「心身ともに円熟の時...」
   - 30〜39歳：「経験は盾となり...」
   - 40歳：「黄昏の時が近づく...」
5. **動的フレーバーテキストの直下**に、その年齢で決定される「生成される開始ステータス（HP, ATK, DEF, Max Vitality 等）」をリアルタイムプレビューとして表示する。
   - ただしプレビューはランダム幅の**中央値（平均）**を表示し、実際の値は作成時に決定される。
6. 確認後、「世界に降り立つ」ボタンを押下。
7. `POST /api/character/create` / `POST /api/profile/calculate-stats` でプロフィールデータを作成。
8. 完了後、ゲーム本編（プロローグまたは拠点）へ遷移する。

### 5.2 老化通知
- 年齢増加時にバトルログまたはクエスト結果画面で通知。
- Vitality が 20 以下になったら赤色警告。

---

## 6. 変更履歴

| バージョン | 日付 | 主な変更内容 |
|---|---|---|
| v11.0 | 2026-04 | processAging()の実装に合わせて全面改訂 |
| v12.1 | 2026-04 | avatar_url 追加 |
| **v15.0** | **2026-04-13** | **初期ステータス上方修正。HP/ATK/DEF/Gold の基底値・年齢補正にランダム変数を導入。旧固定値を全て削除。** |