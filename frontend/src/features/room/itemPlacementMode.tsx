import type { CalendarItemWithItem } from "common/generate/adventSphereAPI.schemas";
import { useState } from "react";
import type * as THREE from "three";
import { Button } from "@/components/ui/button";
import DraggableItem from "./draggableItem";

/**
 * 配置モード時のオーバーレイUI
 * Canvas内で使用される3Dコンポーネントと、HTMLオーバーレイの両方を提供
 */
export function ItemPlacementOverlay({
  onConfirm,
  onSkip,
  isPending,
  isPlacementValid,
  isLocked,
}: {
  onConfirm: () => void;
  onSkip: () => void;
  isPending: boolean;
  isPlacementValid: boolean;
  isLocked: boolean;
}) {
  const getMessage = () => {
    if (!isPlacementValid) {
      return "この位置には配置できません";
    }
    if (isLocked) {
      return "配置しました！クリックで再配置、決定ボタンで確定";
    }
    return "クリックで配置、右クリックまたはRキーで回転";
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* 上部の説明 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div
          className={`px-6 py-3 rounded-xl text-center ${
            isLocked ? "bg-green-600/90 text-white" : "bg-black/70 text-white"
          }`}
        >
          <p className="text-sm font-medium">{getMessage()}</p>
        </div>
      </div>

      {/* 下部のボタン */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-4">
        <Button
          onClick={onSkip}
          disabled={isPending}
          variant="outline"
          className="bg-white/90 hover:bg-white px-8 py-6 text-base font-bold rounded-xl shadow-lg"
        >
          {isPending ? "保存中..." : "あとで配置"}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isPending || !isPlacementValid}
          className="bg-primary text-primary-foreground px-8 py-6 text-base font-bold rounded-xl shadow-lg hover:bg-primary/90"
        >
          {isPending ? "保存中..." : "決定"}
        </Button>
      </div>
    </div>
  );
}

/**
 * 3Dシーン内で使用するドラッグ可能なアイテム
 */
export function PlacementDraggableItem({
  calendarItem,
  onPositionChange,
  isPlacementValid,
  setIsPlacementValid,
  initialRotation,
  onLockChange,
  roomRef,
  placedItemsRef,
}: {
  calendarItem: CalendarItemWithItem;
  onPositionChange: (
    position: [number, number, number],
    rotation: [number, number, number],
  ) => void;
  isPlacementValid: boolean;
  setIsPlacementValid: (valid: boolean) => void;
  initialRotation?: [number, number, number];
  onLockChange?: (isLocked: boolean) => void;
  roomRef: React.RefObject<THREE.Group>;
  placedItemsRef?: React.RefObject<THREE.Group>;
}) {
  return (
    <DraggableItem
      itemId={calendarItem.itemId}
      roomRef={roomRef}
      placedItemsRef={placedItemsRef}
      onPositionChange={onPositionChange}
      isPlacementValid={isPlacementValid}
      setIsPlacementValid={setIsPlacementValid}
      initialRotation={initialRotation}
      onLockChange={onLockChange}
    />
  );
}

/**
 * 配置モード全体を管理するフック
 */
export function usePlacementMode() {
  const [isPlacementValid, setIsPlacementValid] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [tempPosition, setTempPosition] = useState<
    [number, number, number] | null
  >(null);
  const [tempRotation, setTempRotation] = useState<
    [number, number, number] | null
  >(null);

  const handlePositionChange = (
    position: [number, number, number],
    rotation: [number, number, number],
  ) => {
    setTempPosition(position);
    setTempRotation(rotation);
  };

  const handleLockChange = (locked: boolean) => {
    setIsLocked(locked);
  };

  const resetTempPlacement = () => {
    setTempPosition(null);
    setTempRotation(null);
    setIsLocked(false);
  };

  return {
    isPlacementValid,
    setIsPlacementValid,
    isLocked,
    tempPosition,
    tempRotation,
    handlePositionChange,
    handleLockChange,
    resetTempPlacement,
  };
}
