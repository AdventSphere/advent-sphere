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

export type AcquisitionPhase = "idle" | "get_modal" | "placement" | "completed";

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
      // const now = new Date();
      // const openDate = new Date(item.openDate);
      // TODO: テスト用に時刻チェックを一時的に無効化
      return true; // now >= openDate;
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
   * ゲットモーダルから「次へ」を押した時
   */
  const handleNextFromGetModal = useCallback(() => {
    setPhase("placement");
  }, []);

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
      setTargetCalendarItem(calendarItem);
      setTargetDay(null); // 持ち物からの配置なので日付は不要
      setPhase("placement");
    },
    [],
  );

  /**
   * 配置済みアイテムを持ち物に戻す
   */
  const returnPlacedItemToInventory = useCallback(
    async (calendarItem: CalendarItemWithItem) => {
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

      await invalidateQueries();
    },
    [roomId, patchCalendarItem, invalidateQueries],
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
    resetFlow,
    startPlacementFromInventory,
    returnPlacedItemToInventory,
    isPending,
  };
}
