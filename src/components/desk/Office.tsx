"use client";

import { Suspense, useMemo } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace } from "three";
import { Model } from "./Model";
import { DOORWAY, layout, ROOM } from "./layout";

// The room and the small props on the desk. All placeholders built from
// primitives; any of them can be swapped for a .glb later.

// TODO: swap in your real paint and floor colors.
const WALL = "#ece8e1";
const TRIM = "#f7f6f2";
const FLOOR = "#9a7a5c";

export function Office({ onBackground }: { onBackground: () => void }) {
  const { width, depth, height, left, right, back, front } = ROOM;
  const cx = (left + right) / 2;
  const cz = (back + front) / 2;

  return (
    // Walls and floor catch clicks so objects behind them can't be clicked
    // through; clicking them returns to the desk.
    <group
      onClick={(e) => {
        e.stopPropagation();
        onBackground();
      }}
      onPointerOver={(e) => e.stopPropagation()}
    >
      {/* floor and ceiling */}
      <mesh position={[cx, 0, cz]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={FLOOR} roughness={0.85} />
      </mesh>
      <mesh position={[cx, height, cz]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>

      {/* the wall the desk faces */}
      <Wall position={[cx, 0, back]} rotationY={0} length={width} />
      {/* bathroom wall, on your left */}
      <Wall position={[left, 0, cz]} rotationY={Math.PI / 2} length={depth} />
      {/* north exterior wall, on your right */}
      <Wall position={[right, 0, cz]} rotationY={-Math.PI / 2} length={depth} />
      {/* behind you: the wall with the sliding door, standing open */}
      <FrontWall />
      <SlidingDoor />

      {/* ceiling light */}
      <mesh position={[cx, height - 0.03, cz]}>
        <cylinderGeometry args={[0.18, 0.2, 0.06, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fff3e0"
          emissiveIntensity={1.5}
        />
      </mesh>
      <pointLight
        position={[cx, height - 0.15, cz]}
        intensity={2.2}
        distance={6}
        decay={1.5}
        color="#fff1dc"
      />
    </group>
  );
}

// The wall behind the chair, with the doorway cut out of it.
function FrontWall() {
  const { left, right, height, front } = ROOM;
  const segments = [
    { x0: left, x1: DOORWAY.left, y0: 0, y1: height, base: true },
    { x0: DOORWAY.right, x1: right, y0: 0, y1: height, base: true },
    {
      x0: DOORWAY.left,
      x1: DOORWAY.right,
      y0: DOORWAY.height,
      y1: height,
      base: false,
    },
  ];
  const casing = 0.07;
  return (
    <group>
      {segments.map(({ x0, x1, y0, y1, base }) => (
        <group key={x0}>
          <mesh
            position={[(x0 + x1) / 2, (y0 + y1) / 2, front]}
            rotation-y={Math.PI}
            receiveShadow
          >
            <planeGeometry args={[x1 - x0, y1 - y0]} />
            <meshStandardMaterial
              color={WALL}
              roughness={0.95}
              side={DoubleSide}
            />
          </mesh>
          {base && (
            <mesh position={[(x0 + x1) / 2, 0.05, front - 0.006]}>
              <boxGeometry args={[x1 - x0, 0.1, 0.012]} />
              <meshStandardMaterial color={TRIM} />
            </mesh>
          )}
        </group>
      ))}
      {/* door casing */}
      {[DOORWAY.left - casing / 2, DOORWAY.right + casing / 2].map((x) => (
        <mesh key={x} position={[x, DOORWAY.height / 2, front - 0.008]}>
          <boxGeometry args={[casing, DOORWAY.height, 0.016]} />
          <meshStandardMaterial color={TRIM} />
        </mesh>
      ))}
      <mesh
        position={[
          (DOORWAY.left + DOORWAY.right) / 2,
          DOORWAY.height + casing / 2,
          front - 0.008,
        ]}
      >
        <boxGeometry
          args={[DOORWAY.right - DOORWAY.left + casing * 2, casing, 0.016]}
        />
        <meshStandardMaterial color={TRIM} />
      </mesh>
    </group>
  );
}

// A barn-style sliding door on a track, pushed open toward the north wall.
function SlidingDoor() {
  const doorW = DOORWAY.right - DOORWAY.left + 0.1;
  const doorH = DOORWAY.height + 0.06;
  const z = ROOM.front - 0.04;
  const x = DOORWAY.right + doorW / 2 - 0.04; // slid open
  const trackY = doorH + 0.06;
  const grain = usePineGrain();
  return (
    <group>
      <mesh position={[x, doorH / 2 + 0.01, z]} castShadow receiveShadow>
        <boxGeometry args={[doorW, doorH, 0.035]} />
        <meshStandardMaterial map={grain} roughness={0.7} />
      </mesh>
      {/* recessed panels */}
      {[0.55, 1.5].map((y) => (
        <mesh key={y} position={[x, y, z - 0.018]}>
          <boxGeometry args={[doorW - 0.2, 0.75, 0.004]} />
          <meshStandardMaterial map={grain} color="#f7efe3" roughness={0.7} />
        </mesh>
      ))}
      {/* handle */}
      <mesh position={[x - doorW / 2 + 0.08, 1.0, z - 0.03]}>
        <boxGeometry args={[0.02, 0.3, 0.02]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* track */}
      <mesh
        position={[
          (DOORWAY.left - 0.05 + x + doorW / 2) / 2,
          trackY,
          z - 0.005,
        ]}
      >
        <boxGeometry
          args={[x + doorW / 2 - (DOORWAY.left - 0.05), 0.03, 0.015]}
        />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Light pine: pale, creamy wood with vertical grain lines, drawn once.
function usePineGrain() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f0dbb4";
    ctx.fillRect(0, 0, 256, 512);
    // Seeded so the grain looks the same on every visit.
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      const x = rand() * 256;
      ctx.strokeStyle = `rgba(190, 140, 80, ${0.06 + rand() * 0.12})`;
      ctx.lineWidth = 0.5 + rand() * 2.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= 512; y += 32) {
        ctx.lineTo(x + Math.sin(y / 90 + i) * (2 + rand() * 3), y);
      }
      ctx.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
}

// A wall plane with a baseboard, facing into the room (+z before rotation).
function Wall({
  position,
  rotationY,
  length,
}: {
  position: [number, number, number];
  rotationY: number;
  length: number;
}) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, ROOM.height / 2, 0]} receiveShadow>
        <planeGeometry args={[length, ROOM.height]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.05, 0.006]} receiveShadow>
        <boxGeometry args={[length, 0.1, 0.012]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>
    </group>
  );
}

