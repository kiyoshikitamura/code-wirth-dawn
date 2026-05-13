# Wirth-Dawn Scripts

開発・運用で使用するCLIツールとユーティリティ。

## CLI ツール

### `cli/audit.js` — 統合監査

```bash
# 全監査を一括実行（8xxx除外はデフォルト）
node scripts/cli/audit.js all

# テキスト文字数チェックのみ
node scripts/cli/audit.js text-length --threshold 45

# エネミーアクション網羅性チェック
node scripts/cli/audit.js actions

# エネミーグループ整合性チェック
node scripts/cli/audit.js groups

# 背景アセットチェック
node scripts/cli/audit.js assets

# JSON出力
node scripts/cli/audit.js all --json

# 全違反を表示
node scripts/cli/audit.js text-length --verbose
```

### `cli/generate.js` — コード生成

```bash
# 全クエストMD → CSV変換（dry-run）
node scripts/cli/generate.js md-to-csv --all --dry-run

# 特定クエストのみ変換
node scripts/cli/generate.js md-to-csv 7010 7011

# スキルマップ生成
node scripts/cli/generate.js skill-map
```

### `cli/seed.js` — DB同期

```bash
# 全シードを順次実行
node scripts/cli/seed.js all

# エネミーのみ同期
node scripts/cli/seed.js enemies

# グループのみ同期
node scripts/cli/seed.js groups

# 特定シナリオを同期
node scripts/cli/seed.js scenarios --id 7010

# dry-run
node scripts/cli/seed.js all --dry-run
```

## 共有ライブラリ（`lib/`）

| モジュール | 用途 |
|-----------|------|
| `csv-parser.js` | CSV読み書き、enemies/actions/groups/skills/scenario パース |
| `md-parser.js` | クエストMD → ノードオブジェクト変換、CSV生成 |
| `reporter.js` | コンソール/JSON/Markdown 出力フォーマッタ |

## アーカイブ（`archive/`）

一回性・デバッグ用の旧スクリプト。参考用に保管。削除可能。

## その他のスクリプト（移行未完了）

以下は個別のタスク固有スクリプトで、将来的にCLI統合を検討：

- `seed_*.ts` — TypeScript製のシードスクリプト群（ts-node で実行）
- `generate_*.ts/js` — クエスト/シナリオ生成スクリプト
- `md_to_csv_7000.js` — 旧版の一括MD→CSV変換（cli/generate.jsに統合済み）
- `audit_quests.js` — 旧版の監査スクリプト（cli/audit.jsに統合済み）
