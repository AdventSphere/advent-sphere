import { CameraControls, Environment, Gltf } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { createLazyFileRoute } from "@tanstack/react-router";
import type { CalendarItemWithItem } from "common/generate/adventSphereAPI.schemas";
import { useGetCalendarItemsRoomIdCalendarItems } from "common/generate/calendar-items/calendar-items";
import { useGetRoomsId } from "common/generate/room/room";
import { X } from "lucide-react";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import InventoryIcon from "@/components/icons/inventory";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { R2_BASE_URL } from "@/constants/r2-url";
import Calendar from "@/features/room/calendar";
import DraggableSnowdome from "@/features/room/draggableSnowdome";
import { useCalendarFocus } from "@/features/room/hooks/useCalendarFocus";
import { useItemAcquisition } from "@/features/room/hooks/useItemAcquisition";
import InventoryDialog from "@/features/room/inventoryDialog";
import ItemGetDialog from "@/features/room/itemGetDialog";
import {
  ItemPlacementOverlay,
  PlacementDraggableItem,
  usePlacementMode,
} from "@/features/room/itemPlacementMode";
import PlacedItems from "@/features/room/placedItems";

export const Route = createLazyFileRoute("/$roomId/")({
  component: RouteComponent,
});

const roomUrl = `${R2_BASE_URL}/static/room_2.glb`;
const tableUrl = `${R2_BASE_URL}/static/table%20(1).glb`;

// フォーカスモード時にカレンダーを照らすライト
function FocusLights({ isFocusMode }: { isFocusMode: boolean }) {
  return isFocusMode ? (
    <directionalLight
      position={[2, 1.5, -0.5]}
      intensity={3.6}
      target-position={[0, 0, 0]}
    />
  ) : null;
}

// カレンダーの配置
const CALENDAR_POSITION: [number, number, number] = [0, 1, 0];

