"use client";

import { DeferredHtml } from "./DeferredHtml";
import { useState } from "react";
import { site } from "@/content/site";
import { layout } from "./layout";

// A framed photo of the dog standing on the desk.
const PHOTO_PX = { width: 240, height: 336 };

export function DogPhoto() {
  const [w, h] = layout.photo.size;
  const inner = [w - 0.02, h - 0.02] as const;
  const distanceFactor = (inner[0] / PHOTO_PX.width) * 400;

  return (
    <group position={layout.photo.position} rotation={layout.photo.rotation}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, 0.015]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.6} />
      </mesh>
      {/* kickstand */}
      <mesh position={[0, h / 2 - 0.02, -0.035]} rotation-x={-0.35}>
        <boxGeometry args={[0.03, h * 0.85, 0.005]} />
        <meshStandardMaterial color="#3d2b1f" />
      </mesh>
      <DeferredHtml
        transform
        position={[0, h / 2, 0.008]}
        distanceFactor={distanceFactor}
        zIndexRange={[10, 0]}
        pointerEvents="none"
      >
        <Photo />
      </DeferredHtml>
    </group>
  );
}

function Photo() {
  const [missing, setMissing] = useState(false);
  const style = { width: PHOTO_PX.width, height: PHOTO_PX.height };

  if (missing) {
    return (
      <div
        style={style}
        className="flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#f3e3c8] to-[#d9b98c] text-center font-sans text-[#5a4330]"
      >
        <span className="text-6xl">🐕</span>
        <span className="px-6 text-sm">
          Add a photo at public{site.dog.photo}
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={site.dog.photo}
      alt={site.dog.name}
      style={style}
      className="object-cover"
      onError={() => setMissing(true)}
    />
  );
}
