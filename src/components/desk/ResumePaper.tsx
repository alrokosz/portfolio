"use client";

import { DeferredHtml } from "./DeferredHtml";
import { site } from "@/content/site";
import { layout } from "./layout";

// The resume lying on the desk. The page is DOM (so it stays crisp and
// selectable) laid flat on a thin white sheet.
const PAPER_PX = { width: 816, height: 1056 }; // letter at 96 dpi
const distanceFactor = (layout.paper.size[0] / PAPER_PX.width) * 400;

export function ResumePaper({ interactive }: { interactive: boolean }) {
  const [w, h] = layout.paper.size;
  return (
    <group position={layout.paper.position} rotation-y={layout.paper.rotationY}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow castShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#fbfaf7" />
      </mesh>
      <DeferredHtml
        transform
        rotation-x={-Math.PI / 2}
        position={[0, 0.0004, 0]}
        distanceFactor={distanceFactor}
        zIndexRange={[10, 0]}
        pointerEvents={interactive ? "auto" : "none"}
      >
        <ResumeSheet />
      </DeferredHtml>
    </group>
  );
}

function ResumeSheet() {
  const { resume, links } = site;
  const strip = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");
  return (
    <div
      style={{ width: PAPER_PX.width, height: PAPER_PX.height }}
      className="overflow-hidden bg-[#fbfaf7] px-16 py-12 font-sans text-[13.5px] leading-snug text-[#1f1b16]"
    >
      <header>
        <h1 className="text-[34px] font-bold tracking-tight">{site.name}</h1>
        <p className="mt-1 text-[12.5px] text-[#555]">
          {site.location} (Remote) · {links.email} · {strip(links.linkedin)} ·{" "}
          {strip(links.github)}
        </p>
      </header>

      <Heading>Summary</Heading>
      <p>{resume.summary}</p>

      <Heading>Experience</Heading>
      {resume.experience.map((job) => (
        <div key={job.company} className="mb-3">
          <div className="flex justify-between font-semibold">
            <p>{job.company}</p>
            <p className="font-normal">{job.dates}</p>
          </div>
          <p>
            <i>{job.role}</i>
            {job.note && <span className="text-[#555]"> · {job.note}</span>}
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {job.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      ))}

      <Heading>Skills</Heading>
      {resume.skills.map((group) => (
        <p key={group.label}>
          <b>{group.label}:</b> {group.items}
        </p>
      ))}

      <Heading>Education</Heading>
      {resume.education.map((e) => (
        <p key={e.school}>
          <b>{e.credential}</b>, {e.school}
        </p>
      ))}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 mb-1.5 border-b border-[#9a948a] pb-0.5 text-[13px] font-bold uppercase tracking-[0.12em]">
      {children}
    </h2>
  );
}
