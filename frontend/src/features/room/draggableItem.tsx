import { Gltf, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { RigidBody } from "@react-three/rapier";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { R2_BASE_URL } from "@/constants/r2-url";

interface DraggableItemProps {
  itemId: string;
  onPositionChange?: (
    position: [number, number, number],
    rotation: [number, number, number],
  ) => void;
  isPlacementValid: boolean;
  setIsPlacementValid: (valid: boolean) => void;
  initialRotation?: [number, number, number];
  onLockChange?: (isLocked: boolean) => void;
  roomRef: React.RefObject<THREE.Group>;
  placedItemsRef?: React.RefObject<THREE.Group>;
}

// 回転のステップ（ラジアン）
const ROTATION_STEP = Math.PI / 4; // 45度

export default function DraggableItem({
  itemId,
  onPositionChange,
  setIsPlacementValid,
  initialRotation = [0, 0, 0],
  onLockChange,
  roomRef,
  placedItemsRef,
}: DraggableItemProps) {
  const { camera, pointer, gl } = useThree();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [rotation, setRotation] =
    useState<[number, number, number]>(initialRotation);
  // ロック状態：falseの時はドラッグ中（上空に固定）、trueの時は重力有効で落下
  const [isLocked, setIsLocked] = useState(false);

  const raycaster = useRef(new THREE.Raycaster());
  const lastNotifiedPosition = useRef<[number, number, number] | null>(null);
  const lastNotifiedRotation = useRef<[number, number, number] | null>(null);

  const modelUrl = `${R2_BASE_URL}/item/object/${itemId}.glb`;

  // GLBをプリロード
  useGLTF.preload(modelUrl);

  // レイキャストでマウス位置のXZ座標を取得（ドラッグ中のみ）
  useFrame(() => {
    // ロック中は位置を更新しない
    if (isLocked) {
      // ロック中は物理演算後の位置を取得して親に通知
      if (rigidBodyRef.current) {
        const pos = rigidBodyRef.current.translation();
        const rot = rigidBodyRef.current.rotation();

        // クォータニオンからオイラー角に変換
        const euler = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w),
        );

        const currentPos: [number, number, number] = [pos.x, pos.y, pos.z];
        const currentRot: [number, number, number] = [
          euler.x,
          euler.y,
          euler.z,
        ];

        // 位置が安定したら（速度が小さくなったら）親に通知
        const velocity = rigidBodyRef.current.linvel();
        const speed = Math.sqrt(
          velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2,
        );

        if (speed < 0.1) {
          const shouldNotify =
            !lastNotifiedPosition.current ||
            Math.abs(currentPos[0] - lastNotifiedPosition.current[0]) > 0.01 ||
            Math.abs(currentPos[1] - lastNotifiedPosition.current[1]) > 0.01 ||
            Math.abs(currentPos[2] - lastNotifiedPosition.current[2]) > 0.01;

          if (shouldNotify && onPositionChange) {
            lastNotifiedPosition.current = currentPos;
            lastNotifiedRotation.current = currentRot;
            onPositionChange(currentPos, currentRot);
          }
        }
      }
      return;
    }

    raycaster.current.setFromCamera(pointer, camera);

    // room と配置済みオブジェクトの両方に Raycast
    const targets: THREE.Object3D[] = [];
    if (roomRef.current) targets.push(roomRef.current);
    if (placedItemsRef?.current) targets.push(placedItemsRef.current);

    const intersects = raycaster.current.intersectObjects(targets, true);

    if (!intersects.length || !rigidBodyRef.current) return;

    // 一番近いヒット
    const hit = intersects[0];

    // 床の法線（傾き対応）
    const normal =
      hit.face?.normal.clone().transformDirection(hit.object.matrixWorld) ??
      new THREE.Vector3(0, 1, 0);

    // アイテムの半分の高さ（適宜調整）
    const halfHeight = 0;

    // 法線方向に少し浮かせる（めり込み防止）
    const target = hit.point.clone().add(normal.multiplyScalar(halfHeight));

    // 現在位置
    const current = rigidBodyRef.current.translation();

    // なめらかに追従（滑る感じ）
    const next = {
      x: THREE.MathUtils.lerp(current.x, target.x, 0.25),
      y: THREE.MathUtils.lerp(current.y, target.y, 0.25),
      z: THREE.MathUtils.lerp(current.z, target.z, 0.25),
    };

    // ★ ここが肝
    rigidBodyRef.current.setNextKinematicTranslation(next);

    // 回転（そのままでOK）
    const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2]);
    const quaternion = new THREE.Quaternion().setFromEuler(euler);
    rigidBodyRef.current.setRotation(
      { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
      true,
    );

    // レイキャストがヒットしない場合は配置不可
    if (!intersects.length) {
      setIsPlacementValid(false);
      return;
    }

    // 仮：床に当たっていれば配置可能
    setIsPlacementValid(true);
  });

  // 右クリックまたはRキーで回転
  const handleRotate = useCallback(() => {
    if (isLocked) return; // ロック中は回転不可

    setRotation((prev) => {
      const newRotation: [number, number, number] = [
        prev[0],
        prev[1] + ROTATION_STEP,
        prev[2],
      ];
      return newRotation;
    });
  }, [isLocked]);

  // キーボードイベント（Rキーで回転）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRotate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleRotate]);

  // 右クリックイベント（回転）
  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleRotate();
    };

    canvas.addEventListener("contextmenu", handleContextMenu);
    return () => {
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [gl.domElement, handleRotate]);

  // 左クリックでロック（落下開始）/アンロック（再配置）
  useEffect(() => {
    const canvas = gl.domElement;
    const handleClick = (e: MouseEvent) => {
      // 左クリックのみ
      if (e.button !== 0) return;

      setIsLocked((prev) => {
        const newLocked = !prev;
        onLockChange?.(newLocked);

        // アンロック（再配置）時は速度をリセット
        if (!newLocked && rigidBodyRef.current) {
          rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }

        return newLocked;
      });
    };

    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [gl.domElement, onLockChange]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders="hull"
      lockRotations
    >
      <Gltf src={modelUrl} scale={1} />

      {/* 配置位置のビジュアルフィードバック（ドラッグ中のみ表示） */}
      {!isLocked && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.15, 32]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.7} />
        </mesh>
      )}
    </RigidBody>
  );
}
