"use client";

import { useGLTF } from "@react-three/drei";
import { Model } from "./Model";

// IKEA MITTZON 55" (140 x 60 cm). Its origin is floor level, centered, which
// matches DESK in layout.ts.
const url = "/models/desk.glb";

export function Desk() {
  return <Model url={url} />;
}

useGLTF.preload(url, "/draco/");