export function DeskProps() {
  return (
    <group>
      <Keyboard />
      <Mouse />
      <Mug />
      <Lamp />
      <Plant />
    </group>
  );
}

function Keyboard() {
  return (
    <group position={layout.keyboard.position}>
      <mesh position={[0, 0.008, 0]} castShadow>
        <boxGeometry args={[0.44, 0.016, 0.14]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>
      <mesh position={[0, 0.0165, 0]}>
        <boxGeometry args={[0.41, 0.002, 0.115]} />
        <meshStandardMaterial color="#f4f4f4" />
      </mesh>
    </group>
  );
}

function Mouse() {
  return (
    <mesh
      position={[
        layout.mouse.position[0],
        layout.mouse.position[1] + 0.012,
        layout.mouse.position[2],
      ]}
      scale={[0.032, 0.014, 0.055]}
      castShadow
    >
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color="#e8e8e8" />
    </mesh>
  );
}

function Mug() {
  return (
    <group position={layout.mug.position}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.037, 0.1, 32]} />
        <meshStandardMaterial color="#c2410c" />
      </mesh>
      <mesh position={[0.045, 0.05, 0]} rotation-z={Math.PI / 2}>
        <torusGeometry args={[0.022, 0.007, 12, 24]} />
        <meshStandardMaterial color="#c2410c" />
      </mesh>
    </group>
  );
}

function Lamp() {
  return (
    <group position={layout.lamp.position} rotation-y={0.4}>
      <Suspense fallback={null}>
        <Model url="/models/desk-lamp.glb" glow="#ffd9a8" />
      </Suspense>
      {/* the bulb, under the shade */}
      <pointLight
        position={[0, 0.17, 0.02]}
        intensity={0.6}
        distance={1.4}
        decay={1.5}
        color="#ffbe7a"
      />
    </group>
  );
}

function Plant() {
  return (
    <group position={layout.plant.position}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.045, 0.1, 24]} />
        <meshStandardMaterial color="#d8cbb8" />
      </mesh>
      {[
        [0, 0.16, 0, 0.07],
        [0.04, 0.2, 0.02, 0.05],
        [-0.04, 0.19, -0.01, 0.055],
        [0.01, 0.24, -0.02, 0.045],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color="#4f7a4a" flatShading />
        </mesh>
      ))}
    </group>
  );
}
