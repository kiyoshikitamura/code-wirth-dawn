Code: Wirth-Dawn Specification v16.2 (Character Creation)
# Character Creation & Aging Mechanics

## 1. 概要 (Overview)
キャラクター作成時の入力パラメータ、初期ステータスの決定ロジック、加齢/老化による能力減衰を定義する。

<!-- v16.0: ゲーム開始フローを3モードに刷新。New Game は Google OAuth 必須。Test Play（匿名）は7日間失効。 -->
<!-- v16.1: OAuthコールバック方式修正（onAuthStateChangeへの統一）、UIアップデート（ボタン可読性・確認モーダル改善）、アバター上限5MB化 -->
<!-- v16.2: キャラクター削除フロー仕様追加。sessionStorage Intent フラグ優先順位の明確化。アカウント連携（linkIdentity）を正式仕様化。プロファイルリセットAPIの対象テーブル網羅。 -->

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

#### キャラクター削除フロー（v16.2）
```
[Continue / Transfer] → [キャラクター削除（リセット）] ボタン
  → 確認モーダル（2つのチェックボックス必須）
  → sessionStorage に cwd_delete_intent='1' を設定
  → Google OAuth 画面（本人確認）
  → /title?code=xxx → onAuthStateChange SIGNED_IN → checkUserStatus
  → isDeleteIntent フラグ検出
  → POST /api/profile/reset（Bearer トークン認証）
  → 全関連テーブル削除 → user_profiles 削除
  → signOut → MENU に戻る
```

> [!IMPORTANT]
> キャラクター削除は **Google OAuth による本人確認** を必須とする。
> 削除完了後は自動的にサインアウトされ、メニューに戻る。

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
> ゲーム内のアカウント設定画面から Google アカウントに紐付けることで永続化できる（§6.3 参照）。

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
  title_name?: string;    // アライメント割合ベースで動的算出される称号（§4.2参照）
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

### 4.2 称号（タイトル）システム (v26.1)

`src/lib/character.ts` の `calculateTitle()` がプレイヤーのステータスに基づいて称号を動的に決定する。
プロフィール取得時 (`GET /api/profile`) および祈り実行時 (`POST /api/report-action`) に自動更新される。

**設計原則:**
- 全50称号に **一意の優先度（P50〜P1）** を割り当て、タイブレークを完全排除
- 全称号が **複合条件**（アライメント×レベル×年齢×ゴールド×性別×VIT の組合せ）
- アライメント割合は `src/lib/alignment.ts` の `calcAlignmentPcts()` で算出（対立軸ベース、0-100、50=中立）
- **旧仕様の `getAvatarByTitle()` は v26.1 で廃止**（ユーザー自由設定アイコンへ移行）

