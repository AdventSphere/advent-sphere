import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { R2_BASE_URL } from "@/constants/r2-url";
import type { Item } from "common/generate/adventSphereAPI.schemas";

export default function ChangeItemDialog({
  open,
  onOpenChange,
  day,
  item,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: number;
  item: Item;
  onChange?: () => void;
}) {
  const thumbnailUrl = `${R2_BASE_URL}/item/thumbnail/${item.id}.png`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-primary">
            この日のアイテムを変更しますか？
          </DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">
            {day}日目のアイテム: {item?.name}
          </p>

          {/* 画像プレビューエリア */}
          {thumbnailUrl && (
            <div className="relative w-full flex justify-center">
              <img
                src={thumbnailUrl}
                alt="Selected item preview"
                className="max-h-48 w-auto object-contain rounded-md border shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={onChange}>アイテムを変更する</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
