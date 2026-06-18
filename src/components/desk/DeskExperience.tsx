"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import type { ViewId } from "./layout";

// WebGL only exists in the browser, so the scene skips server rendering.
const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center font-mono text-sm text-white/60">
      Pulling up a chair…
    </div>
  ),
});

const hints: Record<ViewId, string> = {
  seated:
    "Drag to look around (there's more behind you). Click the monitor, the paper, or the dog.",
  construction:
    "The rest of the apartment is under construction. These are the pieces waiting for a home.",
  monitor: "Click the tabs to switch projects.",
  resume: "My resume.",
  dog: site.dog.blurb,
};

export function DeskExperience() {
  const [view, setView] = useState<ViewId>("seated");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setView("seated");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#1a1612]">
      <Scene view={view} onView={setView} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto max-w-sm rounded-xl bg-black/55 px-4 py-3 text-white backdrop-blur">
          <p className="font-medium">
            {view === "dog" ? site.dog.name : site.name}
          </p>
          <p className="text-sm text-white/70">
            {view === "seated" ? `${site.role}. ` : ""}
            {hints[view]}
          </p>
        </div>
        <Link
          href="/simple"
          className="pointer-events-auto shrink-0 rounded-full bg-black/55 px-4 py-2 text-sm text-white backdrop-blur hover:bg-black/75"
        >
          Simple version
        </Link>
      </div>

      {view !== "seated" && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-3 p-4 sm:p-6">
          <button
            onClick={() => setView("seated")}
            className="rounded-full bg-black/65 px-5 py-2.5 text-sm text-white backdrop-blur hover:bg-black/80"
          >
            ← Back to desk <span className="text-white/50">(Esc)</span>
          </button>
          {view === "resume" && (
            <a
              href={site.links.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#fb923c] px-5 py-2.5 text-sm font-medium text-black hover:opacity-90"
            >
              Download PDF
            </a>
          )}
        </div>
      )}
    </main>
  );
}
