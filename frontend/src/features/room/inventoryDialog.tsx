import type { CalendarItemWithItem } from "common/generate/adventSphereAPI.schemas";
import { useGetCalendarItemsRoomIdCalendarItemsInventory } from "common/generate/calendar-items/calendar-items";
import { useMemo, useState } from "react";
import InventoryIcon from "@/components/icons/inventory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { R2_BASE_URL } from "@/constants/r2-url";
import { cn } from "@/lib/utils";

const GRID_COLS = 6;
const GRID_ROWS = 4;
const TOTAL_SLOTS = GRID_COLS * GRID_ROWS;

function ItemCard({
  calendarItem,
  isSelected,
  onClick,
}: {
  calendarItem: CalendarItemWithItem | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (!calendarItem) {
    return (
      <div className="flex flex-col gap-1 sm:gap-2 items-center p-1 sm:p-2 rounded-xl sm:rounded-2xl aspect-164/149 justify-center">
        <div className="relative w-full rounded-xl flex items-center justify-center">
          <div className="bg-neutral-200 rounded-full shrink-0 size-8 sm:size-10" />
        </div>
      </div>
    );
  }

  const thumbnailUrl = `${R2_BASE_URL}/item/thumbnail/${calendarItem.item.id}.png`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 sm:gap-2 items-center p-1 sm:p-2 rounded-xl sm:rounded-2xl transition-all h-fit",
        isSelected
          ? "bg-white/20 border-2 border-primary"
          : "bg-transparent border-2 border-transparent",
      )}
    >
      <div className="aspect-4/3 relative w-full rounded-xl overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={calendarItem?.item.id || ""}
          className="absolute inset-0 w-full h-full object-cover object-center rounded-xl"
        />
      </div>
      <p
        className={cn(
          "text-xs sm:text-sm leading-none text-center truncate w-full",
          isSelected
            ? "font-semibold text-primary"
            : "font-normal text-foreground",
        )}
      >
        {calendarItem.item.name}
      </p>
    </button>
  );
}

export default function InventoryDialog({
  roomId,
  open,
  onOpenChange,
}: {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: calendarItems = [], isLoading } =
    useGetCalendarItemsRoomIdCalendarItemsInventory(roomId);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // アイテムを24スロットに配置（不足分はnullで埋める）
  const itemSlots = useMemo(() => {
    const slots: (CalendarItemWithItem | null)[] = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      slots.push(calendarItems[i] || null);
    }
    return slots;
  }, [calendarItems]);

  const handlePlaceItem = () => {
    if (selectedItemId) {
      // TODO: 部屋にアイテムを配置する処理を実装
      console.log("Placing item:", selectedItemId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="xl:max-w-6xl bg-muted rounded-2xl sm:rounded-3xl w-full max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col p-4 md:p-6 overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row justify-between items-center gap-3 sm:gap-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 sm:gap-4 text-primary font-bold text-xl sm:text-2xl justify-start">
            <div className="p-1.5 sm:p-2 bg-primary-foreground rounded-xl sm:rounded-2xl">
              <InventoryIcon className="size-5 sm:size-6 text-primary" />
            </div>
            持ち物
          </DialogTitle>
          <Button
            className="font-bold text-sm sm:text-base rounded-xl py-2.5 px-3 sm:px-4 h-fit bg-primary hover:bg-primary/90 w-auto"
            size="lg"
            onClick={handlePlaceItem}
            disabled={!selectedItemId}
          >
            部屋に置く
          </Button>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto min-h-0"
          style={{ scrollbarWidth: "thin" }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-10 sm:py-20">
              <p className="text-muted-foreground text-sm sm:text-base">
                読み込み中...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 sm:gap-2 w-full auto-rows-min">
              {itemSlots.map((item, index) => (
                <ItemCard
                  key={item?.item.id || `empty-${index}`}
                  calendarItem={item}
                  isSelected={item?.item.id === selectedItemId}
                  onClick={() => {
                    if (item) {
                      setSelectedItemId(
                        item.item.id === selectedItemId ? null : item.item.id,
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
