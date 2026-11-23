import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";

type Vec3 = [number, number, number];

// Places the camera from frame-driven values. ThreeCanvas re-renders the
// scene on every Remotion frame, so this stays in sync without useFrame().
export const CameraRig: React.FC<{
  position: Vec3;
  target: Vec3;
  fov?: number;
}> = ({ position, target, fov = 35 }) => {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    if ("fov" in camera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    invalidate();
  });

  return null;
};
