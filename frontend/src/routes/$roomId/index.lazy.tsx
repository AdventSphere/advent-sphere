import { CameraControls, Environment, Gltf } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { createLazyFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Suspense, useState } from "react";
import InventoryIcon from "@/components/icons/inventory";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { R2_BASE_URL } from "@/constants/r2-url";
import Calendar from "@/features/room/calendar";
import { useCalendarFocus } from "@/features/room/hooks/useCalendarFocus";
import InventoryDialog from "@/features/room/inventoryDialog";

export const Route = createLazyFileRoute("/$roomId/")({
  component: RouteComponent,
});

const roomUrl = `${R2_BASE_URL}/static/room.glb`;
const tableUrl = `${R2_BASE_URL}/static/table%20(1).glb`;

// フォーカスモード時にカレンダーを照らすライト
function FocusLights({ isFocusMode }: { isFocusMode: boolean }) {
  return isFocusMode ? (
    <directionalLight
      position={[2, 1.5, -0.5]}
      intensity={3.6}
      target-position={[0, 0, 0]}
    />
  ) : null;
}

// カレンダーの配置
const CALENDAR_POSITION: [number, number, number] = [0, 1, 0];

function RouteComponent() {
  const { roomId } = Route.useParams();
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const {
    isFocusMode,
    cameraControlsRef,
    calendarRef,
    handleFocusCalendar,
    handleExitFocusMode,
  } = useCalendarFocus();

  return (
    <div className="w-full h-svh flex">
      <div className="w-full p-3 md:p-6 lg:p-8 grow h-full grid grid-cols-2">
        {!isFocusMode && (
          <Button
            onClick={() => setIsInventoryDialogOpen((prev) => !prev)}
            className="relative z-30 self-end size-20 md:size-22 lg:size-24 border-4 border-primary-foreground rounded-3xl font-bold text-sm md:text-base shadow-xl hover:[&_span]:animate-bounce active:scale-95"
          >
            <span className="absolute -top-2.5 -right-2.5 p-1.5 md:p-2 bg-primary-foreground rounded-full">
              <InventoryIcon className="size-4 md:size-5 lg:size-6 text-primary" />
            </span>
            持ち物
          </Button>
        )}
        <InventoryDialog
          roomId={roomId}
          open={isInventoryDialogOpen}
          onOpenChange={setIsInventoryDialogOpen}
        />
        {isFocusMode && (
          <Button
            onClick={handleExitFocusMode}
            className="justify-self-end col-span-2 w-fit z-40"
            variant="outline"
          >
            <X className="size-4" />
            閉じる
          </Button>
        )}
      </div>

      {/* 3Dオブジェクト */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<Loading text="部屋を読み込み中..." />}>
          <Canvas camera={{ position: [0, 0, 2.5] }}>
            <ambientLight intensity={isFocusMode ? 0.15 : 0.4} />
            <Environment
              preset="apartment"
              environmentIntensity={isFocusMode ? 0.2 : 1}
            />

            {/* フォーカスモード時にカレンダーを照らすライト */}
            <FocusLights isFocusMode={isFocusMode} />

            <Physics>
              <group position={[0, 0, 0]}>
                <RigidBody type="fixed" friction={5}>
                  <Gltf src={roomUrl} position={[0, -1, 0]} />
                </RigidBody>

                <group position={[0, 0, 1]}>
                  <RigidBody lockRotations>
                    <Gltf src={tableUrl} scale={6} position={[0, 0, 0]} />
                  </RigidBody>
                  <RigidBody lockRotations>
                    <Calendar
                      groupRef={calendarRef}
                      position={CALENDAR_POSITION}
                      rotation={[0, 0, 0]}
                      isFocusMode={isFocusMode}
                      onCalendarClick={handleFocusCalendar}
                    />
                  </RigidBody>
                </group>
              </group>
            </Physics>

            <CameraControls
              ref={cameraControlsRef}
              enabled={!isFocusMode}
              minDistance={0}
              dollySpeed={0.3}
              smoothTime={0.25}
              makeDefault
            />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}
