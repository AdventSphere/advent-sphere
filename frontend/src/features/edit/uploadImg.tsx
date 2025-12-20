import type { Item } from "common/generate/adventSphereAPI.schemas";
import { ChevronLeft, Loader2, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import InventoryIcon from "@/components/icons/inventory";
import { Button } from "@/components/ui/button";
import { R2_BASE_URL } from "@/constants/r2-url";
import { cn } from "@/lib/utils";

interface UploadImgProps {
  onBack?: () => void;
  onAiGenerate?: () => void;
  onFileUpload?: (file: File) => Promise<void> | void;
  className?: string;
  item?: Item;
  isUploading?: boolean;
}

export default function UploadImg({
  onBack,
  onAiGenerate,
  onFileUpload,
  className,
  item,
  isUploading = false,
}: UploadImgProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 最低1秒間のローディングを保証するためのステート
  const [minLoading, setMinLoading] = useState(false);
  const isLoading = isUploading || minLoading;

  const thumbnailUrl = item
    ? `${R2_BASE_URL}/item/thumbnail/${item.id}.png`
    : null;

  const validateFile = (file: File): string | null => {
    // PNG形式のチェック
    if (!file.name.toLowerCase().endsWith(".png")) {
      return "PNGファイルのみ対応しています";
    }

    // ファイルサイズのチェック（5MB以下）
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return "ファイルサイズは5MB以下にしてください";
    }

    return null;
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // ファイル選択時は状態のみ更新、APIリクエストはしない
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // ファイル選択時は状態のみ更新、APIリクエストはしない
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleConfirmUpload = async () => {
    if (selectedFile) {
      try {
        setMinLoading(true);
        // 演出として最低2秒間待機
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await onFileUpload?.(selectedFile);
      } catch (e) {
        console.error(e);
        setMinLoading(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "bg-background p-6 h-screen overflow-y-auto flex flex-col justify-start items-center relative",
        className,
      )}
    >
      {/* ローディングオーバーレイ */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-lg font-medium text-muted-foreground animate-pulse">
              アップロード中...
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-100 rounded-lg p-10 w-3/4 my-auto">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <Button
              onClick={onBack}
              disabled={isLoading}
              className="bg-transparent hover:bg-transparent text-gray-600"
            >
              <ChevronLeft className="size-4 mr-1" />
              アイテム選択に戻る
            </Button>
          )}

          <div className="flex items-center gap-3">
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <InventoryIcon className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary">
              フォトフレームに写真を入れる
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-start justify-center">
          <div className=" max-w-6xl mx-auto flex items-center justify-center gap-12 w-full">
            {/* Photo Frames Display */}
            <div className="flex-1 flex justify-center items-center">
              {item && (
                <div className="w-full bg-transparent rounded-sm flex items-center justify-center p-2">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-sm"
                    />
                  ) : (
                    <div className="w-20 h-24 bg-white rounded-sm"></div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-6 max-w-lg mx-auto">
              {/* AI Generate Button */}
              <div className="text-center w-full">
                <Button
                  onClick={onAiGenerate}
                  disabled={isLoading}
                  className="w-full bg-red-800  hover:bg-red-900 text-white px-24 py-5 rounded-lg font-medium text-lg"
                >
                  <Sparkles className="size-5 mr-2" />
                  AIで画像を生成する
                </Button>
              </div>

              {/* または */}
              <div className="text-center">
                <p className="text-muted-foreground text-sm">または</p>
              </div>

              {/* Upload Section */}
              <div className="space-y-4">
                <h2 className="text-lg text-start font-semibold">
                  好きな画像をアップロードする
                </h2>

                <div className="space-y-4 ">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-48 border-2 border-dashed rounded-lg flex flex-col gap-2 relative",
                      dragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25",
                      isLoading && "opacity-50 cursor-not-allowed",
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    disabled={isLoading}
                    asChild
                  >
                    <label>
                      <Upload className="size-6 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground text-center">
                        <p>ここにドラッグ&ドロップかクリックでファイルを選択</p>
                        <p>【PNG/5MB以下】</p>
                      </div>
                      <input
                        type="file"
                        accept=".png,image/png"
                        onChange={handleFileInput}
                        disabled={isLoading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </label>
                  </Button>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-destructive text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {selectedFile && !error && !isLoading && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        {/* 画像プレビュー */}
                        {previewUrl && (
                          <div className="mb-4">
                            <div className="w-full max-w-md mx-auto aspect-video bg-neutral-100 rounded-lg overflow-hidden">
                              <img
                                src={previewUrl}
                                alt="プレビュー"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="size-4" />
                          <span className="text-sm font-medium">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">
                          この画像をアップロードしますか？
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedFile(null);
                              if (previewUrl) {
                                URL.revokeObjectURL(previewUrl);
                                setPreviewUrl(null);
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={isLoading}
                          >
                            キャンセル
                          </Button>
                          <Button
                            onClick={handleConfirmUpload}
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90"
                            disabled={isLoading}
                          >
                            確定
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
