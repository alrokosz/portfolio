import Link from "next/link";
import { site } from "@/content/site";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <header className="flex flex-col gap-6">
        <p className="font-mono text-sm text-muted">{site.location}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {site.name}
        </h1>
        <p className="text-xl text-muted">
          {site.role}. {site.tagline}
        </p>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/"
            className="rounded-full bg-accent px-4 py-2 font-medium text-white transition hover:opacity-90"
          >
            Sit at my desk
          </Link>
          <a href={site.links.resume} className={pill}>
            Resume
          </a>
          <a href={site.links.github} className={pill}>
            GitHub
          </a>
          <a href={site.links.linkedin} className={pill}>
            LinkedIn
          </a>
          <a href={`mailto:${site.links.email}`} className={pill}>
            Email
          </a>
        </nav>
      </header>

      <Section title="About">
        <div className="flex flex-col gap-4 text-lg leading-relaxed">
          {site.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            Roommate
          </p>
          <p className="mt-1 font-medium">
            {site.dog.name}{" "}
            {site.dog.breed && (
              <span className="text-muted">· {site.dog.breed}</span>
            )}
          </p>
          <p className="mt-1 text-muted">{site.dog.blurb}</p>
        </div>
      </Section>

      <Section title="Projects">
        <ul className="flex flex-col gap-4">
          {site.projects.map((project) => (
            <li
              key={project.name}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-medium">
                  {project.href ? (
                    <a href={project.href} className="hover:text-accent">
                      {project.name} ↗
                    </a>
                  ) : (
                    project.name
                  )}
                </h3>
              </div>
              <p className="mt-2 text-muted">{project.description}</p>
              {(project.app ?? project.demo) && (
                <a
                  href={project.app ?? project.demo}
                  className="mt-3 inline-block text-sm font-medium text-accent underline underline-offset-4"
                >
                  {project.app ? `Open ${project.name} →` : "Try the live demo →"}
                </a>
              )}
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Skills">
        <p className="text-lg text-muted">{site.skills.join(" · ")}</p>
      </Section>

      <Section title="Contact">
        <p className="text-lg">
          The best way to reach me is{" "}
          <a
            href={`mailto:${site.links.email}`}
            className="text-accent underline underline-offset-4"
          >
            {site.links.email}
          </a>
          .
        </p>
      </Section>

      <footer className="mt-24 font-mono text-xs text-muted">
        {site.name} · Built with Next.js and three.js
      </footer>
    </main>
  );
}

const pill =
  "rounded-full border border-border px-4 py-2 transition hover:border-accent hover:text-accent";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20">
      <h2 className="mb-6 font-mono text-sm uppercase tracking-wider text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
