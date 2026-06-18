"use client";

import { RoundedBox } from "@react-three/drei";
import { DeferredHtml } from "./DeferredHtml";
import { SCREEN, layout } from "./layout";
import { ScreenUI, SCREEN_PX } from "./ScreenUI";

// A real DOM page is projected onto the screen with drei's <Html transform>,
// so the tabs are ordinary React and links work. 1 CSS px = distanceFactor/400
// meters, so this factor maps SCREEN_PX.width onto SCREEN.width.
const distanceFactor = (SCREEN.width / SCREEN_PX.width) * 400;

export function Monitor({ interactive }: { interactive: boolean }) {
  const { screenY } = layout.monitor;
  const outerW = SCREEN.width + SCREEN.bezel * 2;
  const outerH = SCREEN.height + SCREEN.bezel * 2;

  return (
    <group position={layout.monitor.position}>
      {/* base and neck */}
      <mesh position={[0, 0.006, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.012, 0.18]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, -0.04]} castShadow>
        <boxGeometry args={[0.05, 0.24, 0.02]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4} />
      </mesh>

      <group position={[0, screenY, 0]}>
        <RoundedBox
          args={[outerW, outerH, SCREEN.depth]}
          radius={0.008}
          smoothness={3}
          castShadow
        >
          <meshStandardMaterial color="#141414" roughness={0.5} />
        </RoundedBox>
        {/* dark panel behind the DOM, visible while it loads */}
        <mesh position={[0, 0, SCREEN.depth / 2 + 0.0005]}>
          <planeGeometry args={[SCREEN.width, SCREEN.height]} />
          <meshBasicMaterial color="#0b0b0c" />
        </mesh>
        <DeferredHtml
          transform
          position={[0, 0, SCREEN.depth / 2 + 0.001]}
          distanceFactor={distanceFactor}
          zIndexRange={[10, 0]}
          pointerEvents={interactive ? "auto" : "none"}
        >
          <ScreenUI />
        </DeferredHtml>
        {/* soft glow the screen casts on the desk */}
        <pointLight
          position={[0, 0, 0.25]}
          intensity={0.25}
          distance={1}
          color="#9fb7ff"
        />
      </group>
    </group>
  );
}
