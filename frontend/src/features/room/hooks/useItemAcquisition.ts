import { useQueryClient } from "@tanstack/react-query";
import type {
  CalendarItemWithItem,
  Room,
} from "common/generate/adventSphereAPI.schemas";
import {
  getGetCalendarItemsRoomIdCalendarItemsInventoryQueryKey,
  getGetCalendarItemsRoomIdCalendarItemsQueryKey,
  getGetCalendarItemsRoomIdCalendarItemsRoomQueryKey,
  usePatchCalendarItemsRoomIdCalendarItemsId,
} from "common/generate/calendar-items/calendar-items";
import { useCallback, useMemo, useState } from "react";

export type AcquisitionPhase =
  | "idle"
  | "get_modal"
  | "placement"
  | "snowdome_placement"
  | "completed";

/**
 * snowdomeアイテムかどうか判定
 */
function isSnowdomeItem(item: CalendarItemWithItem): boolean {
  return item.item.type === "snowdome";
}

/**
 * 4日目（最終日）かどうか判定
 */
function isSnowdomeFinalDay(room: Room, openDate: Date): boolean {
  if (!room.snowDomePartsLastDate) return false;
  const lastDate = new Date(room.snowDomePartsLastDate);
  return (
    openDate.getFullYear() === lastDate.getFullYear() &&
    openDate.getMonth() === lastDate.getMonth() &&
    openDate.getDate() === lastDate.getDate()
  );
}

interface UseItemAcquisitionProps {
  roomId: string;
  calendarItems: CalendarItemWithItem[] | undefined;
  room: Room | undefined;
}

/**
 * openDateからカレンダーの日付（1-25）を計算
 */