| P | 称号名 | 条件 |
|---:|:---|:---|
| 50 | 光輝の守護聖者 | `O≥80 && J≥80 && Lv≥25` |
| 49 | 終末の覇王 | `C≥80 && E≥80 && Lv≥25` |
| 48 | 天秤の調停者 | `O≥75 && E≥75 && Lv≥20` |
| 47 | 嵐の解放者 | `C≥75 && J≥75 && Lv≥20` |
| 46 | 不滅の古豪 | `age≥55 && Lv≥20 && VIT>0` |
| 45 | 神話の富豪 | `gold≥300k && Lv≥20` |
| 44 | 聖騎士 | `O≥65 && J≥65 && Lv≥10` |
| 43 | 暗黒卿 | `C≥65 && E≥65 && Lv≥10` |
| 42 | 義賊 | `C≥60 && J≥60 && Lv≥8` |
| 41 | 冷徹な執行者 | `O≥60 && E≥60 && Lv≥8` |
| 40 | 黄金の暴君 | `E≥60 && gold≥100k && Lv≥12` |
| 39 | 清廉の騎士団長 | `O≥65 && J≥55 && gold≤5k && Lv≥12` |
| 38 | 戦乙女 | `♀ && J≥60 && Lv≥15` |
| 37 | 魔女 | `♀ && E≥65 && Lv≥10` |
| 36 | 法の番人 | `O≥70 && Lv≥15` |
| 35 | 混沌の使徒 | `C≥70 && Lv≥15` |
| 34 | 英雄 | `J≥70 && Lv≥15` |
| 33 | 悪鬼 | `E≥70 && Lv≥15` |
| 32 | 秩序の盾 | `O≥65 && Lv≥10` |
| 31 | 自由の刃 | `C≥65 && Lv≥10` |
| 30 | 善なる剣 | `J≥65 && Lv≥10` |
| 29 | 暗き牙 | `E≥65 && Lv≥10` |
| 28 | 鉄血宰相 | `♂ && O≥65 && E≥55 && Lv≥12` |
| 27 | 覇道の王 | `♂ && C≥60 && Lv≥20` |
| 26 | 若き天才 | `age≤22 && Lv≥15` |
| 25 | 死に損ないの老兵 | `age≥50 && VIT≤20 && VIT>0 && Lv≥8` |
| 24 | 銭ゲバ | `gold≥100k && E≥55` |
| 23 | 清貧の聖人 | `gold≤500 && J≥65 && Lv≥5` |
| 22 | 流浪の剣聖 | `acc_days≥500 && Lv≥12` |
| 21 | 世捨て人 | `gold≤200 && C≥60 && Lv≥8` |
| 20 | 鉄の規律 | `O≥70 && Lv≥20 && gold≥30k` |
| 19 | 嵐を呼ぶ者 | `C≥70 && Lv≥20 && gold≥30k` |
| 18 | 秩序の信徒 | `O≥58 && Lv≥7` |
| 17 | 自由の風 | `C≥58 && Lv≥7` |
| 16 | 善なる心 | `J≥58 && Lv≥7` |
| 15 | 暗き魂 | `E≥58 && Lv≥7` |
| 14 | 灰色の賢者 | `O:45-55 && J:45-55 && Lv≥10` |
| 13 | 修羅の亡霊 | `E≥55 && VIT≤30 && Lv≥8` |
| 12 | 傷だらけの守護者 | `J≥55 && VIT≤30 && Lv≥8` |
| 11 | 壮年の武人 | `age≥35 && Lv≥10` |
| 10 | 正義の見習い | `J≥53 && Lv≥4` |
| 9 | 小悪党 | `E≥53 && Lv≥4` |
| 8 | 規律ある新兵 | `O≥53 && Lv≥4` |
| 7 | 気ままな旅人 | `C≥53 && Lv≥4` |
| 6 | 均衡の旅人 | `O:46-54 && J:46-54 && Lv≥4` |
| 5 | 貧乏剣士 | `gold≤300 && Lv≥4` |
| 4 | 見習い戦士 | `Lv≥4` |
| 3 | 駆け出しの冒険者 | `Lv≥2` |
| 2 | 若き冒険者 | `Lv=1` |
| 1 | 名もなき旅人 | 常時true（最終フォールバック） |

> **凡例**: O=秩序率, C=混沌率, J=正義率, E=悪率（各0-100、50=中立）、♀=Female、♂=Male

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
- Google OAuth 完了後、Supabase が `/title?code=xxx` へ直接リダイレクト。
- Supabase client の `detectSessionInUrl` が自動的にコードを消費しセッションを確立。
- `onAuthStateChange` の `SIGNED_IN` / `INITIAL_SESSION` イベントで `checkUserStatus()` を発火。

### 5.3 sessionStorage Intent フラグ管理（v16.2）

`checkUserStatus()` は複数の Intent フラグを読み取り、以下の **優先順位** で処理する:

| 優先度 | フラグ | 設定タイミング | 処理内容 |
|---|---|---|---|
| 1（最高） | `cwd_delete_intent` | キャラクター削除確認後 | `/api/profile/reset` → signOut → MENU |
| 2 | `cwd_new_game_intent` | New Game ボタン押下時 | 既存キャラあり → エラー表示、なし → CHAR_CREATION |
| 3 | `cwd_return_to_title` | ゲーム内「タイトルに戻る」 | signOut → MENU（自動リダイレクト抑止） |
| 4（最低） | なし | 通常の OAuth 完了 | プロフィールあり → /inn、なし → CHAR_CREATION |

> [!IMPORTANT]
> **フラグの残存防止**: `handleNewGame()` / `handleContinue()` 実行時に、古い `cwd_return_to_title` / `cwd_delete_intent` フラグを明示的にクリアする。これにより、ゲームから「タイトルに戻る」→「キャラクター削除」のフローで古いフラグが干渉しない。

