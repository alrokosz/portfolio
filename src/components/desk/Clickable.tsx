"use client";

import { Html, useCursor } from "@react-three/drei";
import { useState } from "react";
import type { Vec3 } from "./layout";

// Wraps an object on the desk: shows a pointer and a label on hover and calls
// onSelect on click. Disabled while the camera is already focused on it.
export function Clickable({
  label,
  labelPosition,
  enabled,
  onSelect,
  children,
}: {
  label: string;
  labelPosition: Vec3;
  enabled: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && enabled);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        // A drag to look around isn't a click.
        if (enabled && e.delta < 6) onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {children}
      {hovered && enabled && (
        <Html
          center
          position={labelPosition}
          zIndexRange={[10, 0]}
          className="pointer-events-none"
        >
          <span className="whitespace-nowrap rounded-full bg-black/75 px-3 py-1 text-xs text-white">
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
