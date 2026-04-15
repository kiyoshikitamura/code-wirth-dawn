Code: Wirth-Dawn Specification v16.1 (Character Creation)
# Character Creation & Aging Mechanics

## 1. 概要 (Overview)
キャラクター作成時の入力パラメータ、初期ステータスの決定ロジック、加齢/老化による能力減衰を定義する。

<!-- v16.0: ゲーム開始フローを3モードに刷新。New Game は Google OAuth 必須。Test Play（匿名）は7日間失効。 -->
<!-- v16.1: OAuthコールバック方式修正（onAuthStateChangeへの統一）、UIアップデート（ボタン可読性・確認モーダル改善）、アバター上限5MB化 -->

---

## 2. キャラクター作成 (Character Creation)

### 2.1 ゲーム開始フロー（v16.0）

タイトル画面（`/title`）では以下の3モードを提供する。

| ボタン | 認証方式 | データ永続化 | 説明 |
|---|---|---|---|
| **New Game** | Google OAuth **必須** | 永続（無期限） | アカウント作成 → キャラクター作成 |
| **Continue / Transfer** | Google OAuth | 永続（無期限） | 既存キャラクターへログイン |
| **Test Play** | 匿名認証 | **7日間のみ** | アカウントなしで気軽に体験プレイ |

#### New Game フロー
```
[New Game] ボタン（表示: "New Game" + "Google連携が必要"、2行レイアウト）
  → Google OAuth 画面（Supabase 経由）
  → /title?code=xxx に直接リダイレクト
     ↳ Supabase client が detectSessionInUrl=true でコードを自動消費
     ↳ onAuthStateChange の SIGNED_IN イベントを発火
  → checkUserStatus:
      - 既存プロフィールあり → /inn
      - 新規           → CHAR_CREATION 画面（タイトルに戻るリンク付き）
```

#### Continue フロー
```
[Continue / Transfer] ボタン
  → Google OAuth 画面（同一アカウントでログイン）
  → /title?code=xxx → onAuthStateChange SIGNED_IN → checkUserStatus → /inn
  → プロフィールなし → CHAR_CREATION（新規キャラクター作成）
```

#### Test Play フロー
```
[Test Play] ボタン
  → signInAnonymously()（Supabase 匿名認証）
  → CHAR_CREATION（⚠️ 7日間失効バナー表示）
  → /api/profile/init に is_anonymous=true で作成
  → /inn（7日間のみ遊べる）
```

> [!WARNING]
> Test Play のデータは **7日後に daily cron で自動削除** される。
> 引き継ぎ不可。ゲーム内のアカウント連携で Google アカウントに紐付けることで永続化できる（Phase 6 予定）。

> [!NOTE]
> Test Play キャラクターも **残影（影）として酒場に表示される**ため、
> DB に保存することに意味がある。失効後は自動削除されるためデータが残らない。

---

### 2.2 入力パラメータ
| パラメータ | 型 | 検証 |
|---|---|---|
| 名前 (Name) | TEXT | 1〜16文字 |
| 性別 (Gender) | ENUM | 'Male' / 'Female' / 'Unknown' |
| 開始年齢 (Age) | INT | 15〜40 歳 |

### 2.3 初期ステータス（基底値）

<!-- v15.0: HP/ATK/DEFを上方修正。ランダム変数を加算して個性を演出 -->

| ステータス | 計算式 | 備考 |
|---|---|---|
| Level | 1 | 固定 |
| EXP | 0 | 固定 |
| HP / Max HP | `85 + Math.floor((Age - 15) * randFloat(1.5, 2.0))` | 15歳=85, 40歳=122〜135 のランダム幅 |
| ATK | `randInt(1, 3)` | 基底値でランダム（年齢補正が別途加わる） |
| DEF | `randInt(1, 3)` | 基底値でランダム（年齢補正が別途加わる） |
| Gold | `800 + randInt(100, 400)` | 900〜1200G のランダム幅 |
| Vitality | 年齢補正で決定（§2.4参照） | |
| Max Vitality | Vitality と同値（作成時点） | |
| Max Deck Cost | 12 | `BASE_DECK_COST(8) + (1 * COST_PER_LEVEL(2)) + 2` |
| avatar_url | `/avatars/adventurer.jpg` | デフォルト画像（固定） |
| is_anonymous | boolean | true = Test Play（7日後失効） |
| expires_at | TIMESTAMPTZ | Test Play 時: 作成から7日後 / New Game 時: NULL |

**ランダム関数定義:**
```typescript
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => min + Math.random() * (max - min);
```

### 2.4 年齢による初期ステータスボーナス・制約

<!-- v15.0: 全補正値をランダム変数化 -->

