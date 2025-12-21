# Advent Sphere

**Advent Sphere** は、3D 空間上で楽しめるインタラクティブなアドベントカレンダーアプリケーションです。
ユーザーは自分だけのルームを作成し、カレンダーの日付ごとにアイテムや写真を設定して、クリスマスまでのカウントダウンを楽しむことができます。

## 🚀 技術スタック

このプロジェクトは、最新の Web 標準技術と Cloudflare のエコシステムを活用して構築されています。

### Frontend (`/frontend`)

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **3D**: Three.js, React Three Fiber, Drei, Rapier
- **Routing**: TanStack Router
- **State/Data Fetching**: TanStack Query
- **UI Components**: Radix UI, Lucide React

### Backend (`/backend`)

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **AI**: Google GenAI (Gemini)
- **Storage**: Cloudflare R2 (画像保存)

### Common (`/common`)

- **Type Sharing**: Backend の OpenAPI 定義から Frontend の型と API クライアントを自動生成
- **Tools**: Orval, Zod

## 📂 プロジェクト構成

```
advent-sphere/
├── frontend/       # Reactアプリケーション
├── backend/        # Hono APIサーバー (Cloudflare Workers)
├── common/         # 共有型定義・APIクライアント生成
└── README.md
```

## 🛠️ 開発環境のセットアップ

### 前提条件

- Node.js (v20 以上推奨)
- [Bun](https://bun.sh/) (パッケージマネージャーとして使用)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare 開発ツール)

### インストール

ルートディレクトリで依存関係をインストールします。

```bash
bun install
```

### バックエンドの起動

1. ローカル D1 データベースのマイグレーションを実行します。

```bash
cd backend
bun run local:migrate
```

2. 開発サーバーを起動します。

```bash
bun run dev
```

API サーバーが `http://localhost:8787` (または指定ポート) で起動します。

### フロントエンドの起動

新しいターミナルを開き、フロントエンドを起動します。

```bash
cd frontend
bun run dev
```

アプリケーションが `http://localhost:3000` で起動します。

### 共通モジュールの更新

バックエンドの API 定義を変更した場合、共通モジュールを更新してフロントエンドに反映させる必要があります。

backend で OpenAPI 定義を出力し、common でクライアントを生成するフロー（スクリプト定義に依存）などが想定されます。

