import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/3d-sample")({
  component: RouteComponent,
});

// 3Dサンプル用のページ
function RouteComponent() {
  return (
    <div className="w-full h-svh flex flex-col items-center justify-center">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <mesh>
          <boxGeometry />
          <meshLambertMaterial color="red" />
        </mesh>

        <OrbitControls />
      </Canvas>
    </div>
  );
}