| 年齢帯 | フレーバーテキスト | Vitality | HP ボーナス | ATK ボーナス | DEF ボーナス |
|---|---|---|---|---|---|
| 15-19 | 「若さは最大の武器...」 | 100（固定） | `+ randInt(0, 10)` | `+ randInt(0, 2)` | `+ randInt(0, 2)` |
| 20-29 | 「心身ともに円熟の時...」 | `randInt(85, 95)` | `+ randInt(0, 10)` | `+ randInt(0, 2)` | `+ randInt(0, 2)` |
| 30-39 | 「経験は盾となり...」 | `randInt(70, 80)` | `+ randInt(10, 20)` | `+ randInt(1, 3)` | `+ randInt(1, 3)` |
| 40 | 「黄昏の時が近づく...」 | 60（固定） | `+ randInt(20, 30)` | `+ randInt(2, 4)` | `+ randInt(2, 4)` |

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
  is_anonymous?: boolean; // v16.0: テストプレイフラグ
  expires_at?: string;    // v16.0: 匿名プロフィール失効日時 (ISO 8601)
  // ...
}
```

### 4.1 UI表現への適用 (v12.0)
- **現在年齢表示**: プレイヤーの現在年齢は `age + (age_days / 365)` を基準としてUI表示する。
- **暦（カレンダー）表示**: `age_days`（クエスト経過日数の累計）を利用し、ゲーム内の世界観に合わせた暦に変換して画面上部のヘッダーに表示する。
- **健康状態 (Vitality)**: `vitality` が **20以下** となった場合、赤色点滅等の目立つ警告表示を行う。
- **テストプレイバナー (v16.0)**: `is_anonymous === true` の場合、CHAR_CREATION 画面上部に7日間失効警告バナーを表示する。

---

## 5. UI/UX

### 5.1 キャラクター作成フロー（v16.0）
1. タイトル画面から「Tap to Start」でメニューに移行。
2. 3つのボタンが表示:
   - **New Game** — Google OAuth 認証 → CHAR_CREATION
   - **Continue / Transfer** — Google OAuth → /inn（既存）or CHAR_CREATION（新規）
   - **Test Play** — 匿名認証 → CHAR_CREATION（失効バナー付き）
3. CHAR_CREATION: 名前（イタリック体）・性別（ボタン）・年齢（スライダー 15〜40歳）を入力。
4. スライダーの年齢値に応じて「動的フレーバーテキスト」と「ステータスプレビュー」をリアルタイム表示。
5. 「世界に降り立つ」→ 確認モーダル → `POST /api/profile/init` → `/inn` へ遷移。

### 5.2 認証コールバック
- Google OAuth 完了後、`/auth/callback` でコードを受け取り `/title?code=xxx` へリダイレクト。
- `/title` ページが `exchangeCodeForSession(code)` でセッションを確立する。

### 5.3 老化通知
- 年齢増加時にバトルログまたはクエスト結果画面で通知。
- Vitality が 20 以下になったら赤色警告。

---

## 6. テストプレイの失効と削除

### 6.1 失効フラグ
| カラム | 型 | 設定タイミング | 値 |
|---|---|---|---|
| `is_anonymous` | BOOLEAN | `/api/profile/init` | `true`（匿名認証ユーザー） |
| `expires_at` | TIMESTAMPTZ | `/api/profile/init` | 作成日時 + 7日 |

### 6.2 自動削除
- `/api/cron/daily-update`（Vercel Cron: 毎日 UTC 0:00）が失効プロフィールを削除。
- 削除対象: `is_anonymous = true AND expires_at < NOW()`
- 関連テーブル（party_members, user_skills, inventory 等）の CASCADE 削除は DB レベルで処理。

### 6.3 アカウント連携（将来実装予定）
- 匿名ユーザーが Google アカウントと連携（`linkIdentity`）することで永続化できる。
- 連携後: `is_anonymous = false`, `expires_at = NULL` に更新。

---

## 7. 変更履歴

| バージョン | 日付 | 主な変更内容 |
|---|---|---|
| v11.0 | 2026-04 | processAging()の実装に合わせて全面改訂 |
| v12.1 | 2026-04 | avatar_url 追加 |
| v15.0 | 2026-04-13 | 初期ステータス上方修正。HP/ATK/DEF/Gold の基底値・年齢補正にランダム変数を導入 |
| **v16.0** | **2026-04-15** | **ゲーム開始フロー刷新。New Game = Google OAuth 必須、Test Play = 匿名7日間失効に分離。Auth コールバックルート追加（`/auth/callback`）。`user_profiles` に `is_anonymous` / `expires_at` カラム追加。daily cron に匿名データ自動削除を追加。** |