"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { Euler, MathUtils, PerspectiveCamera, Vector3 } from "three";
import { Clickable } from "./Clickable";
import {
  CautionTape,
  ConstructionPile,
  ConstructionShell,
} from "./Construction";
import { DogBed } from "./DogBed";
import { DogPhoto } from "./DogPhoto";
import {
  focusViews,
  layout,
  CONSTRUCTION,
  ROOM,
  seatedView,
  SCREEN,
  type ViewId,
} from "./layout";
import { Desk } from "./Desk";
import { Monitor } from "./Monitor";
import { DeskProps, Office } from "./Office";
import { ResumePaper } from "./ResumePaper";
import { site } from "@/content/site";

export function Scene({
  view,
  onView,
}: {
  view: ViewId;
  onView: (view: ViewId) => void;
}) {
  const paperLabel: [number, number, number] = [
    layout.paper.position[0],
    layout.paper.position[1] + 0.06,
    layout.paper.position[2],
  ];
  const monitorLabel: [number, number, number] = [
    0,
    layout.monitor.position[1] +
      layout.monitor.screenY +
      SCREEN.height / 2 +
      0.05,
    layout.monitor.position[2],
  ];
  const bedLabel: [number, number, number] = [
    layout.dogBed.position[0],
    0.45,
    layout.dogBed.position[2],
  ];
  const photoLabel: [number, number, number] = [
    layout.photo.position[0],
    layout.photo.position[1] + layout.photo.size[1] + 0.04,
    layout.photo.position[2],
  ];

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        fov: 50,
        near: 0.01,
        far: 30,
        position: seatedView.position.toArray(),
      }}
      style={{ touchAction: "none" }}
      onPointerMissed={() => onView("seated")}
    >
      <color attach="background" args={["#1a1612"]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#fff4e6", "#6b5040", 0.45]} />
      {/* The den has no window, so the overhead light does the work. This
          directional light stands in for it so things cast shadows. */}
      <directionalLight
        position={[(ROOM.left + ROOM.right) / 2, ROOM.height, ROOM.front - 0.6]}
        intensity={0.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0005}
      />

      <Office onBackground={() => onView("seated")} />
      <ConstructionShell onBackground={() => onView("seated")} />
      {/* stepped past the tape for the close-up */}
      {view !== "construction" && <CautionTape />}
      <Suspense fallback={null}>
        <Desk />
      </Suspense>
      <DeskProps />

      <Clickable
        label="Projects"
        labelPosition={monitorLabel}
        enabled={view !== "monitor"}
        onSelect={() => onView("monitor")}
      >
        <Monitor interactive={view === "monitor"} />
      </Clickable>

      <Clickable
        label="Resume"
        labelPosition={paperLabel}
        enabled={view !== "resume"}
        onSelect={() => onView("resume")}
      >
        <ResumePaper interactive={view === "resume"} />
      </Clickable>

      <Clickable
        label={`Meet ${site.dog.name}`}
        labelPosition={bedLabel}
        enabled={view !== "dog"}
        onSelect={() => onView("dog")}
      >
        <DogBed />
      </Clickable>

      <Clickable
        label={`Meet ${site.dog.name}`}
        labelPosition={photoLabel}
        enabled={view !== "dog"}
        onSelect={() => onView("dog")}
      >
        <DogPhoto />
      </Clickable>

      <Clickable
        label="Under construction"
        labelPosition={[CONSTRUCTION.pile[0], 1.2, CONSTRUCTION.pile[2]]}
        enabled={view !== "construction"}
        onSelect={() => onView("construction")}
      >
        <ConstructionPile />
      </Clickable>

      <CameraRig view={view} />
    </Canvas>
  );
}

// Glides the camera between the seated view and close-ups. While seated you
// can drag to turn your head all the way around; pitch is limited so you
// can't look straight up or down.
const PITCH_LIMITS = [-0.75, 0.35];

function CameraRig({ view }: { view: ViewId }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const lookAt = useRef(seatedView.target.clone());
  const goalPos = useRef(new Vector3());
  const goalLook = useRef(new Vector3());
  const head = useRef({ yaw: 0, pitch: 0 });
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const el = gl.domElement;
    let last: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!last || viewRef.current !== "seated") return;
      // Drag the room like a photo sphere: drag right, look left.
      const h = head.current;
      h.yaw += (e.clientX - last.x) * 0.004;
      h.pitch = MathUtils.clamp(
        h.pitch + (e.clientY - last.y) * 0.004,
        PITCH_LIMITS[0],
        PITCH_LIMITS[1],
      );
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      last = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (view === "seated") {
      const { yaw, pitch } = head.current;
      const dir = new Vector3(0, 0, -1).applyEuler(
        new Euler(seatedPitch + pitch, yaw, 0, "YXZ"),
      );
      goalPos.current.copy(seatedView.position);
      goalLook.current.copy(seatedView.position).add(dir);
    } else {
      const f = focusViews[view];
      const distance = fitDistance(camera, f.size[0], f.size[1]);
      goalPos.current.copy(f.normal).multiplyScalar(distance).add(f.center);
      goalLook.current.copy(f.center);
    }

    const t = 1 - Math.exp(-4 * delta);
    camera.position.lerp(goalPos.current, t);
    lookAt.current.lerp(goalLook.current, t);
    camera.lookAt(lookAt.current);
  });

  return null;
}

// The seated view's built-in downward tilt, toward the desk.
const seatedPitch = (() => {
  const d = seatedView.target.clone().sub(seatedView.position);
  return Math.atan2(d.y, Math.hypot(d.x, d.z));
})();

// How far back the camera needs to be for a w x h rectangle to fill the view.
function fitDistance(camera: PerspectiveCamera, w: number, h: number) {
  const margin = 1.08;
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  return Math.max(
    (h * margin) / 2 / Math.tan(vFov / 2),
    (w * margin) / 2 / Math.tan(hFov / 2),
  );
}
