"use client";

import { Html } from "@react-three/drei";
import { useEffect, useState, type ComponentProps } from "react";

// drei's <Html> drops its content if it mounts in the same pass as the
// Canvas's event layer: its overlay target changes underneath it and the first
// React root it created is unmounted. Mounting a frame later avoids that.
export function DeferredHtml(props: ComponentProps<typeof Html>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted ? <Html {...props} /> : null;
}
