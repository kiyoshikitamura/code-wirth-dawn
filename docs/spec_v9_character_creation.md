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
| 開始年齢 (Age) | INT | 15〜60 歳 |

### 2.2 初期ステータス
<!-- v11.0: 実装の初期値を反映 -->
| ステータス | 初期値 | 備考 |
|---|---|---|
| Level | 1 | |
| EXP | 0 | |
| HP | `BASE_HP + HP_PER_LEVEL` = 85 | v11.0: BASE_HP=80 |
| Max HP | 85 | |
| ATK | 1 | |
| DEF | 1 | |
| Vitality | 100 | 寿命 |
| Max Vitality | 100 | |
| Gold | 1000 | 初期所持金 |
| Max Deck Cost | 12 | `10 + (1 * 2)` |

### 2.3 年齢による初期ステータス修正
| 年齢帯 | Max Vitality修正 | ATK/DEF修正 | 特徴 |
|---|---|---|---|
| 15-20 | 100 (最大) | ±0 | バランス型 |
| 21-35 | 80-95 | +1-2 ATK | 戦闘向き |
| 36-50 | 50-75 | +1 ATK, +1 DEF | 熟練型 |
| 51-60 | 30-50 | ±0 | 短命だが初期経験値ボーナス |

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
  // ...
}
```

---

## 5. UI/UX

### 5.1 キャラクター作成フロー
### 5.1 キャラクター作成フロー
1. `/title` ページで「はじめる」をクリックすると、裏で匿名ユーザー（Anonymous）として自動登録・ログインされる。
2. キャラクター作成画面が表示され、名前・性別・年齢を入力。
3. 年齢帯に応じた警告メッセージが表示される:
   - 15-20: 「若さは最大の武器。長い旅路が待っている。」
   - 36-50: 「経験豊富だが、寿命は短い。」
   - 51-60: 「⚠️ 残りの時間は少ない。覚悟はいいか。」
4. 確認後、`POST /api/character/create` でプロフィールデータを作成。
5. （運用後）設定画面などで、この匿名アカウントをGoogle等のOAuthと連携（linkIdentity）し、データを永続化可能にする。

### 5.2 老化通知
- 年齢増加時にバトルログまたはクエスト結果画面で通知。
- Vitality が 20 以下になったら赤色警告。