Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# Character Creation & Aging Mechanics

## 1. 概要 (Overview)
キャラクター作成時の入力パラメータ、初期ステータスの決定ロジック、加齢/老化による能力減衰を定義する。

<!-- v11.0: processAging()の実装に合わせて老化ロジックを更新 -->

---

## 2. キャラクター作成 (Character Creation)

### 2.1 入力パラメータ
| パラメータ | 型 | 検証 |
|---|---|---|
| 名前 (Name) | TEXT | 1〜16文字 |
| 性別 (Gender) | ENUM | 'Male' / 'Female' / 'Unknown' |
| 開始年齢 (Age) | INT | 15〜40 歳 |

### 2.2 初期ステータス
<!-- v11.0: 実装の初期値を反映 -->
<!-- v12.1: avatar_url を追加 -->
| ステータス | 初期値 | 備考 |
|---|---|---|
| Level | 1 | |
| EXP | 0 | |
| HP | `85 + Math.floor((Age - 15) * 1.5)` | 実装値。年齢スケール（15歳=85, 40歳=122） |
| Max HP | `85 + Math.floor((Age - 15) * 1.5)` | |
| ATK | 1 | |
| DEF | 1 | |
| Vitality | 100 | 寿命 |
| Max Vitality | 100 | |
| Gold | 1000 | 初期所持金 |
| Max Deck Cost | 12 | `10 + (1 * 2)` |
| avatar_url | `/avatars/adventurer.jpg` | デフォルト画像（固定） |

### 2.3 年齢による初期ステータスボーナス・制約
初期開始年齢は15〜40歳の間で選択可能。年齢に応じた初期ボーナスと寿命（Max Vitality）が設定される。
UI上では、年齢スライダーを動かした際に「動的フレーバーテキスト」と「適用される初期ステータス（ステータスプレビュー）」がリアルタイムに表示される。

| 年齢帯 | フレーバーテキスト | Max Vitality修正 | ATK/DEF修正 | 特徴 |
|---|---|---|---|---|
| 15-19 | 「若さは最大の武器...」 | 100 (最大) | ±0 | バランス型 |
| 20-29 | 「心身ともに円熟の時...」 | 85-95 | ATK = 2〜3 | 戦闘向き |
| 30-39 | 「経験は盾となり...」 | 70-80 | +1 ATK, +1 DEF | 熟練型 |
| 40 | 「黄昏の時が近づく...」 | 60 | +2 ATK, +1 DEF | 短命だが初期経験値ボーナス・能力高 |

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

> **Note (v11.0)**: 仕様書v9の「40代: 2年に1回」は実装では `newAge % 2 === 0`（偶数年）判定で実装されている。

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
- **暦（カレンダー）表示**: `age_days`（クエスト経過日数の累計）を利用し、ゲーム内の世界観に合わせた暦（例: 「帝国暦 〇〇年 〇の月 〇日」）に変換して画面上部のヘッダーに表示する。
- **健康状態 (Vitality)**: `vitality` が **20以下** となった場合、死が迫っていることを警告するため、ヘッダーUI上で赤色点滅等の目立つ警告表示を行う。

---

## 5. UI/UX

### 5.1 キャラクター作成フロー
1. タイトル画面（Wait Mode）から「Tap to Start」でメニュー展開（Menu Mode）へ移行。
2. 「New Game」を選択するとキャラクター作成画面へ遷移。（現行のアノニマスログイン等と連動）
3. キャラクター作成画面が表示され、名前（イタリック体）・性別（ボタン）・年齢（スライダー 15〜40歳）を入力。
4. スライダーの年齢値に応じて、羽根ペンで書かれたような「動的フレーバーテキスト」が即座に切り替わって表示される。
   - 15〜19歳：「若さは最大の武器...」
   - 20〜29歳：「心身ともに円熟の時...」
   - 30〜39歳：「経験は盾となり...」
   - 40歳：「黄昏の時が近づく...」
5. **動的フレーバーテキストの直下**に、その年齢で決定される「生成される開始ステータス（HP, ATK, DEF, Max Vitality 等）」をリアルタイムプレビューとして表示する。
6. 確認後、「世界に降り立つ」ボタン（ホバー時にコンパス回転や微振動の演出）を押下。
7. `POST /api/character/create` でプロフィールデータを作成。`avatar_url` に `/avatars/adventurer.jpg`（デフォルト）が自動設定される。
8. 完了後、ゲーム本編（プロローグまたは拠点）へ遷移する。

### 5.2 老化通知
- 年齢増加時にバトルログまたはクエスト結果画面で通知。
- Vitality が 20 以下になったら赤色警告。