function getCalendarDayFromOpenDate(openDate: Date, startAt: Date): number {
  const diffTime = openDate.getTime() - startAt.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

/**
 * 今日のカレンダー日付を取得（1-25）
 */
function getTodayCalendarDay(startAt: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - startAt.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  // HACK: あけたい日付を直接返すと自由にあけれる（例：12）
  return diffDays;
}

export function useItemAcquisition({
  roomId,
  calendarItems,
  room,
}: UseItemAcquisitionProps) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<AcquisitionPhase>("idle");
  const [targetCalendarItem, setTargetCalendarItem] =
    useState<CalendarItemWithItem | null>(null);
  const [targetDay, setTargetDay] = useState<number | null>(null);

  const { mutateAsync: patchCalendarItem, isPending } =
    usePatchCalendarItemsRoomIdCalendarItemsId();

  /**
   * 指定した日のアイテムを取得（未開封のもの）
   */
  const getItemForDay = useCallback(
    (day: number): CalendarItemWithItem | null => {
      if (!calendarItems || !room) return null;

      const startAt = new Date(room.startAt);

      return (
        calendarItems.find((item) => {
          // 既に開封済みか
          if (item.isOpened) return false;

          // この日のアイテムか
          const itemDay = getCalendarDayFromOpenDate(
            new Date(item.openDate),
            startAt,
          );
          return itemDay === day;
        }) ?? null
      );
    },
    [calendarItems, room],
  );

  /**
   * 指定した日の引き出しを開けられるかどうか
   * - 今日の日付か
   * - 未開封アイテムがあるか
   * - openDateの時刻を過ぎているか
   */
  const canOpenDay = useCallback(
    (day: number): boolean => {
      if (!room) {
        return false;
      }

      const startAt = new Date(room.startAt);
      const todayDay = getTodayCalendarDay(startAt);

      // 今日の日付でなければ開けられない
      if (day !== todayDay) {
        return false;
      }

      // 該当日のアイテムを取得
      const item = getItemForDay(day);
      if (!item) {
        return false;
      }

      // openDateの時刻を過ぎているか
      const now = new Date();
      const openDate = new Date(item.openDate);
      // HACK: テスト用に時刻チェックを一時的に無効化 (trueにすると自由にあけれる)
      return now >= openDate;
    },
    [room, getItemForDay],
  );

  /**
   * 今日開封可能なアイテムを取得
   */
  const todayOpenableItem = useMemo((): CalendarItemWithItem | null => {
    if (!room) return null;

    const startAt = new Date(room.startAt);
    const todayDay = getTodayCalendarDay(startAt);

    if (!canOpenDay(todayDay)) return null;
    return getItemForDay(todayDay);
  }, [room, canOpenDay, getItemForDay]);

  /**
   * 今日のカレンダー日付
   */
  const todayDay = useMemo((): number | null => {
    if (!room) return null;
    const startAt = new Date(room.startAt);
    return getTodayCalendarDay(startAt);
  }, [room]);

  /**
   * 引き出しクリック時の処理
   */
  const handleDayClick = useCallback(
    (day: number) => {
      if (!canOpenDay(day)) return;

      const item = getItemForDay(day);
      if (!item) return;

      setTargetCalendarItem(item);
      setTargetDay(day);
      setPhase("get_modal");
    },
    [canOpenDay, getItemForDay],
  );

  /**
   * クエリの無効化
   */
  const invalidateQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetCalendarItemsRoomIdCalendarItemsQueryKey(roomId),
      }),
      queryClient.invalidateQueries({
        queryKey:
          getGetCalendarItemsRoomIdCalendarItemsInventoryQueryKey(roomId),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetCalendarItemsRoomIdCalendarItemsRoomQueryKey(roomId),
      }),
    ]);
  }, [queryClient, roomId]);

  /**
   * フローのリセット
   */
  const resetFlow = useCallback(() => {
    setPhase("idle");
    setTargetCalendarItem(null);
    setTargetDay(null);
  }, []);

  /**
   * インベントリにあるsnowdomeパーツを取得（開封済み・未配置）
   */
  const getInventorySnowdomeParts = useCallback((): CalendarItemWithItem[] => {
    if (!calendarItems) return [];
    return calendarItems.filter(
      (item) =>
        item.item.type === "snowdome" && item.isOpened && !item.position,
    );
  }, [calendarItems]);

  /**
   * 指定位置に配置されているsnowdomeパーツを取得
   */
  const getPlacedSnowdomePartsAtPosition = useCallback(
    (position: [number, number, number]): CalendarItemWithItem[] => {
      if (!calendarItems) return [];
      return calendarItems.filter(
        (item) =>
          item.item.type === "snowdome" &&
          item.isOpened &&
          item.position &&
          item.position.length === 3 &&
          Math.abs((item.position[0] as number) - position[0]) < 0.001 &&
          Math.abs((item.position[1] as number) - position[1]) < 0.001 &&
          Math.abs((item.position[2] as number) - position[2]) < 0.001,
      );
    },
    [calendarItems],
  );

  /**
   * ゲットモーダルから「次へ」を押した時
   */
  const handleNextFromGetModal = useCallback(async () => {
    if (!targetCalendarItem || !room) {
      setPhase("placement");
      return;
    }

    // snowdomeアイテムの場合は特殊処理
    if (isSnowdomeItem(targetCalendarItem)) {
      const openDate = new Date(targetCalendarItem.openDate);
      const isFinalDay = isSnowdomeFinalDay(room, openDate);

      if (isFinalDay) {
        // 4日目: snowdome配置モードへ
        setPhase("snowdome_placement");
      } else {
        // 1-3日目: 自動で持ち物へ（配置をスキップ）
        await patchCalendarItem({
          roomId,
          id: targetCalendarItem.id,
          data: {
            calendarItem: {
              isOpened: true,
              position: null,
              rotation: null,
            },
          },
        });
        await invalidateQueries();
        setPhase("completed");
        setTimeout(() => {
          resetFlow();
        }, 100);
      }
      return;
    }

    // 通常アイテム: 配置モードへ
    setPhase("placement");
  }, [
    targetCalendarItem,
    room,
    roomId,
    patchCalendarItem,
    invalidateQueries,
    resetFlow,
  ]);

  /**
   * アイテム配置確定時
   */
  const handlePlacement = useCallback(
    async (
      position: [number, number, number],
      rotation: [number, number, number],
    ) => {
      if (!targetCalendarItem) return;

      await patchCalendarItem({
        roomId,
        id: targetCalendarItem.id,
        data: {
          calendarItem: {
            isOpened: true,
            position,
            rotation,
          },
        },
      });

      await invalidateQueries();
      setPhase("completed");

      // 少し待ってからリセット
      setTimeout(() => {
        resetFlow();
      }, 100);
    },
    [
      targetCalendarItem,
      roomId,
      patchCalendarItem,
      invalidateQueries,
      resetFlow,
    ],
  );

  /**
   * 「あとで配置」を押した時（インベントリへ）
   */
  const handleSkipPlacement = useCallback(async () => {
    if (!targetCalendarItem) return;

    await patchCalendarItem({
      roomId,
      id: targetCalendarItem.id,
      data: {
        calendarItem: {
          isOpened: true,
          position: null,
          rotation: null,
        },
      },
    });

    await invalidateQueries();
    setPhase("completed");

    // 少し待ってからリセット
    setTimeout(() => {
      resetFlow();
    }, 100);
  }, [
    targetCalendarItem,
    roomId,
    patchCalendarItem,
    invalidateQueries,
    resetFlow,
  ]);

  /**
   * 持ち物から配置モードに入る
   */
  const startPlacementFromInventory = useCallback(
    (calendarItem: CalendarItemWithItem) => {
      // snowdomeアイテムの場合は、配置済みの場合は同じ位置の全パーツを取得
      if (isSnowdomeItem(calendarItem)) {
        if (calendarItem.position && calendarItem.position.length === 3) {
          // 配置済みのsnowdomeを再配置する場合
          const position = calendarItem.position as [number, number, number];
          const allParts = getPlacedSnowdomePartsAtPosition(position);
          // 最初のパーツをtargetとして設定（全パーツはsnowdome_placementで処理）
          setTargetCalendarItem(allParts[0] || calendarItem);
          setTargetDay(null);
          setPhase("snowdome_placement");
        } else {
          // インベントリから配置する場合
          setTargetCalendarItem(calendarItem);
          setTargetDay(null);
          setPhase("snowdome_placement");
        }
      } else {
        // 通常アイテム
        setTargetCalendarItem(calendarItem);
        setTargetDay(null); // 持ち物からの配置なので日付は不要
        setPhase("placement");
      }
    },
    [getPlacedSnowdomePartsAtPosition],
  );

  /**
   * 配置済みアイテムを持ち物に戻す
   */
  const returnPlacedItemToInventory = useCallback(
    async (calendarItem: CalendarItemWithItem) => {
      // snowdomeアイテムの場合は、同じ位置の全パーツをまとめて戻す
      if (
        isSnowdomeItem(calendarItem) &&
        calendarItem.position &&
        calendarItem.position.length === 3
      ) {
        const position = calendarItem.position as [number, number, number];
        const allParts = getPlacedSnowdomePartsAtPosition(position);

        // 全パーツをまとめてposition/rotationをnullにする
        const returnPromises = allParts.map((part) =>
          patchCalendarItem({
            roomId,
            id: part.id,
            data: {
              calendarItem: {
                position: null,
                rotation: null,
              },
            },
          }),
        );

        await Promise.all(returnPromises);
      } else {
        // 通常アイテム
        await patchCalendarItem({
          roomId,
          id: calendarItem.id,
          data: {
            calendarItem: {
              position: null,
              rotation: null,
            },
          },
        });
      }

      await invalidateQueries();
    },
    [
      roomId,
      patchCalendarItem,
      invalidateQueries,
      getPlacedSnowdomePartsAtPosition,
    ],
  );

  /**
   * snowdome配置確定時（全パーツを同じ位置に配置）
   */
  const handleSnowdomePlacement = useCallback(
    async (
      position: [number, number, number],
      rotation: [number, number, number],
    ) => {
      let allParts: CalendarItemWithItem[] = [];

      if (targetCalendarItem) {
        // 再配置の場合（既に配置済みのsnowdomeを移動）
        if (
          targetCalendarItem.position &&
          targetCalendarItem.position.length === 3
        ) {
          const oldPosition = targetCalendarItem.position as [
            number,
            number,
            number,
          ];
          // 旧位置の全パーツを取得
          allParts = getPlacedSnowdomePartsAtPosition(oldPosition);
        } else {
          // 新規配置の場合（インベントリから配置）
          const inventoryParts = getInventorySnowdomeParts();
          allParts = [...inventoryParts, targetCalendarItem];
        }
      } else {
        // targetCalendarItemがない場合はインベントリのパーツのみ
        allParts = getInventorySnowdomeParts();
      }

      // 重複を除去
      const uniqueParts = allParts.filter(
        (part, index, self) =>
          self.findIndex((p) => p.id === part.id) === index,
      );

      // 各パーツを同じ位置に配置
      const placementPromises = uniqueParts.map((part) =>
        patchCalendarItem({
          roomId,
          id: part.id,
          data: {
            calendarItem: {
              isOpened: true,
              position,
              rotation,
            },
          },
        }),
      );

      await Promise.all(placementPromises);
      await invalidateQueries();
      setPhase("completed");

      setTimeout(() => {
        resetFlow();
      }, 100);
    },
    [
      targetCalendarItem,
      getInventorySnowdomeParts,
      getPlacedSnowdomePartsAtPosition,
      roomId,
      patchCalendarItem,
      invalidateQueries,
      resetFlow,
    ],
  );

  return {
    phase,
    targetCalendarItem,
    targetDay,
    todayOpenableItem,
    todayDay,
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
  };
}
