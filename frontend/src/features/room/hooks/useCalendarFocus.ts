import type { CameraControls as CameraControlsType } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function useCalendarFocus() {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const cameraControlsRef = useRef<CameraControlsType>(null);
  const calendarRef = useRef<THREE.Group>(null);
  const savedCameraPositionRef = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);

  // カレンダーにフォーカス
  const handleFocusCalendar = useCallback(async () => {
    if (!cameraControlsRef.current || !calendarRef.current) return;

    // 現在のカメラ位置を保存
    savedCameraPositionRef.current = {
      position: cameraControlsRef.current.getPosition(new THREE.Vector3()),
      target: cameraControlsRef.current.getTarget(new THREE.Vector3()),
    };

    // カレンダーのバウンディングボックスを計算
    const box = new THREE.Box3().setFromObject(calendarRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 画面のアスペクト比を取得
    const aspect = window.innerWidth / window.innerHeight;

    // カレンダーの高さ・幅に基づいて必要な距離を計算
    // FOV 50度（デフォルト）を想定
    const fov = 50 * (Math.PI / 180);
    const calendarHeight = size.y;
    const calendarWidth = size.z;

    // 縦横それぞれで必要な距離を計算し、大きい方を採用
    const distanceForHeight = calendarHeight / (2 * Math.tan(fov / 2));
    const distanceForWidth = calendarWidth / (2 * Math.tan(fov / 2) * aspect);
    const distance = Math.max(distanceForHeight, distanceForWidth) * 0.9;

    // 先にフォーカスモードをONにして暗くする
    setIsFocusMode(true);

    // 回転角度を正規化して最短経路で移動させる
    cameraControlsRef.current.normalizeRotations();

    // カメラをカレンダーの正面に移動
    await cameraControlsRef.current.setLookAt(
      center.x + distance,
      center.y + 0.05,
      center.z - 0.05,
      center.x,
      center.y + 0.02,
      center.z - 0.05,
      true,
    );
  }, []);

  // フォーカスモード解除
  const handleExitFocusMode = useCallback(async () => {
    if (!cameraControlsRef.current || !savedCameraPositionRef.current) return;

    const { position, target } = savedCameraPositionRef.current;

    // 先にフォーカスモードをOFFにしてライトを戻す
    setIsFocusMode(false);

    await cameraControlsRef.current.setLookAt(
      position.x,
      position.y,
      position.z,
      target.x,
      target.y,
      target.z,
      true,
    );
  }, []);

  // Escキーでフォーカスモード解除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        handleExitFocusMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, handleExitFocusMode]);

  return {
    isFocusMode,
    cameraControlsRef,
    calendarRef,
    handleFocusCalendar,
    handleExitFocusMode,
  };
}
