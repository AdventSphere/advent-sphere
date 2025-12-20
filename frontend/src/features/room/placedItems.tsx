import { Gltf, useGLTF, useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import type { CalendarItemWithItem } from "common/generate/adventSphereAPI.schemas";
import { useLayoutEffect, useState } from "react";
import * as THREE from "three";
import { R2_BASE_URL } from "@/constants/r2-url";

interface PlacedItemsProps {
  calendarItems: CalendarItemWithItem[] | undefined | null;
}

/**
 * 部屋に配置済みのアイテムをレンダリング
 */
export default function PlacedItems({ calendarItems }: PlacedItemsProps) {
  if (!calendarItems) return null;

  // position が設定されているアイテムのみ表示
  const placedItems = calendarItems.filter(
    (item) => item.position && item.position.length === 3 && item.isOpened,
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
      {calendarItem.item.type !== "photo_frame" && (
        <Gltf
          src={modelUrl}
          scale={1}
          position={position}
          rotation={rotation}
        />
      )}
      {calendarItem.item.type === "photo_frame" && calendarItem.imageId && (
        <PhotoFrameModel
          itemId={calendarItem.itemId}
          imageId={calendarItem.imageId}
          position={position}
          rotation={rotation}
        />
      )}
      {calendarItem.item.type === "photo_frame" && !calendarItem.imageId && (
        <Gltf
          src={modelUrl}
          scale={1}
          position={position}
          rotation={rotation}
        />
      )}
    </RigidBody>
  );
}

function PhotoFrameModel({
  itemId,
  imageId,
  position,
  rotation,
}: {
  itemId: string;
  imageId: string;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const { nodes, materials } = useGLTF(
    `${R2_BASE_URL}/item/object/${itemId}.glb`,
  );
  const texture = useTexture(`${R2_BASE_URL}/item/user_image/${imageId}.png`);

  const [config] = useState({
    scaleX: 1.0,
    scaleY: 1.0,
    offsetX: 0.0,
    offsetY: 0.0,
    rotation: 90,
  });

  useLayoutEffect(() => {
    texture.flipY = false;
    texture.center.set(0.5, 0.5);
    texture.rotation = config.rotation * (Math.PI / 180);
    texture.repeat.set(config.scaleX, config.scaleY);
    texture.offset.set(config.offsetX, config.offsetY);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture, config]);

  return (
    <group dispose={null} position={position} rotation={rotation}>
      {/* ------------------------------------------------
      1. 写真部分 (Blender名: "Image")
      ------------------------------------------------
      Blenderのアウトライナーで確認した名前 "Image" を指定します
    */}
      {nodes.Image && (
        <mesh
          geometry={(nodes.Image as THREE.Mesh).geometry}
          position={(nodes.Image as THREE.Mesh).position}
          rotation={(nodes.Image as THREE.Mesh).rotation}
          scale={(nodes.Image as THREE.Mesh).scale}
        >
          <meshStandardMaterial
            map={texture}
            roughness={0.2} // 写真っぽく少しツヤを入れる
            metalness={0.0}
            emissive={new THREE.Color(0x000000)}
          />
        </mesh>
      )}

      {/* ------------------------------------------------
      2. フレーム部分 (Blender名: "PhotoFrame")
      ------------------------------------------------
    */}
      {nodes.PhotoFrame && (
        <mesh
          geometry={(nodes.PhotoFrame as THREE.Mesh).geometry}
          material={materials.Material} // 元のマテリアル、または変更可
          position={(nodes.PhotoFrame as THREE.Mesh).position}
          rotation={(nodes.PhotoFrame as THREE.Mesh).rotation}
          scale={(nodes.PhotoFrame as THREE.Mesh).scale}
        >
          {/* もし枠の色を変えたい場合は以下をコメントアウト解除 */}
          {/* <meshStandardMaterial color="white" roughness={0.5} /> */}
        </mesh>
      )}
    </group>
  );
}
