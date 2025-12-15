import { SplatMesh } from "@sparkjsdev/spark";
import { useMemo } from "react";

export function Room() {
  const splatURL =
    "https://pub-9aac194b4eba425aa8cc73a3d9afd14b.r2.dev/static/room.spz";
  const splat = useMemo(() => new SplatMesh({ url: splatURL }), []);

  return (
    <primitive
      object={splat}
      scale={10}
      position={[0, 0, 0]}
      quaternion={[1, 0, 0, 0]}
    />
  );
}
