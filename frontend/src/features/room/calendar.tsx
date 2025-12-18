import { Gltf, Text } from "@react-three/drei";
import type React from "react";
import { useState } from "react";
import type { Group } from "three";
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
  groupRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  isFocusMode: boolean;
  onCalendarClick: () => void;
  groupRef?: React.RefObject<Group | null>;
}) {
  const [isOpened, setIsOpened] = useState<number[]>([]);
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
      <Gltf src={calendarMainUrl} />

      {Array.from({ length: COLS * ROWS }).map((_, i) => (
        <Drawer
          // biome-ignore lint/suspicious/noArrayIndexKey: index is unique
          key={i}
          day={i + 1}
          position={getDrawerPosition(i, isOpened.includes(i))}
          isFocusMode={isFocusMode}
          setIsOpened={() =>
            setIsOpened((prev) =>
              prev.includes(i) ? prev.filter((day) => day !== i) : [...prev, i],
            )
          }
        />
      ))}
    </group>
  );
}

function Drawer({
  day,
  position,
  isFocusMode,
  setIsOpened,
}: {
  day: number;
  position: [number, number, number];
  isFocusMode: boolean;
  setIsOpened: () => void;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: day is dynamic
    <group
      position={position}
      onClick={(e) => {
        // フォーカスモード時のみ引き出しを開閉
        if (isFocusMode) {
          e.stopPropagation();
          setIsOpened();
        }
      }}
    >
      <Gltf src={calendarBoxUrl} />
      <Text
        fontSize={0.1}
        position={[0.223, 3, 1.107]}
        rotation={[0, Math.PI / 2, 0]}
        anchorX="center"
        anchorY="middle"
        fontWeight={800}
        color={"#006003"}
        outlineWidth={0.015}
        outlineColor={"#fff"}
      >
        {day}
      </Text>
    </group>
  );
}
