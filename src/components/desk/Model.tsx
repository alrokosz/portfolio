"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { Mesh, MeshStandardMaterial } from "three";

// Loads a .glb as-is (real-world meters, origin on the floor) with shadows on.
// Models may be Draco-compressed; the decoder is served from public/draco.
// `glow` makes the whole model emit light of that color (for lamps).
export function Model({ url, glow }: { url: string; glow?: string }) {
  const { scene } = useGLTF(url, "/draco/");
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = !glow;
      mesh.receiveShadow = true;
      if (glow) {
        const material = (mesh.material as MeshStandardMaterial).clone();
        material.emissive.set(glow);
        material.emissiveIntensity = 0.9;
        mesh.material = material;
      }
    });
    return clone;
  }, [scene, glow]);
  return <primitive object={model} />;
}
