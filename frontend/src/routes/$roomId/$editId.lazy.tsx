import { Environment, Gltf } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  useGetCalendarItemsRoomIdCalendarItems,
  usePostCalendarItemsRoomIdCalendarItems,
} from "common/generate/calendar-items/calendar-items";
import { useGetRoomsId } from "common/generate/room/room";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import Loading from "@/components/Loading";
import { R2_BASE_URL } from "@/constants/r2-url";
import { useUser } from "@/context/UserContext";
import ItemSelectDialog from "@/features/edit/itemSelectDialog";
import Calendar from "@/features/room/calendar";
import NameInput from "@/features/user/nameInput";

export const Route = createLazyFileRoute("/$roomId/$editId")({
  component: RouteComponent,
});

// カメラをカレンダーの正面に配置するコンポーネント（フォーカスモードと同じロジック）
function CameraSetup({
  calendarRef,
}: {
  calendarRef: React.RefObject<Group | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!calendarRef.current) return;

      // カレンダーのバウンディングボックスを計算
      const box = new THREE.Box3().setFromObject(calendarRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // 画面のアスペクト比を取得
      const aspect = window.innerWidth / window.innerHeight;

      // カレンダーの高さ・幅に基づいて必要な距離を計算
      // FOV 50度を想定
      const fov = 50 * (Math.PI / 180);
      const calendarHeight = size.y;
      const calendarWidth = size.z;

      // 縦横それぞれで必要な距離を計算し、大きい方を採用
      const distanceForHeight = calendarHeight / (2 * Math.tan(fov / 2));
      const distanceForWidth = calendarWidth / (2 * Math.tan(fov / 2) * aspect);
      const distance = Math.max(distanceForHeight, distanceForWidth) * 0.9;

      // カメラをカレンダーの正面に配置（フォーカスモードと同じ）
      camera.position.set(
        center.x + distance,
        center.y + 0.05,
        center.z - 0.05,
      );
      camera.lookAt(center.x, center.y + 0.02, center.z - 0.05);
    }, 100);

    return () => clearTimeout(timer);
  }, [camera, calendarRef]);

  return null;
}

function RouteComponent() {
  const { roomId, editId } = Route.useParams();
  const calendarRef = useRef<Group>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openedDrawers, setOpenedDrawers] = useState<number[]>([]);

  const { user } = useUser();
  const { data: room } = useGetRoomsId(roomId);
  const { data: calendarItems, refetch } =
    useGetCalendarItemsRoomIdCalendarItems(roomId);

  const { mutateAsync: postCalendarItem } =
    usePostCalendarItemsRoomIdCalendarItems();

  // calendarItemsから埋まっている日付とユーザー名のマップを計算
  const { filledDays, filledDayUserNames } = useMemo(() => {
    if (!calendarItems || !room)
      return { filledDays: [], filledDayUserNames: {} as Record<number, string> };

    const startDate = new Date(room.startAt);
    const days: number[] = [];
    const userNames: Record<number, string> = {};

    for (const item of calendarItems) {
      const openDate = new Date(item.openDate);
      // startDateからopenDateまでの日数を計算（1始まり）
      const diffTime = openDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      days.push(diffDays);
      userNames[diffDays] = item.userName;
    }

    return { filledDays: days, filledDayUserNames: userNames };
  }, [calendarItems, room]);

  const handleDayClick = (day: number) => {
    const drawerIndex = day - 1;
    setSelectedDay(day);
    setIsDialogOpen(true);
    // 引き出しを開く
    setOpenedDrawers([drawerIndex]);
  };

  const handleItemSelect = async (itemId: string) => {
    console.log(`Day ${selectedDay} selected item:`, itemId);
    if (!room) return;
    const startAt = new Date(room.startAt);
    const openDate = new Date(
      startAt.setDate(startAt.getDate() + (selectedDay ?? 0) - 1),
    );

    await postCalendarItem({
      roomId,
      data: {
        editId,
        calendarItem: {
          userId: user?.id ?? "",
          roomId,
          openDate: openDate.toISOString(),
          itemId,
        },
      },
    });
    await refetch();
    handleDialogClose(false);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // ダイアログが閉じられたら引き出しも閉じる
      setOpenedDrawers([]);
    }
  };

  if (!user) {
    return <NameInput />;
  }
  return (
    <div className="w-full h-svh flex">
      {/* 3Dオブジェクト */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<Loading text="読み込み中..." />}>
          <Canvas camera={{ position: [1, 0, 0], fov: 50 }}>
            <ambientLight intensity={0.15} />
            <Environment preset="apartment" environmentIntensity={0.2} />
            <directionalLight
              position={[2, 1.5, -0.5]}
              intensity={3.6}
              target-position={[0, 0, 0]}
            />

            <Gltf
              src={`${R2_BASE_URL}/static/room.glb`}
              position={[0, -0.8, 0]}
            />
            <Gltf
              src={`${R2_BASE_URL}/static/table%20(1).glb`}
              position={[0, -0.5, 0]}
              scale={6}
            />
            <Calendar
              groupRef={calendarRef}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              isFocusMode={true}
              onCalendarClick={() => {}}
              onDayClick={handleDayClick}
              openedDrawers={openedDrawers}
              onOpenedDrawersChange={setOpenedDrawers}
              filledDays={filledDays}
              filledDayUserNames={filledDayUserNames}
              isAnonymous={room?.isAnonymous ?? true}
            />
            <CameraSetup calendarRef={calendarRef} />
          </Canvas>
        </Suspense>
      </div>

      {/* アイテム選択ダイアログ */}
      {selectedDay !== null && (
        <ItemSelectDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          day={selectedDay}
          onSelect={handleItemSelect}
        />
      )}
    </div>
  );
}
