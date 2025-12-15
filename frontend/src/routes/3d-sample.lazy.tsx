import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Room } from "@/features/room/room";

export const Route = createLazyFileRoute("/3d-sample")({
  component: RouteComponent,
});

// 3Dサンプル用のページ
function RouteComponent() {
  return (
    <div className="w-full h-svh flex flex-col items-center justify-center">
      <Canvas>
        <ambientLight intensity={1} />
        <Environment preset="apartment" />
        <Room />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
