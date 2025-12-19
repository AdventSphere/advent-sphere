import type { CalendarItemWithItem } from "common/generate/adventSphereAPI.schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { R2_BASE_URL } from "@/constants/r2-url";

interface ItemGetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: number;
  calendarItem: CalendarItemWithItem;
  onNext: () => void;
}

export default function ItemGetDialog({
  open,
  onOpenChange,
  day,
  calendarItem,
  onNext,
}: ItemGetDialogProps) {
  const thumbnailUrl = `${R2_BASE_URL}/item/thumbnail/${calendarItem.itemId}.png`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm bg-white rounded-3xl p-6 flex flex-col items-center gap-6"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-col items-center gap-2">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full">
            <span className="text-lg font-bold">{day}日目</span>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            アイテムゲット!
          </DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-col items-center gap-4">
          <div className="w-48 h-36 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
            <img
              src={thumbnailUrl}
              alt={calendarItem.item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          <p className="text-xl font-semibold text-foreground text-center">
            {calendarItem.item.name}
          </p>
        </div>

        <Button
          onClick={onNext}
          className="w-full h-12 text-lg font-bold rounded-xl"
          size="lg"
        >
          次へ
        </Button>
      </DialogContent>
    </Dialog>
  );
}
