import { Gltf, Html, Text } from "@react-three/drei";
import { CalendarIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { Group } from "three";
import { Button } from "@/components/ui/button";
import { R2_BASE_URL } from "@/constants/r2-url";

const calendarBoxUrl = `${R2_BASE_URL}/static/calendar_box.glb`;

const calendarMainUrl = `${R2_BASE_URL}/static/calendar_main.glb`;

const COLS = 5;
const ROWS = 5;

const START_X = 0;
const START_Y = 0;
const START_Z = 0;

const GAP_Y = 0.535;
const GAP_Z = 0.542;

function getDrawerPosition(
  index: number,
  isOpened: boolean,
): [number, number, number] {
  const col = index % COLS;
  const row = Math.floor(index / COLS);

  return [
    START_X + (isOpened ? 0.2 : 0),
    START_Y - row * GAP_Y,
    START_Z - col * GAP_Z,
  ];
}

export default function Calendar({
  position,
  rotation,
  isFocusMode,
  onCalendarClick,
  onDayClick,
  groupRef,
  openedDrawers,
  onOpenedDrawersChange,
  filledDays = [],
  filledDayUserNames = {},
  isAnonymous = true,
  clickableDays,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  isFocusMode: boolean;
  onCalendarClick: () => void;
  onDayClick?: (day: number) => void;
  groupRef?: React.RefObject<Group | null>;
  openedDrawers?: number[];
  onOpenedDrawersChange?: (drawers: number[]) => void;
  filledDays?: number[];
  filledDayUserNames?: Record<number, string>;
  isAnonymous?: boolean;
  /** クリック可能な日のリスト。指定されない場合はfilledでない日がクリック可能 */
  clickableDays?: number[];
}) {
  const [internalOpened, setInternalOpened] = useState<number[]>([]);
  const isOpened = openedDrawers ?? internalOpened;

  const handleSetOpened = (newDrawers: number[]) => {
    if (onOpenedDrawersChange) {
      onOpenedDrawersChange(newDrawers);
    } else {
      setInternalOpened(newDrawers);
    }
  };

  // 外部から引き出しを閉じる場合の処理
  useEffect(() => {
    if (openedDrawers !== undefined && openedDrawers.length === 0) {
      setInternalOpened([]);
    }
  }, [openedDrawers]);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: calendar click handler
    <group
      ref={groupRef}
      scale={0.1}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      onClick={(e) => {
        // フォーカスモードでない場合は、カレンダー全体クリックでフォーカスモードへ
        if (!isFocusMode) {
          e.stopPropagation();
          onCalendarClick();
        }
      }}
    >
      {!isFocusMode && <ToolTip />}
      <Gltf src={calendarMainUrl} />

      {Array.from({ length: COLS * ROWS }).map((_, i) => {
        const day = i + 1;
        // clickableDaysが指定されていればそれを使用
        const isClickable = clickableDays ? clickableDays.includes(day) : true;

        return (
          <Drawer
            // biome-ignore lint/suspicious/noArrayIndexKey: index is unique
            key={i}
            day={day}
            position={getDrawerPosition(i, isOpened.includes(i))}
            isFocusMode={isFocusMode}
            isFilled={filledDays.includes(day)}
            isClickable={isClickable}
            userName={filledDayUserNames[day]}
            isAnonymous={isAnonymous}
            setIsOpened={() =>
              handleSetOpened(
                isOpened.includes(i)
                  ? isOpened.filter((d) => d !== i)
                  : [...isOpened, i],
              )
            }
            onDayClick={onDayClick}
          />
        );
      })}
    </group>
  );
}

function ToolTip() {
  return (
    <Html center position={[0, 4.2, 2]}>
      <Button
        variant="outline"
        className="text-primary bg-background/80 font-semibold text-xs backdrop-blur-md border-background"
      >
        <CalendarIcon className="size-4" />
        カレンダーを開ける
      </Button>
    </Html>
  );
}

function Drawer({
  day,
  position,
  isFocusMode,
  isFilled,
  isClickable,
  userName,
  isAnonymous,
  setIsOpened,
  onDayClick,
}: {
  day: number;
  position: [number, number, number];
  isFocusMode: boolean;
  isFilled: boolean;
  isClickable: boolean;
  userName?: string;
  isAnonymous: boolean;
  setIsOpened: () => void;
  onDayClick?: (day: number) => void;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: day is dynamic
    <group
      position={position}
      onClick={(e) => {
        // フォーカスモード時かつクリック可能な日付のみ引き出しを開閉
        if (isFocusMode && isClickable) {
          e.stopPropagation();
          setIsOpened();
          // 日付クリック時にコールバックを呼び出す
          if (onDayClick) {
            onDayClick(day);
          }
        }
      }}
    >
      <Gltf src={calendarBoxUrl} />
      <Text
        fontSize={0.1}
        position={[0.223, 3.02, 1.107]}
        rotation={[0, Math.PI / 2, 0]}
        anchorX="center"
        anchorY="middle"
        fontWeight={800}
        color={isFilled ? "#c41e3a" : "#006003"}
        outlineWidth={0.015}
        outlineColor={"#fff"}
      >
        {day}
      </Text>
      {/* 埋まっている日付には匿名モードならチェック、そうでなければユーザー名を表示 */}
      {isFilled && (
        <Text
          fontSize={isAnonymous ? 0.06 : 0.05}
          position={[0.223, 2.92, 1.107]}
          rotation={[0, Math.PI / 2, 0]}
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
          color="#c41e3a"
          maxWidth={0.4}
        >
          {isAnonymous ? "✓" : (userName ?? "✓")}
        </Text>
      )}
    </group>
  );
}
