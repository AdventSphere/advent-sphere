# Figmaデザイン実装ガイドライン

Figmaデザインを実装する際は、以下のガイドラインに従ってください。

## 1. Tailwind CSSの標準値を使用する

Figmaから生成されたコードには、カスタム値（例: `rounded-[24px]`, `gap-[32px]`）が含まれることがありますが、**必ずTailwind CSSの標準値に変換**してください。

### 変換例

#### 角丸（Border Radius）
- `rounded-[24px]` → `rounded-3xl` (20px) または `rounded-2xl` (16px)
- `rounded-[8px]` → `rounded-md` (8px)
- `rounded-[10px]` → `rounded-lg` (10px)
- `rounded-[12px]` → `rounded-xl` (12px)

標準値: `rounded-sm` (2px), `rounded` (4px), `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-3xl` (24px)

#### スペーシング（Gap, Padding, Margin）
- `gap-[32px]` → `gap-8` (32px)
- `gap-[16px]` → `gap-4` (16px)
- `p-[12px]` → `p-3` (12px)
- `px-[18px]` → `px-5` (20px) または `px-4` (16px)
- `py-[12px]` → `py-3` (12px)

標準値: `0.5` (2px), `1` (4px), `1.5` (6px), `2` (8px), `2.5` (10px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px)

#### テキストサイズ
- `text-[20px]` → `text-xl` (20px)
- `text-[14px]` → `text-sm` (14px)
- `text-[16px]` → `text-base` (16px)

標準値: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px)

#### 高さ・幅
- `h-[40px]` → `h-10` (40px)
- `w-[264px]` → `w-[264px]` (カスタム値が必要な場合はそのまま使用可)

標準値: `h-8` (32px), `h-9` (36px), `h-10` (40px), `h-11` (44px), `h-12` (48px)

#### 色と透明度
- `bg-[rgba(255,255,255,0.75)]` → `bg-white/75`
- `border-[rgba(255,255,255,0.8)]` → `border-white/80`
- `bg-[#006003]` → デザインシステムの色を使用（`bg-primary`など）

透明度記法: `/75` (75%), `/80` (80%), `/90` (90%), `/50` (50%)

### デザインシステムの色を使用

プロジェクトのデザインシステムで定義されている色を使用してください（`frontend/src/styles.css`参照）:

- `bg-background`, `text-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-accent`, `text-accent-foreground`
- `bg-destructive`, `text-destructive-foreground`
- `border-border`, `border-input`

## 2. shadcn/uiコンポーネントを活用する

既存のshadcn/uiコンポーネントを優先的に使用してください。必要に応じて`className`でスタイルを調整します。

### コンポーネントの追加方法

必要なコンポーネントが存在しない場合は、shadcn/uiのCLIコマンドで追加できます。

```bash
# frontendディレクトリに移動
cd frontend

# コンポーネントを追加（例: cardコンポーネント）
npx shadcn@latest add card

# 複数のコンポーネントを一度に追加
npx shadcn@latest add card select textarea
```

利用可能なコンポーネント一覧は [shadcn/ui公式サイト](https://ui.shadcn.com/docs/components) で確認できます。

### 利用可能なコンポーネント

以下のコンポーネントが`frontend/src/components/ui/`にあります:

- **Button** (`button.tsx`) - ボタンコンポーネント
  - Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
  - Sizes: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`
  
- **Input** (`input.tsx`) - 入力フィールドコンポーネント
  
- **Dialog** (`dialog.tsx`) - モーダルダイアログコンポーネント
  - `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
  
- **Field** (`field.tsx`) - フォームフィールドコンポーネント
  - `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldContent`
  
- **Label** (`label.tsx`) - ラベルコンポーネント
  
- **Calendar** (`calendar.tsx`) - カレンダーコンポーネント
  
- **Popover** (`popover.tsx`) - ポップオーバーコンポーネント
  
- **RadioGroup** (`radio-group.tsx`) - ラジオボタングループコンポーネント
  
- **Separator** (`separator.tsx`) - セパレーターコンポーネント
  
- **Switch** (`switch.tsx`) - スイッチコンポーネント
  
- **Spinner** (`spinner.tsx`) - ローディングスピナーコンポーネント

### 使用例

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Buttonの例
<Button variant="default" size="default">続行</Button>

// Inputの例
<Input type="text" placeholder="名前を入力してください" className="h-10" />

// Dialogの例
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>タイトル</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## 3. 実装手順

1. **Figmaデザインを取得**
   - Figmaのnode-idを指定して`get_design_context`ツールを使用
   - 必要に応じて`get_screenshot`でスクリーンショットを確認

2. **既存コンポーネントを確認**
   - `frontend/src/components/ui/`内のコンポーネントを確認
   - 必要なコンポーネントが存在するか確認
   - 足りない場合は`bun dlx shadcn@latest add [component-name]`で追加

3. **Tailwindクラスの変換**
   - カスタム値（`[24px]`など）を標準値に変換
   - デザインシステムの色を使用

4. **コンポーネントの組み合わせ**
   - shadcn/uiコンポーネントを優先的に使用
   - `className`でスタイルを調整

5. **リンターエラーの確認**
   - `read_lints`ツールでエラーを確認
   - エラーがあれば修正

## 4. 注意事項

- Figmaから生成されたコードの`data-node-id`属性は削除してください
- `content-stretch`などの非標準クラスは削除してください
- カスタムフォント指定（`font-['Noto_Sans_JP:Bold',sans-serif]`など）は、プロジェクトのデフォルトフォントを使用してください
- absolute positioningの値（`left-[232px] top-[216px]`など）は、実際の使用シーンに応じて調整してください

## 5. 参考リソース

- Tailwind CSS公式ドキュメント: https://tailwindcss.com/docs
- shadcn/ui公式ドキュメント: https://ui.shadcn.com/
- プロジェクトのデザインシステム: `frontend/src/styles.css`

