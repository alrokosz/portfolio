"use client";

import { useState } from "react";
import { site, type Project } from "@/content/site";

// What's on the monitor: a browser window with one tab per project.
// Sized in CSS pixels; Monitor.tsx scales it to fit the 3D screen.
export const SCREEN_PX = { width: 1200, height: 680 };

type Tab = { id: string; title: string; url: string };

const tabs: Tab[] = [
  { id: "about", title: "About me", url: "localhost:3000/about" },
  ...site.projects.map((p) => ({
    id: p.name,
    title: p.name,
    url: p.localUrl ?? (p.app ? `alexrokosz.com${p.app}` : p.href.replace(/^https?:\/\//, "")),
  })),
];

export function ScreenUI() {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active)!;
  const project: Project | undefined = site.projects.find((p) => p.name === active);
  // Demos stay loaded once opened, so switching tabs doesn't reset them.
  const [opened, setOpened] = useState<string[]>([]);
  const open = (id: string) => {
    setActive(id);
    if (!opened.includes(id)) setOpened([...opened, id]);
  };

  return (
    <div
      style={{ width: SCREEN_PX.width, height: SCREEN_PX.height }}
      className="flex select-none flex-col overflow-hidden bg-[#202124] font-sans text-[#e8eaed]"
      // Clicks and drags on the screen belong to the page, not the 3D scene
      // behind it (which would otherwise treat them as clicks on the room).
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* tab strip */}
      <div className="flex h-12 items-end gap-1 bg-[#2b2c30] px-3 pt-2">
        <div className="mr-3 flex gap-2 self-center">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => open(t.id)}
            className={`h-full max-w-60 truncate rounded-t-lg px-4 text-left text-sm transition ${
              t.id === active
                ? "bg-[#202124] text-white"
                : "text-[#9aa0a6] hover:bg-[#35363a]"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* address bar */}
      <div className="flex h-11 items-center gap-3 border-b border-[#3c4043] px-4">
        <span className="text-[#9aa0a6]">←</span>
        <span className="text-[#9aa0a6]">→</span>
        <div className="flex-1 truncate rounded-full bg-[#35363a] px-4 py-1.5 text-sm text-[#bdc1c6]">
          {tab.url}
        </div>
      </div>

      {/* page */}
      {site.projects
        .filter((p) => p.demo && opened.includes(p.name))
        .map((p) => (
          <DemoPage key={p.name} project={p} hidden={p.name !== active} />
        ))}
      {!project?.demo && (
        <div className="flex-1 overflow-y-auto px-14 py-10">
          {project ? <ProjectPage project={project} /> : <AboutPage />}
        </div>
      )}
    </div>
  );
}

// A project's real UI running on sample data, with a strip of context on top.
function DemoPage({ project, hidden }: { project: Project; hidden: boolean }) {
  return (
    <div className={hidden ? "hidden" : "flex min-h-0 flex-1 flex-col"}>
      <div className="flex items-center gap-4 border-b border-[#3c4043] bg-[#292a2d] px-4 py-2 text-sm">
        <span className="rounded-full bg-[#fb923c] px-2 py-0.5 text-xs font-semibold text-black">
          Live demo
        </span>
        <p className="min-w-0 flex-1 truncate text-[#bdc1c6]">
          {project.description}
        </p>
        <a
          href={project.demo}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[#fb923c] hover:underline"
        >
          Full screen ↗
        </a>
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[#fb923c] hover:underline"
        >
          GitHub ↗
        </a>
      </div>
      <iframe
        src={project.demo}
        title={`${project.name} demo`}
        className="min-h-0 w-full flex-1 bg-white"
        allow="clipboard-write"
      />
    </div>
  );
}

function ProjectPage({ project }: { project: Project }) {
  return (
    <article className="flex gap-10">
      <div className="flex-1">
        <h1 className="text-4xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <p className="mt-5 text-xl leading-relaxed text-[#bdc1c6]">
          {project.description}
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <li
              key={t}
              className="rounded-full border border-[#5f6368] px-3 py-1 font-mono text-sm text-[#bdc1c6]"
            >
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          {project.app && (
            // Opens in its own tab: the app is a full-screen map with its own WebGL, too heavy
            // to run inside the 3D scene.
            <a
              href={project.app}
              target="_blank"
              rel="noopener"
              className="inline-block rounded-full bg-[#fb923c] px-6 py-3 text-lg font-medium text-black hover:opacity-90"
            >
              Open {project.name} ↗
            </a>
          )}
          {project.href && (
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                project.app
                  ? "inline-block rounded-full border border-[#5f6368] px-6 py-3 text-lg hover:border-[#fb923c] hover:text-[#fb923c]"
                  : "inline-block rounded-full bg-[#fb923c] px-6 py-3 text-lg font-medium text-black hover:opacity-90"
              }
            >
              View on GitHub ↗
            </a>
          )}
        </div>
      </div>
      {project.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image}
          alt=""
          className="w-[480px] self-start rounded-lg border border-[#3c4043]"
        />
      )}
    </article>
  );
}

function AboutPage() {
  return (
    <article className="max-w-3xl">
      <p className="font-mono text-sm text-[#9aa0a6]">{site.location}</p>
      <h1 className="mt-2 text-5xl font-semibold tracking-tight">
        {site.name}
      </h1>
      <p className="mt-3 text-2xl text-[#fb923c]">{site.role}</p>
      <div className="mt-6 flex flex-col gap-4 text-xl leading-relaxed text-[#bdc1c6]">
        {site.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-8 flex gap-3 text-lg">
        {[
          ["GitHub", site.links.github],
          ["LinkedIn", site.links.linkedin],
          ["Email", `mailto:${site.links.email}`],
        ].map(([label, href]) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[#5f6368] px-5 py-2 hover:border-[#fb923c] hover:text-[#fb923c]"
          >
            {label}
          </a>
        ))}
      </div>
      <p className="mt-10 text-base text-[#9aa0a6]">
        My projects are in the tabs above. My resume is the paper on the desk.
      </p>
    </article>
  );
}
