# 6002/6003クリア後スタックユーザー救済移動ログ

* **対応日時**: 2026-06-17 06:20 (JST)
* **不具合内容**: メインクエスト6002「第2話『砂礫の国境線』」および6003「第3話『オアシスの陰謀』」の完了時、終了ノードの報酬データ（`node_rewards`）に `move_to` フィールドが含まれていなかったため、APIが自動移動先を無視してしまい、プレイヤーが次の目的地（オアシスの村 / 平原の都市）に自動移動せずスタックしていた問題。
* **対応内容**: 影響を受けたユーザーの本番DBデータを取得し、`current_location_id` を正しい目的地に手動更新しました。

## 移動対象ユーザー一覧（計46名）

### 6002クリア後スタック（国境の町 → オアシスの村）計43名

| ユーザーID | 変更前ロケーション | 変更後ロケーション |
| :--- | :--- | :--- |
| `79b2afad-e8a6-44a3-ad26-136b99192c15` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `a0f2a8c8-3fa5-4d67-a3ad-0dffaa8fcb09` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `da8040eb-2ee8-4ff5-9ea8-e30b0b6f2822` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `17b6d89c-d702-46e7-b90d-3978776bf54b` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `e8aaeff4-d6d4-43b7-aa62-31dcaf621157` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `71ac849e-7434-467c-8679-af735d5eddaf` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `85f0a655-086d-4368-bd62-8f4b5eda17e5` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `ae7b7370-c247-4ab5-bece-9de64dc2d841` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `d7b75b92-998d-4593-a8de-fcaeb7b86164` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `808f2d8d-863c-4dfe-b5f3-16661f4c5474` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `852a68a0-1d38-40ee-8e42-5599e53b8b09` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `f5254e5e-fd8c-4a00-ae97-418e0ddc70a5` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `aed9ea09-497e-4dc7-9e60-fbaf2d5cf669` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `8f9b2838-c294-48ff-a891-5946fb95bcb9` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `91307f09-86b9-4e98-a45e-f583e3d1c09a` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `31431fbc-539d-4f1a-81e6-54e61b520fad` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `4e6e062d-a3c3-47bd-8a8f-f581f2852cf5` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `64f1b7a2-07b1-4c59-a18f-cfb9bb183021` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `2bd451f7-8428-48ed-b6a6-0cfb8b46d4ff` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `cd8aff88-6736-4a79-9a99-0c5a1a1a05e1` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `ed074cdf-273c-450a-a8f7-8a62cd100cd2` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `e2080972-77dc-4c39-aac2-1cbe7bbad12d` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `06945132-4fe5-457e-ab6d-7c25815140a0` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `064024b1-b932-4ec7-8e8f-cc2adc3a05e2` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `637b1d54-d0cd-46be-b845-215cff57f710` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `b0bf1b44-df04-4bae-b445-e2b53bb949a6` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `54e6644b-8b97-44d6-ab5c-f4c321f7d618` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `737bae11-a1ae-4aa9-8204-f1ee7eabfafd` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `c350eacd-4803-426f-8eb5-538d76c58560` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `eddb94e3-24dc-43db-a4ca-26d6dc5087c0` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `d078bc42-6cc8-4024-a57a-1935915ab6d0` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `6cc4898e-87ed-42e3-98fb-323e60cc7019` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `abbac363-c6ce-46f3-b05c-4043ebc3ae4c` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `3c91086f-1882-4bc6-a4a6-5bf0e41c8936` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `34f4f256-7d6c-4093-9461-fbeb12db6d41` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `ce379825-b4e5-4bd5-9c77-e966a8eca320` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `450f7d4c-5026-4f4f-8e25-9d09405ef15d` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `e5cad202-eb9b-48e9-b66e-a53b43946c2e` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `e55cce3b-9248-4b99-82bc-c7e05f479aec` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `e144f3cf-4e38-4c02-a3ea-52637a5b8bf1` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `1ed5cff6-cf3a-4eb9-808f-c446ff667837` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `6d79c76b-2813-4a21-bd54-ba165abd0468` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |
| `a6e732be-ebf0-4cd3-bb2a-94c2b1d31a2e` | 国境の町 (`loc_border_town`) | オアシスの村 (`loc_oasis`) |

### 6003クリア後スタック（オアシスの村 → 平原の都市）計3名

| ユーザーID | 変更前ロケーション | 変更後ロケーション |
| :--- | :--- | :--- |
| `3799618d-1202-45d0-9059-2a5903ee77a1` | オアシスの村 (`loc_oasis`) | 平原の都市 (`loc_plains_city`) |
| `0c4d9ee3-2b38-498a-ab23-823ae91dced5` | オアシスの村 (`loc_oasis`) | 平原の都市 (`loc_plains_city`) |
| `bb88995d-3a52-417d-9d90-7919070b10ab` | オアシスの村 (`loc_oasis`) | 平原の都市 (`loc_plains_city`) |
