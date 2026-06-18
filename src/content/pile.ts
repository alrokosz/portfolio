// The pile of 3D models in the "under construction" area behind the sliding
// door. To add one: put the .glb in public/models/pile/ and add a line here.
//
// - size: the model's longest side in meters. Models come in all sorts of
//   units, so each one is scaled to this.
// - position: [x, y, z] in meters from the middle of the pile; y is where its
//   bottom sits (0 = floor). +x is to the right as you look in from the door,
//   +z is further away from the door.
// - rotation: [x, y, z] in radians (Math.PI / 2 is a quarter turn).
//
// If a model is huge (over ~2 MB), shrink it first, e.g.:
//   npx @gltf-transform/cli optimize in.glb out.glb --compress draco \
//     --texture-compress webp --texture-size 1024

export type PileItem = {
  url: string;
  size: number;
  position: [number, number, number];
  rotation?: [number, number, number];
};

export const pile: PileItem[] = [
  {
    // IKEA ALEX drawer unit, tipped over on its side
    url: "/models/pile/alex-drawers.glb",
    size: 0.7,
    position: [0, 0, 0],
    rotation: [0, -0.2, Math.PI / 2],
  },
  {
    url: "/models/pile/dog-buck.glb",
    size: 0.95,
    position: [-0.62, 0, 0.15],
    rotation: [0, -4.0, 0],
  },
  {
    url: "/models/pile/dog-terrier.glb",
    size: 0.5,
    position: [0.1, 0.36, 0],
    rotation: [0, 2.3, 0],
  },
  {
    url: "/models/pile/mouse-mx-vertical.glb",
    size: 0.12,
    position: [-0.24, 0.36, 0.04],
    rotation: [0, 0.5, 0],
  },
  {
    url: "/models/pile/bear-with-fish.glb",
    size: 0.75,
    position: [-0.4, 0, -0.55],
    rotation: [0, Math.PI + 0.6, 0],
  },
  {
    // Steelcase Leap chair
    url: "/models/pile/blue-leap-v2.glb",
    size: 1.1,
    position: [0.7, 0, 0.8],
    rotation: [0, Math.PI + 0.4, 0],
  },
];
