import type { Item } from "common/generate/adventSphereAPI.schemas";
import { Check } from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
import { useGetInfiniteItems } from "./hooks/useGetInfiniteItems";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";

const FILTER_TYPES = [
  { id: "all", label: "すべて" },
  { id: "photo_frame", label: "フォトフレーム" },
  { id: "christmas", label: "クリスマス" },
  { id: "all_season", label: "その他" },
] as const;

function ItemCard({
  item,
  isSelected,
  onClick,
}: {
  item: Item;
  isSelected: boolean;
  onClick: () => void;
}) {
  const thumbnailUrl = `${R2_BASE_URL}/item/thumbnail/${item.id}.png`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 items-center overflow-hidden p-2 rounded-xl transition-all",
        isSelected
          ? "bg-white/20 border-2 border-primary"
          : "bg-transparent border-2 border-transparent",
      )}
    >
      <div className="aspect-4/3 relative w-full rounded-xl overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>
      <p className="text-sm leading-none text-center truncate w-full text-foreground">
        {item.name}
      </p>
    </button>
  );
}

export default function ItemSelectDialog({
  open,
  onOpenChange,
  day,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: number;
  onSelect?: (item: Item) => void;
}) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useGetInfiniteItems(selectedFilter);
  const items = data?.pages.flat() ?? [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);
  useInfiniteScroll(loadMoreRef, handleLoadMore);

  const handleConfirm = () => {
    if (selectedItemId && onSelect) {
      const selectedItem = items.find((item) => item.id === selectedItemId);
      if (selectedItem) {
        onSelect(selectedItem);
      }
    }
    onOpenChange(false);
    setSelectedItemId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] md:w-full max-w-[1100px] h-[90vh] bg-muted/95 border-2 border-white rounded-2xl md:rounded-3xl p-4 md:p-10 flex flex-col gap-4 md:gap-6"
      >
        <DialogHeader className="flex flex-row justify-between items-center gap-2 md:gap-4 shrink-0">
          <div className="flex gap-2 md:gap-4 items-center">
            <div className="bg-background p-2 rounded-2xl">
              <InventoryIcon className="size-5 md:size-6 text-primary" />
            </div>
            <DialogTitle className="text-xl md:text-2xl text-primary font-bold leading-none">
              <span className="font-extrabold">{day}</span>日のアイテムを選ぶ
            </DialogTitle>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!selectedItemId}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-3 py-2 md:px-4 md:py-3 gap-1 h-auto"
          >
            <Check className="size-4 md:size-5" />
            <span className="text-sm md:text-base font-bold">決定</span>
          </Button>
        </DialogHeader>

        <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
          {FILTER_TYPES.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSelectedFilter(filter.id)}
              className={cn(
                "px-3 py-2 md:px-4 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap",
                selectedFilter === filter.id
                  ? "bg-[#920209] text-primary-foreground"
                  : "bg-background text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-base">読み込み中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 w-full">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedItemId}
                  onClick={() => {
                    setSelectedItemId(
                      item.id === selectedItemId ? null : item.id,
                    );
                  }}
                />
              ))}
            </div>
          )}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-2">
              <p className="text-muted-foreground text-base">読み込み中...</p>
            </div>
          )}
          <div ref={loadMoreRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
