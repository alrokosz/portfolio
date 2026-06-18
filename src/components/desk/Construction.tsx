"use client";

import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import {
  Box3,
  CanvasTexture,
  DoubleSide,
  Group,
  Object3D,
  SRGBColorSpace,
  Vector3,
  type Mesh,
} from "three";
import { pile, type PileItem } from "@/content/pile";
import { CONSTRUCTION, DOORWAY, ROOM } from "./layout";

// The unfinished space past the sliding door: bare drywall, exposed studs, a
// work light, and a pile of models waiting for a room of their own.

const CONCRETE = "#8f8b84";
const DRYWALL = "#bdb8ae";
const STUD = "#c9a878";

export function ConstructionShell({
  onBackground,
}: {
  onBackground: () => void;
}) {
  const { left, right, far } = CONSTRUCTION;
  const near = ROOM.front;
  const width = right - left;
  const depth = far - near;
  const cx = (left + right) / 2;
  const cz = (near + far) / 2;

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
      <mesh position={[cx, 0, cz]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={CONCRETE} roughness={1} />
      </mesh>
      <mesh position={[cx, ROOM.height, cz]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#6e6a64" />
      </mesh>
      {/* far wall, then the two sides */}
      <mesh
        position={[cx, ROOM.height / 2, far]}
        rotation-y={Math.PI}
        receiveShadow
      >
        <planeGeometry args={[width, ROOM.height]} />
        <meshStandardMaterial color={DRYWALL} roughness={1} />
      </mesh>
      <mesh
        position={[left, ROOM.height / 2, cz]}
        rotation-y={Math.PI / 2}
        receiveShadow
      >
        <planeGeometry args={[depth, ROOM.height]} />
        <meshStandardMaterial color={DRYWALL} roughness={1} />
      </mesh>
      <mesh
        position={[right, ROOM.height / 2, cz]}
        rotation-y={-Math.PI / 2}
        receiveShadow
      >
        <planeGeometry args={[depth, ROOM.height]} />
        <meshStandardMaterial color={DRYWALL} roughness={1} />
      </mesh>

      {/* exposed studs along the far wall */}
      {Array.from({ length: Math.floor(width / 0.41) }, (_, i) => (
        <mesh
          key={i}
          position={[left + 0.2 + i * 0.41, ROOM.height / 2, far - 0.05]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.04, ROOM.height, 0.09]} />
          <meshStandardMaterial color={STUD} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export function ConstructionPile() {
  const [px, , pz] = CONSTRUCTION.pile;
  return (
    <group>
      <group position={CONSTRUCTION.pile}>
        {pile.map((item) => (
          <Suspense key={item.url} fallback={null}>
            <PileModel item={item} />
          </Suspense>
        ))}
        <Boxes />
      </group>
      <Cone position={[px + 0.35, 0, ROOM.front + 0.4]} />
      <Cone position={[px - 0.5, 0, ROOM.front + 0.55]} />
      <Sign position={[px + 0.8, 0, pz - 0.55]} rotationY={0.15} />
      <WorkLight />
    </group>
  );
}

// Loads one model, scales its longest side to item.size, and sets it on the
// ground (or on whatever y it's given) centered on its position.
function PileModel({ item }: { item: PileItem }) {
  const { scene } = useGLTF(item.url, "/draco/");
  const object = useMemo(() => {
    const model = scene.clone(true);
    model.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    model.updateMatrixWorld(true);
    const dims = new Box3().setFromObject(model).getSize(new Vector3());
    model.scale.multiplyScalar(item.size / Math.max(dims.x, dims.y, dims.z));

    const turned = new Group();
    turned.add(model);
    turned.rotation.set(...(item.rotation ?? [0, 0, 0]));
    turned.updateMatrixWorld(true);
    const box = new Box3().setFromObject(turned);
    const center = box.getCenter(new Vector3());
    turned.position.set(-center.x, -box.min.y, -center.z);

    const holder = new Group();
    holder.add(turned);
    return holder;
  }, [scene, item]);

  return <primitive object={object} position={item.position} />;
}

function Boxes() {
  const boxes: {
    p: [number, number, number];
    s: [number, number, number];
    r: number;
  }[] = [
    { p: [0.62, 0.17, 0.25], s: [0.4, 0.34, 0.36], r: -0.2 },
    { p: [0.6, 0.47, 0.27], s: [0.3, 0.26, 0.3], r: 0.3 },
    { p: [-0.15, 0.14, 0.6], s: [0.36, 0.28, 0.3], r: -0.6 },
  ];
  return (
    <>
      {boxes.map(({ p, s, r }, i) => (
        <group key={i} position={p} rotation-y={r}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={s} />
            <meshStandardMaterial color="#b98d5c" roughness={0.9} />
          </mesh>
          {/* packing tape */}
          <mesh position={[0, s[1] / 2 + 0.001, 0]}>
            <boxGeometry args={[0.06, 0.002, s[2] + 0.004]} />
            <meshStandardMaterial color="#d8c39b" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Cone({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.03, 0.3]} />
        <meshStandardMaterial color="#e8590c" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <coneGeometry args={[0.11, 0.45, 32]} />
        <meshStandardMaterial color="#f76707" />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.062, 0.082, 0.08, 32, 1, true]} />
        <meshStandardMaterial color="#f8f9fa" side={DoubleSide} />
      </mesh>
    </group>
  );
}

function Sign({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  const texture = useCanvasTexture(600, 420, (ctx, w, h) => {
    ctx.fillStyle = "#f59f00";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 16;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.font = "bold 92px system-ui, sans-serif";
    ctx.fillText("UNDER", w / 2, 160);
    ctx.font = "bold 66px system-ui, sans-serif";
    ctx.fillText("CONSTRUCTION", w / 2, 245);
    ctx.font = "34px system-ui, sans-serif";
    ctx.fillText("More of the apartment soon", w / 2, 330);
  });

  // An A-frame sign, facing the door.
  return (
    <group position={position} rotation-y={Math.PI + rotationY}>
      {[-1, 1].map((side) => (
        <group key={side} rotation-x={side * 0.18} position={[0, 0, 0]}>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.62, 0.84, 0.02]} />
            <meshStandardMaterial color="#e9ecef" />
          </mesh>
          <mesh
            position={[0, 0.5, side * 0.011]}
            rotation-y={side > 0 ? 0 : Math.PI}
          >
            <planeGeometry args={[0.56, 0.39]} />
            <meshStandardMaterial map={texture} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// A clamp light on a stand, lighting the pile.
function WorkLight() {
  const [px, , pz] = CONSTRUCTION.pile;
  const target = useMemo(() => new Object3D(), []);
  const lightPos: [number, number, number] = [px - 0.85, 1.9, pz - 0.5];
  return (
    <group>
      <primitive object={target} position={[px, 0.3, pz]} />
      <spotLight
        position={lightPos}
        target={target}
        angle={0.75}
        penumbra={0.6}
        intensity={9}
        distance={6}
        decay={1.5}
        color="#ffe8c2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      {/* tripod */}
      <mesh position={[lightPos[0], 0.95, lightPos[2]]}>
        <cylinderGeometry args={[0.012, 0.012, 1.9, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {[0, 2.1, 4.2].map((a) => (
        <mesh
          key={a}
          position={[
            lightPos[0] + Math.cos(a) * 0.15,
            0.12,
            lightPos[2] + Math.sin(a) * 0.15,
          ]}
          rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]}
        >
          <cylinderGeometry args={[0.01, 0.01, 0.35, 6]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      <mesh position={lightPos} rotation={[0.9, -0.9, 0]}>
        <cylinderGeometry args={[0.1, 0.06, 0.12, 24, 1, true]} />
        <meshStandardMaterial color="#f59f00" side={DoubleSide} />
      </mesh>
      <mesh position={lightPos}>
        <sphereGeometry args={[0.04, 16, 12]} />
        <meshStandardMaterial
          color="#fff"
          emissive="#fff3d6"
          emissiveIntensity={3}
        />
      </mesh>
    </group>
  );
}

// Caution tape strung across the open doorway in an X.
export function CautionTape() {
  const texture = useCanvasTexture(1024, 64, (ctx, w, h) => {
    ctx.fillStyle = "#ffd43b";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, w, 6);
    ctx.fillRect(0, h - 6, w, 6);
    ctx.font = "bold 38px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    for (let x = 16; x < w; x += 256) ctx.fillText("CAUTION", x, h / 2 + 2);
  });

  const w = DOORWAY.right - DOORWAY.left;
  const rise = 0.9;
  const length = Math.hypot(w, rise) + 0.1;
  const angle = Math.atan2(rise, w);
  const center: [number, number, number] = [
    (DOORWAY.left + DOORWAY.right) / 2,
    1.05,
    ROOM.front + 0.03,
  ];

  return (
    // Faces back into the den, so the text reads right from the chair.
    <group position={center} rotation-y={Math.PI}>
      {[angle, -angle].map((a, i) => (
        <mesh key={a} rotation-z={a} position={[0, 0, i * 0.004]}>
          <planeGeometry args={[length, 0.07]} />
          <meshStandardMaterial map={texture} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function useCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  // Drawn once; the scene only renders in the browser.
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext("2d")!, width, height);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

pile.forEach((item) => useGLTF.preload(item.url, "/draco/"));
