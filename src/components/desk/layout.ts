import { Euler, Vector3 } from "three";

// Units are meters. Everything that the camera needs to know about (where an
// object sits, which way it faces, how big it is) lives here, so the objects
// and the camera views can't drift apart.

export type Vec3 = [number, number, number];

// Measured from public/models/desk.glb.
export const DESK = { width: 1.4, depth: 0.6, height: 0.75 }; // MITTZON 55"
const TOP = DESK.height; // y of the desk surface

// The den, from the apartment floor plan (7'5" x 7'8"). Sitting at the desk
// you face the west wall: the bathroom wall is on your left, the north
// exterior wall is on your right, and the sliding door is behind you.
// Scene axes: +x = your right, -z = straight ahead, y = up.
const ft = (feet: number, inches = 0) => (feet * 12 + inches) * 0.0254;
export const ROOM = (() => {
  const width = ft(7, 5); // bathroom wall to north wall
  const depth = ft(7, 8); // desk wall to sliding door
  const height = ft(9); // TODO: measure the ceiling; 9' is a guess
  const left = -DESK.width / 2 - 0.02; // desk sits nearly against the bathroom wall
  const back = -DESK.depth / 2 - 0.02; // and against the wall it faces
  return {
    width,
    depth,
    height,
    left,
    right: left + width,
    back,
    front: back + depth,
  };
})();

// The sliding door behind the chair, at the bathroom end of that wall. x is
// the span of the opening; the door slides open toward the north wall.
const doorwayLeft = ROOM.left + 0.15;
export const DOORWAY = {
  left: doorwayLeft,
  right: doorwayLeft + 0.95,
  height: 2.04,
};

// The unfinished space past the sliding door.
export const CONSTRUCTION = {
  pile: [-0.5, 0, ROOM.front + 1.6] as [number, number, number],
  left: ROOM.left - 1.3,
  right: ROOM.right + 0.4,
  far: ROOM.front + 2.6,
};

export const SCREEN = { width: 0.6, height: 0.34, bezel: 0.012, depth: 0.025 };

export const layout = {
  monitor: { position: [0, TOP, -0.16] as Vec3, screenY: 0.33 },
  paper: {
    position: [-0.42, TOP + 0.0006, 0.12] as Vec3,
    rotationY: 0.12,
    size: [0.216, 0.279] as [number, number], // US letter
  },
  photo: {
    position: [0.44, TOP, -0.1] as Vec3,
    rotation: new Euler(-0.17, -0.45, 0, "YXZ"),
    size: [0.14, 0.19] as [number, number],
  },
  lamp: { position: [-0.54, TOP, -0.17] as Vec3 },
  plant: { position: [0.6, TOP, -0.2] as Vec3 },
  keyboard: { position: [0, TOP, 0.08] as Vec3 },
  mouse: { position: [0.32, TOP, 0.1] as Vec3 },
  mug: { position: [0.52, TOP, 0.12] as Vec3 },
  // In the gap between the desk and the north wall.
  dogBed: {
    position: [(DESK.width / 2 + ROOM.right) / 2, 0, ROOM.back + 0.36] as Vec3,
    radius: Math.min(0.3, (ROOM.right - DESK.width / 2) / 2 - 0.02),
  },
};

export type ViewId = "seated" | "monitor" | "resume" | "dog" | "construction";

export type FocusView = {
  center: Vector3;
  normal: Vector3; // direction the camera backs away along
  size: [number, number]; // what has to fit on screen
};

export const seatedView = {
  position: new Vector3(0, 1.2, 0.78),
  target: new Vector3(0, 0.93, -0.2),
};

export const focusViews: Record<Exclude<ViewId, "seated">, FocusView> = {
  construction: {
    center: new Vector3(CONSTRUCTION.pile[0], 0.45, CONSTRUCTION.pile[2]),
    // From the doorway, looking in and slightly down. Angled so the camera
    // lands in the opening rather than inside the wall beside it.
    normal: new Vector3(0.25, 0.45, -1).normalize(),
    size: [2.2, 1.25],
  },
  monitor: {
    center: new Vector3(
      layout.monitor.position[0],
      layout.monitor.position[1] + layout.monitor.screenY,
      layout.monitor.position[2],
    ),
    normal: new Vector3(0, 0, 1),
    size: [SCREEN.width + 0.04, SCREEN.height + 0.04],
  },
  resume: {
    center: new Vector3(...layout.paper.position),
    // Almost straight down, tipped toward the chair so the page reads upright.
    normal: new Vector3(0, 1, 0.15).normalize(),
    size: [layout.paper.size[0] * 1.1, layout.paper.size[1] * 1.15],
  },
  dog: {
    center: new Vector3(
      layout.dogBed.position[0],
      0.12,
      layout.dogBed.position[2],
    ),
    // From above and to the left, as if you leaned over from the chair.
    normal: new Vector3(-0.6, 1, 0.6).normalize(),
    size: [layout.dogBed.radius * 2.6, layout.dogBed.radius * 2.2],
  },
};
