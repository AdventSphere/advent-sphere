import { CameraControls, Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import InventoryIcon from "@/components/icons/inventory";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import Calendar from "@/features/room/calendar";
import { Room } from "@/features/room/room";

export const Route = createLazyFileRoute("/3d-sample")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full h-svh flex">
      <div className="w-full p-3 md:p-6 lg:p-8 grow h-full grid grid-cols-2">
        <Button className="relative z-30 self-end size-20 md:size-22 lg:size-24 border-4 border-primary-foreground rounded-3xl font-bold text-sm md:text-base shadow-xl hover:[&_span]:animate-bounce active:scale-95">
          <span className="absolute -top-2.5 -right-2.5 p-1.5 md:p-2 bg-primary-foreground rounded-full">
            <InventoryIcon className="size-4 md:size-5 lg:size-6 text-primary" />
          </span>
          持ち物
        </Button>
      </div>

      {/* 3Dオブジェクト */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<Loading text="部屋を読み込み中..." />}>
          <Canvas>
            <ambientLight intensity={0.4} />
            <Environment preset="apartment" />

            <group position={[0, 0, 0]}>
              <Room />
              <Calendar position={[0, 0, 0]} rotation={[0, 0, 0]} />
            </group>

            <CameraControls
              minDistance={0}
              maxDistance={30}
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
