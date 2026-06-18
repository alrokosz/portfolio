"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { layout } from "./layout";

// A round dog bed with a placeholder dog curled up in it. Swap <Dog /> for a
// real model when there is one.
export function DogBed() {
  const { position, radius } = layout.dogBed;
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius - 0.04, radius - 0.02, 0.06, 40]} />
        <meshStandardMaterial color="#b8a48c" roughness={1} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation-x={-Math.PI / 2} castShadow>
        <torusGeometry args={[radius - 0.05, 0.055, 16, 48]} />
        <meshStandardMaterial color="#8c7660" roughness={1} />
      </mesh>
      <Dog />
    </group>
  );
}

function Dog() {
  const tail = useRef<Group>(null);
  const body = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (tail.current) tail.current.rotation.y = Math.sin(t * 2) * 0.25;
    // slow breathing
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.6) * 0.03;
  });

  const fur = "#c9a27a";
  const dark = "#a5835f";
  return (
    <group position={[0, 0.1, 0]} rotation-y={-2.2}>
      <group ref={body}>
        <mesh position={[0, 0.06, 0]} scale={[0.22, 0.09, 0.12]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color={fur} />
        </mesh>
      </group>
      {/* head resting on front paws */}
      <mesh position={[0.2, 0.06, 0.06]} scale={[0.08, 0.065, 0.07]} castShadow>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial color={fur} />
      </mesh>
      <mesh position={[0.28, 0.045, 0.07]} scale={[0.04, 0.03, 0.035]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[0.18, 0.1, 0.06 + s * 0.045]}
          rotation-x={s * 0.5}
          scale={[0.03, 0.05, 0.015]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={dark} />
        </mesh>
      ))}
      <group ref={tail} position={[-0.2, 0.05, 0]}>
        <mesh
          position={[-0.02, 0, 0.08]}
          rotation-y={0.9}
          scale={[0.1, 0.025, 0.025]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={fur} />
        </mesh>
      </group>
    </group>
  );
}