> [!NOTE]
> sessionStorage はタブ内で永続するが、`checkUserStatus()` は認証イベント時にのみ呼ばれる。
> ゲーム内からタイトルに戻った時は signOut 済みのため認証イベントが発火せず、
> `cwd_return_to_title` がクリアされないまま残存する可能性がある。
> これが優先順位ルールが必要な理由である。

### 5.4 老化通知
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

### 6.3 アカウント連携（v16.2 実装済み）

テストプレイ（匿名）ユーザーが Google アカウントに紐付けることでデータを永続化できる。

```
[ゲーム内: 設定 → アカウント連携]
  → supabase.auth.linkIdentity({ provider: 'google' })
  → Google OAuth 画面
  → /inn?code=xxx にリダイレクト
     ↳ useAuthGuard が ?code= パラメータ検出時はガードをスキップ
     ↳ Supabase client が自動的にコード交換
     ↳ URLクリーンアップ（?code= 除去）
  → is_anonymous = false, expires_at = NULL に更新
```

> [!NOTE]
> `linkIdentity` は既存セッションに OAuth Identity を追加する。新しいユーザーは作成されない。
> 既に別ユーザーに連携済みの Google アカウントを指定した場合はエラーとなる。

### 6.4 手動キャラクター削除（v16.2）

`POST /api/profile/reset` は以下のテーブルを **FK 依存順** で削除する:

| 順序 | テーブル | カラム | 操作 |
|---|---|---|---|
| 1 | `historical_logs` | `user_id` | DELETE |
| 2 | `royalty_logs` | `source_user_id` | DELETE |
| 3 | `royalty_logs` | `target_user_id` | DELETE |
| 4 | `party_members` | `source_user_id` | SET NULL（他ユーザーの傭兵参照） |
| 5 | `party_members` | `owner_id` | DELETE |
| 6 | `inventory` | `user_id` | DELETE |
| 7 | `reputations` | `user_id` | DELETE |
| 8 | `prayer_logs` | `user_id` | DELETE |
| 9 | `equipped_items` | `user_id` | DELETE |
| 10 | `user_skills` | `user_id` | DELETE |
| 11 | `quest_progress` | `user_id` | DELETE |
| 12 | `user_completed_quests` | `user_id` | DELETE |
| 13 | `user_hub_states` | `user_id` | DELETE |
| 14 | `user_world_views` | `user_id` | DELETE |
| 15 | `royalty_daily_log` | `user_id` | DELETE |
| 16 | `retired_characters` | `user_id` | DELETE |
| 17 | `battle_sessions` | `user_id` | DELETE |
| 18 | `user_profiles` | `id` | DELETE（最後） |

> [!WARNING]
> 新しいテーブルに `user_profiles(id)` への FK を追加した場合、
> `/api/profile/reset/route.ts` にも対応する削除処理を追加すること。
> 漏れがあると FK 制約違反でキャラクター削除が失敗する。

---

## 7. 変更履歴

| バージョン | 日付 | 主な変更内容 |
|---|---|---|
| v11.0 | 2026-04 | processAging()の実装に合わせて全面改訂 |
| v12.1 | 2026-04 | avatar_url 追加 |
| v15.0 | 2026-04-13 | 初期ステータス上方修正。HP/ATK/DEF/Gold の基底値・年齢補正にランダム変数を導入 |
| v16.0 | 2026-04-15 | ゲーム開始フロー刷新。New Game = Google OAuth 必須、Test Play = 匿名7日間失効に分離。Auth コールバックルート追加。`user_profiles` に `is_anonymous` / `expires_at` カラム追加。daily cron に匿名データ自動削除を追加。 |
| **v16.2** | **2026-04-16** | **キャラクター削除フロー仕様追加（§2.1, §6.4）。sessionStorage Intent フラグ優先順位の規定（§5.3）。アカウント連携（linkIdentity）を正式仕様化（§6.3）。プロファイルリセット API の対象テーブル18個を網羅（§6.4）。** |
| **v26.1** | **2026-05-14** | **称号50種に拡張（§4.2）。全称号を複合条件・一意優先度(P50-P1)に変更。`getAvatarByTitle()` 廃止。** |