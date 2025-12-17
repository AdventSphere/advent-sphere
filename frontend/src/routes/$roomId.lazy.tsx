import { CameraControls, Environment, Gltf } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import InventoryIcon from "@/components/icons/inventory";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { R2_BASE_URL } from "@/constants/r2-url";
import Calendar from "@/features/room/calendar";
import InventoryDialog from "@/features/room/inventoryDialog";

export const Route = createLazyFileRoute("/$roomId")({
  component: RouteComponent,
});

const roomUrl = `${R2_BASE_URL}/static/wall.glb`;
const tableUrl = `${R2_BASE_URL}/static/table%20(1).glb`;

function RouteComponent() {
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);

  return (
    <div className="w-full h-svh flex">
      <div className="w-full p-3 md:p-6 lg:p-8 grow h-full grid grid-cols-2">
        <Button
          onClick={() => setIsInventoryDialogOpen((prev) => !prev)}
          className="relative z-30 self-end size-20 md:size-22 lg:size-24 border-4 border-primary-foreground rounded-3xl font-bold text-sm md:text-base shadow-xl hover:[&_span]:animate-bounce active:scale-95"
        >
          <span className="absolute -top-2.5 -right-2.5 p-1.5 md:p-2 bg-primary-foreground rounded-full">
            <InventoryIcon className="size-4 md:size-5 lg:size-6 text-primary" />
          </span>
          持ち物
        </Button>
        <InventoryDialog
          open={isInventoryDialogOpen}
          onOpenChange={setIsInventoryDialogOpen}
        />
      </div>

      {/* 3Dオブジェクト */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<Loading text="部屋を読み込み中..." />}>
          <Canvas>
            <ambientLight intensity={0.4} />
            <Environment preset="apartment" />

            <Physics>
              <group position={[0, 0, 0]}>
                {/* <Room /> */}

                <RigidBody type="fixed">
                  <Gltf src={roomUrl} position={[0, -1, 0]} />
                </RigidBody>

                <RigidBody lockRotations>
                  <Gltf src={tableUrl} scale={6} position={[1, 0, 2]} />
                </RigidBody>
                <RigidBody lockRotations>
                  <Calendar position={[0, 0, 0]} rotation={[0, 0, 0]} />
                </RigidBody>
              </group>
            </Physics>

            <CameraControls
              minDistance={0}
              dollySpeed={0.3}
              smoothTime={0.1}
              makeDefault
            />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}
