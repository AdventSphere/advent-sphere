import { CameraControls, Environment, Gltf } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import * as THREE from "three";
import Loading from "@/components/Loading";
import { R2_BASE_URL } from "@/constants/r2-url";
import Calendar from "@/features/room/calendar";
import { Room } from "@/features/room/room";

export const Route = createLazyFileRoute("/3d-sample")({
  component: RouteComponent,
});

const tableUrl = `${R2_BASE_URL}/static/table%20(1).glb`;
const wallUrl = `${R2_BASE_URL}/static/Wall_001.glb`;
const floorUrl = `${R2_BASE_URL}/static/Floor_001.glb`;
const giftBoxUrl = `${R2_BASE_URL}/static/gift_box.glb`;

const snowdomeDomeUrl = `${R2_BASE_URL}/static/snowdome_dome.glb`;
const snowdomePedestalUrl = `${R2_BASE_URL}/static/snowdome_pedestal.glb`;
const snowdomeSnowmanUrl = `${R2_BASE_URL}/static/snowdome_snowman.glb`;
const snowdomeTreeUrl = `${R2_BASE_URL}/static/snowdome_tree.glb`;

function RouteComponent() {
  return (
    <div className="w-full h-svh flex">
      {/* 3Dオブジェクト */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<Loading text="部屋を読み込み中..." />}>
          <Canvas>
            <ambientLight intensity={0.4} />
            <Environment preset="apartment" />

            <Physics>
              <group position={[0, 0, 0]}>
                <Room />

                <RigidBody lockRotations>
                  <group position={[0, 0, 0]} scale={0.2}>
                    <Gltf src={snowdomeDomeUrl} position={[0, 0, 0]} />
                    <Gltf src={snowdomePedestalUrl} position={[0, 0, 0]} />
                    <Gltf src={snowdomeSnowmanUrl} position={[0, 0, 0]} />
                    <Gltf src={snowdomeTreeUrl} position={[0, 0, 0]} />
                  </group>
                </RigidBody>
                {/* <RigidBody>
                  <Gltf src={wallUrl} position={[0, 0.1, 0]} />
                </RigidBody> */}
                <RigidBody type="fixed">
                  <Gltf src={floorUrl} position={[0, -1, 0]} />
                </RigidBody>
                {/* <RigidBody lockRotations>
                  <Gltf src={tableUrl} scale={10} position={[1, 0, 0]} />
                </RigidBody>
                <RigidBody lockRotations>
                  <Gltf src={giftBoxUrl} scale={1} position={[-1, 0, 0]} />
                </RigidBody> */}

                <RigidBody type="fixed" friction={5}>
                  <mesh
                    position={[0, -5, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                    receiveShadow
                  >
                    <planeGeometry args={[10, 10]} />
                    <meshStandardMaterial
                      color="#ddd"
                      side={THREE.DoubleSide}
                    />
                  </mesh>
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
