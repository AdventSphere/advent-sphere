# Advent Sphere

3D空間の部屋に、アドベントカレンダーでゲットしたアイテムを飾ろう！

## クイックスタート

### 依存関係をインストール
```bash
bun install
```
### 開発サーバーを起動
```bash
bun dev
```
- フロントエンド: `http://localhost:3000`  
- バックエンド: `http://localhost:8787`

## 開発
### フロントエンド
[frontend/README.md](./frontend/README.md)

### バックエンド
[backend/README.md](./backend/README.md)

## biome

[biome.jsonc](./biome.jsonc)

```bash
# リント
bun run lint
bun run lint:fix
# フォーマット
bun run format
bun run format:fix
# チェック (フォーマットとリント両方)
bun run check
bun run check:fix
```