function RouteComponent() {
  const { roomId } = Route.useParams();
  const { data: room } = useGetRoomsId(roomId);
  const { data: calendarItems } =
    useGetCalendarItemsRoomIdCalendarItems(roomId);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [openedDrawers, setOpenedDrawers] = useState<number[]>([]);
  const {
    isFocusMode,
    cameraControlsRef,
    calendarRef,
    handleFocusCalendar,
    handleExitFocusMode,
  } = useCalendarFocus();
  const roomRef = useRef<THREE.Group>(null);
  const placedItemsRef = useRef<THREE.Group>(null);
  // アイテム取得フロー
  const {
    phase,
    targetCalendarItem,
    targetDay,
    todayDay,
    todayOpenableItem,
    canOpenDay,
    handleDayClick,
    handleNextFromGetModal,
    handlePlacement,
    handleSkipPlacement,
    handleSnowdomePlacement,
    resetFlow,
    startPlacementFromInventory,
    returnPlacedItemToInventory,
    getInventorySnowdomeParts,
    getPlacedSnowdomePartsAtPosition,
    isPending,
  } = useItemAcquisition({
    roomId,
    calendarItems,
    room,
  });

  // 配置済みアイテムの選択状態
  const [selectedPlacedItem, setSelectedPlacedItem] =
    useState<CalendarItemWithItem | null>(null);

  // 配置済みアイテムクリック
  const handlePlacedItemClick = useCallback(
    (calendarItem: CalendarItemWithItem) => {
      if (phase !== "idle") return; // 配置モード中は無視
      setSelectedPlacedItem(calendarItem);
    },
    [phase],
  );

  // 位置変更開始
  const handleStartReposition = useCallback(() => {
    if (!selectedPlacedItem) return;
    startPlacementFromInventory(selectedPlacedItem);
    setSelectedPlacedItem(null);
  }, [selectedPlacedItem, startPlacementFromInventory]);

  // 持ち物に戻す
  const handleReturnToInventory = useCallback(async () => {
    if (!selectedPlacedItem) return;
    await returnPlacedItemToInventory(selectedPlacedItem);
    setSelectedPlacedItem(null);
  }, [selectedPlacedItem, returnPlacedItemToInventory]);

  // メニュー閉じる
  const handleCloseMenu = useCallback(() => {
    setSelectedPlacedItem(null);
  }, []);

  // 配置モード
  const {
    isPlacementValid,
    setIsPlacementValid,
    isLocked,
    tempPosition,
    tempRotation,
    handlePositionChange,
    handleLockChange,
    resetTempPlacement,
  } = usePlacementMode();

  // filledDays、filledDayUserNames、openedDaysを計算
  const { filledDays, filledDayUserNames, openedDays } = useMemo(() => {
    if (!calendarItems || !room)
      return {
        filledDays: [] as number[],
        filledDayUserNames: {} as Record<number, string>,
        openedDays: [] as number[],
      };

    const startDate = new Date(room.startAt);
    const days: number[] = [];
    const userNames: Record<number, string> = {};
    const opened: number[] = [];

    for (const item of calendarItems) {
      const openDate = new Date(item.openDate);
      // startDateからopenDateまでの日数を計算（1始まり）
      const diffTime = openDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      days.push(diffDays);
      userNames[diffDays] = item.userName;

      // 開封済みのアイテムは引き出しを開いた状態に
      if (item.isOpened) {
        opened.push(diffDays - 1); // drawerのインデックスは0始まり
      }
    }

    return {
      filledDays: days,
      filledDayUserNames: userNames,
      openedDays: opened,
    };
  }, [calendarItems, room]);

  // クリック可能な日を計算（今日開封可能なアイテムがある場合）
  const clickableDays = useMemo(() => {
    if (todayOpenableItem && todayDay) {
      return [todayDay];
    }
    return [];
  }, [todayOpenableItem, todayDay]);

  // 開封済みの引き出しは常に開いた状態 + ユーザー操作で開いた引き出し
  const effectiveOpenedDrawers = useMemo(() => {
    return [...new Set([...openedDays, ...openedDrawers])];
  }, [openedDays, openedDrawers]);

  // 引き出しクリック時のハンドラー
  const handleDrawerClick = (day: number) => {
    if (canOpenDay(day)) {
      // 引き出しを開く
      setOpenedDrawers([day - 1]);
      handleDayClick(day);
    }
  };

  // モーダルを閉じる時
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setOpenedDrawers([]);
      resetFlow();
    }
  };

  // 配置決定時
  const handleConfirmPlacement = async () => {
    if (tempPosition && tempRotation && isPlacementValid) {
      await handlePlacement(tempPosition, tempRotation);
      setOpenedDrawers([]);
      resetTempPlacement();
    }
  };

  // スキップ時
  const handleSkip = async () => {
    await handleSkipPlacement();
    setOpenedDrawers([]);
    resetTempPlacement();
  };

  // 「次へ」を押した時（配置モードへ）
  const handleNext = () => {
    handleNextFromGetModal();
    handleExitFocusMode();
  };

  // 配置モード中かどうか
  const isPlacementMode = phase === "placement";
  const isSnowdomePlacementMode = phase === "snowdome_placement";
  const isAnyPlacementMode = isPlacementMode || isSnowdomePlacementMode;

  // snowdome配置用のパーツを計算
  const snowdomePartsForPlacement = useMemo(() => {
    if (!isSnowdomePlacementMode || !calendarItems || !targetCalendarItem) {
      return [];
    }

    // 再配置の場合（既に配置済みのsnowdomeを移動）
    if (
      targetCalendarItem.position &&
      targetCalendarItem.position.length === 3
    ) {
      const position = targetCalendarItem.position as [number, number, number];
      return getPlacedSnowdomePartsAtPosition(position);
    }

    // 新規配置の場合（インベントリから配置）
    const inventoryParts = getInventorySnowdomeParts();
    const allParts = [...inventoryParts, targetCalendarItem];

    // 重複を除去
    return allParts.filter(
      (part, index, self) => self.findIndex((p) => p.id === part.id) === index,
    );
  }, [
    isSnowdomePlacementMode,
    calendarItems,
    targetCalendarItem,
    getInventorySnowdomeParts,
    getPlacedSnowdomePartsAtPosition,
  ]);

  // snowdome配置確定時
  const handleConfirmSnowdomePlacement = async () => {
    if (tempPosition && tempRotation && isPlacementValid) {
      await handleSnowdomePlacement(tempPosition, tempRotation);
      setOpenedDrawers([]);
      resetTempPlacement();
    }
  };

  return (
    <div className="w-full h-svh flex">
      <div className="w-full p-3 md:p-6 lg:p-8 grow h-full grid grid-cols-2">
        {!isFocusMode && !isAnyPlacementMode && (
          <Button
            onClick={() => setIsInventoryDialogOpen((prev) => !prev)}
            className="relative z-30 self-end size-20 md:size-22 lg:size-24 border-4 border-primary-foreground rounded-3xl font-bold text-sm md:text-base shadow-xl hover:[&_span]:animate-bounce active:scale-95"
          >
            <span className="absolute -top-2.5 -right-2.5 p-1.5 md:p-2 bg-primary-foreground rounded-full">
              <InventoryIcon className="size-4 md:size-5 lg:size-6 text-primary" />
            </span>
            持ち物
          </Button>
        )}
        <InventoryDialog
          roomId={roomId}
          open={isInventoryDialogOpen}
          onOpenChange={setIsInventoryDialogOpen}
          onStartPlacement={startPlacementFromInventory}
        />
        {isFocusMode && !isAnyPlacementMode && (
          <Button
            onClick={handleExitFocusMode}
            className="justify-self-end col-span-2 w-fit z-40"
            variant="outline"
          >
            <X className="size-4" />
            閉じる
          </Button>
        )}
      </div>

      {/* アイテムゲットモーダル */}
      {phase === "get_modal" && targetCalendarItem && targetDay && (
        <ItemGetDialog
          open={true}
          onOpenChange={handleModalClose}
          day={targetDay}
          calendarItem={targetCalendarItem}
          onNext={handleNext}
        />
      )}

      {/* 配置モードオーバーレイ */}
      {isPlacementMode && (
        <ItemPlacementOverlay
          onConfirm={handleConfirmPlacement}
          onSkip={handleSkip}
          isPending={isPending}
          isPlacementValid={isPlacementValid}
          isLocked={isLocked}
        />
      )}

      {/* snowdome配置モードオーバーレイ */}
      {isSnowdomePlacementMode && (
        <ItemPlacementOverlay
          onConfirm={handleConfirmSnowdomePlacement}
          onSkip={handleSkip}
          isPending={isPending}
          isPlacementValid={isPlacementValid}
          isLocked={isLocked}
        />
      )}

      {/* 3Dオブジェクト */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<Loading text="部屋を読み込み中..." />}>
          <Canvas
            camera={{ position: [2.3, 0.5, 2], fov: 45 }}
            onPointerMissed={handleCloseMenu}
          >
            <ambientLight intensity={isFocusMode ? 0.15 : 0.4} />
            <Environment
              preset="apartment"
              environmentIntensity={isFocusMode ? 0.2 : 1}
            />

            {/* フォーカスモード時にカレンダーを照らすライト */}
            <FocusLights isFocusMode={isFocusMode} />

            <Physics>
              {/* 部屋のGLB（物理コライダーあり） */}
              <RigidBody type="fixed" colliders="trimesh" friction={5}>
                <Gltf
                  ref={roomRef}
                  src={roomUrl}
                  scale={1}
                  position={[0, -1, 0]}
                />
              </RigidBody>

              <group position={[0, 0, 1]}>
                <RigidBody
                  lockRotations
                  type={isAnyPlacementMode ? "kinematicPosition" : "dynamic"}
                >
                  <Gltf src={tableUrl} scale={6} position={[0, 0, 0]} />
                </RigidBody>
                <RigidBody
                  lockRotations
                  type={isAnyPlacementMode ? "kinematicPosition" : "dynamic"}
                >
                  <Calendar
                    groupRef={calendarRef}
                    position={CALENDAR_POSITION}
                    rotation={[0, 0, 0]}
                    isFocusMode={isFocusMode}
                    onCalendarClick={
                      isAnyPlacementMode ? () => {} : handleFocusCalendar
                    }
                    onDayClick={handleDrawerClick}
                    openedDrawers={effectiveOpenedDrawers}
                    onOpenedDrawersChange={setOpenedDrawers}
                    filledDays={filledDays}
                    filledDayUserNames={filledDayUserNames}
                    isAnonymous={room?.isAnonymous ?? true}
                    clickableDays={clickableDays}
                  />
                </RigidBody>
              </group>

              {/* 配置済みアイテム */}
              <PlacedItems
                ref={placedItemsRef}
                calendarItems={calendarItems}
                selectedItemId={selectedPlacedItem?.id ?? null}
                excludeItemId={
                  isPlacementMode ? (targetCalendarItem?.id ?? null) : null
                }
                onItemClick={handlePlacedItemClick}
                onReposition={handleStartReposition}
                onReturnToInventory={handleReturnToInventory}
                isPending={isPending}
              />

              {/* 配置モード時のドラッグ可能アイテム */}
              {isPlacementMode && targetCalendarItem && roomRef && (
                <PlacementDraggableItem
                  roomRef={roomRef as React.RefObject<THREE.Group>}
                  placedItemsRef={
                    placedItemsRef as React.RefObject<THREE.Group>
                  }
                  calendarItem={targetCalendarItem}
                  onPositionChange={handlePositionChange}
                  isPlacementValid={isPlacementValid}
                  setIsPlacementValid={setIsPlacementValid}
                  initialRotation={tempRotation ?? undefined}
                  onLockChange={handleLockChange}
                />
              )}

              {/* snowdome配置モード時のドラッグ可能snowdome */}
              {isSnowdomePlacementMode &&
                snowdomePartsForPlacement.length > 0 &&
                roomRef && (
                  <DraggableSnowdome
                    snowdomeParts={snowdomePartsForPlacement}
                    onPositionChange={handlePositionChange}
                    isPlacementValid={isPlacementValid}
                    setIsPlacementValid={setIsPlacementValid}
                    initialRotation={tempRotation ?? undefined}
                    onLockChange={handleLockChange}
                    roomRef={roomRef as React.RefObject<THREE.Group>}
                    placedItemsRef={
                      placedItemsRef as React.RefObject<THREE.Group>
                    }
                  />
                )}
            </Physics>

            <CameraControls
              ref={cameraControlsRef}
              enabled={!isFocusMode}
              minDistance={0}
              maxDistance={5}
              dollySpeed={0.3}
              smoothTime={0.25}
              makeDefault
            />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}
