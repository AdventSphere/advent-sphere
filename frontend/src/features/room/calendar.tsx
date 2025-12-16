import { Gltf, Text } from "@react-three/drei";
import { useState } from "react";
import { R2_BASE_URL } from "@/constants/r2-url";

const calendarBoxUrl = `${R2_BASE_URL}/static/calendar_box.glb`;

const calendarMainUrl = `${R2_BASE_URL}/static/calender_main.glb`;

const COLS = 5;
const ROWS = 5;

const START_X = -0.1;
const START_Y = 16.67;
const START_Z = -6.4;

const GAP_Y = 3.13;
const GAP_Z = -3.17;

function getDrawerPosition(
  index: number,
  isOpened: boolean,
): [number, number, number] {
  const col = index % COLS;
  const row = Math.floor(index / COLS);

  return [
    START_X + (isOpened ? -1.4 : 0),
    START_Y - row * GAP_Y,
    START_Z - col * GAP_Z,
  ];
}

export default function Calendar({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const [isOpened, setIsOpened] = useState<number[]>([]);
  return (
    <group scale={0.1} position={position} rotation={rotation}>
      <Gltf src={calendarMainUrl} />

      {Array.from({ length: COLS * ROWS }).map((_, i) => (
        <Drawer
          // biome-ignore lint/suspicious/noArrayIndexKey: index is unique
          key={i}
          day={i + 1}
          position={getDrawerPosition(i, isOpened.includes(i))}
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
  setIsOpened,
}: {
  day: number;
  position: [number, number, number];
  setIsOpened: () => void;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: day is dynamic
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpened();
      }}
    >
      <Gltf src={calendarBoxUrl} />
      <Text
        fontSize={0.6}
        position={[-1, 0.7, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        anchorX="center"
        anchorY="middle"
        fontWeight={"bold"}
        color={"#fff"}
      >
        {day}
      </Text>
    </group>
  );
}
