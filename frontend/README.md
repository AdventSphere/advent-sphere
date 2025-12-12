# フロントエンド

## 開発コマンド

```bash
# 依存関係インストール
bun install

# 開発サーバー起動
bun run dev

# 本番ビルド
bun run build

# テスト実行
bun run test
```

## 技術スタック

| 機能 | ライブラリ |
|------|-----------|
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) |
| UIコンポーネント | [Shadcn](https://ui.shadcn.com/) |
| ルーティング | [TanStack Router](https://tanstack.com/router)（ファイルベース） |
| データ取得 | [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) |

## ルーティング

- ルートは `src/routes/` ディレクトリにファイルを追加するだけで自動生成される
  - `bun run dev`で実行中にファイルを作る
- ページ間移動は `<Link to="/path">` を使用

## Shadcn コンポーネント追加

```bash
pnpm dlx shadcn@latest add button
```

