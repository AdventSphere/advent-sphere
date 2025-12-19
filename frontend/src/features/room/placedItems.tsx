import { Gltf } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import type { CalendarItemWithItem } from "common/generate/adventSphereAPI.schemas";
import { R2_BASE_URL } from "@/constants/r2-url";

interface PlacedItemsProps {
  calendarItems: CalendarItemWithItem[] | undefined;
}

/**
 * 部屋に配置済みのアイテムをレンダリング
 */
export default function PlacedItems({ calendarItems }: PlacedItemsProps) {
  if (!calendarItems) return null;

  // position が設定されているアイテムのみ表示
  const placedItems = calendarItems.filter(
    (item) => item.position && item.position.length === 3,
  );

  return (
    <>
      {placedItems.map((item) => (
        <PlacedItem key={item.id} calendarItem={item} />
      ))}
    </>
  );
}

interface PlacedItemProps {
  calendarItem: CalendarItemWithItem;
}

function PlacedItem({ calendarItem }: PlacedItemProps) {
  const position = calendarItem.position as [number, number, number];
  const rotation = (calendarItem.rotation as [number, number, number]) ?? [
    0, 0, 0,
  ];

  const modelUrl = `${R2_BASE_URL}/item/object/${calendarItem.itemId}.glb`;

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <Gltf src={modelUrl} scale={1} position={position} rotation={rotation} />
    </RigidBody>
  );
}
