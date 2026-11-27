// All the words on the site live here, so you can edit copy without touching
// components. Both the plain homepage and the 3D apartment read from this file.
//
// Anything marked TODO is a placeholder: replace it before sharing the link.

export type Project = {
  name: string;
  description: string;
  tech: string[];
  href: string;
  /** a screenshot shown on the monitor */
  image?: string;
  /** a working copy of the UI, small enough to run in an iframe on the monitor */
  demo?: string;
  /** a full app with its own page on this site, too heavy to run inside the 3D scene: the
   *  monitor shows a screenshot and links out to it */
  app?: string;
  /** the address the real app runs at, shown in the monitor's address bar */
  localUrl?: string;
};

export const site = {
  name: "Alex Rokosz",
  role: "Software Engineer",
  location: "Minneapolis, MN",
  tagline:
    "Frontend-focused. I build production React and TypeScript apps, from the database to the UI.",
  url: "https://example.com", // TODO: your Vercel domain, used for metadata

  about: [
    "I'm a frontend-focused software engineer with 4+ years building production React and TypeScript apps, from the booking experience on choicehotels.com to the data-heavy SBOM platform at RunSafe Security.",
    "I own features end to end, from the PostgreSQL database to reusable, consistent UI components, and I work daily with AI tools like Cursor and Claude Code.",
    // TODO: make this line yours
    "Outside of work I'm usually tinkering with side projects or out on a walk with my dog.",
  ],

  dog: {
    name: "Buck",
    breed: "", // TODO: optional; shown on the simple page when set
    blurb:
      "My dog and the unofficial co-owner of the office. Expert napper, mediocre at fetch.", // TODO
    photo: "/dog.jpg", // location data stripped; re-strip if you swap it
  },

  // Rendered as the sheet of paper on the desk. Mirrors public/resume.pdf, so
  // update both together.
  resume: {
    summary:
      "Frontend-focused software engineer with 4+ years building production React and TypeScript apps, from the booking experience on choicehotels.com to the data-heavy SBOM platform at RunSafe Security. Owns features end to end, from the PostgreSQL database to reusable, consistent UI components, and works daily with AI tools like Cursor and Claude Code.",
    experience: [
      {
        company: "RunSafe Security",
        role: "Software Engineer, SBOM Platform",
        note: "Software supply chain security for embedded systems, defense and critical infrastructure",
        dates: "03/2026 – Present",
        bullets: [
          "Cut page load times by over 30% on data-heavy SBOM views (thousands of SBOMs with up to 5,000 components, vulnerabilities and licenses each) by adding pagination and lazy loading.",
          "Built project-level license compliance in Next.js, TypeScript and PostgreSQL, letting users allow or deny specific licenses for each project.",
          "Cut thousands of license variants to a few hundred by parsing SPDX license expressions and matching license text to real SPDX licenses, making license compliance manageable.",
          "Own the team's shadcn/ui (Radix UI) and Tailwind CSS component library; consolidated 12+ near-duplicate components and added font, spacing and color guardrails for consistent styling.",
          "Wrote AI coding rules that keep AI-generated code on the component library and Tailwind tokens, speeding up development without styling drift.",
        ],
      },
      {
        company: "Choice Hotels International",
        role: "Software Engineer II",
        note: undefined as string | undefined,
        dates: "10/2022 – 03/2026",
        bullets: [
          "Built and maintained responsive React and Redux features on choicehotels.com, the booking site used by millions of hotel guests.",
          "Built a refundable-rate option for the booking flow that brings in over $30M in revenue per year, letting guests book a refundable rate for an added cost.",
          "Worked with product, design and integration teams to turn designs into customer-facing booking features.",
          "Refactored front-end data fetching from REST APIs to GraphQL.",
          "Improved developer experience and code health by introducing TypeScript, writing unit tests with Jest and React Testing Library, and using Knip to remove 400+ unused files and 12 unneeded dependencies.",
        ],
      },
    ],
    skills: [
      {
        label: "Frontend",
        items:
          "TypeScript, React, Next.js, Tailwind CSS, shadcn/ui (Radix UI), Redux, JavaScript (ES6+), HTML5, CSS3, SCSS, design systems, component libraries",
      },
      {
        label: "Server & data",
        items: "Node.js, Express.js, PostgreSQL, GraphQL, REST APIs",
      },
      {
        label: "Testing",
        items: "Vitest, Jest, React Testing Library, Playwright",
      },
      {
        label: "Cloud & tooling",
        items: "Google Cloud (GCP), AWS (S3, Lambda), Cursor, Claude Code",
      },
    ],
    education: [
      { credential: "Software Engineering Immersive", school: "Codesmith" },
      {
        credential: "Bachelor of Arts in Psychology",
        school: "The University of Arizona",
      },
    ],
  },

  // The short list shown on the simple page.
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Tailwind CSS",
    "shadcn/ui",
    "Node.js",
    "PostgreSQL",
    "GraphQL",
  ],

  projects: [
    {
      name: "Pawpath",
      description:
        "When and where to walk the dog in Minneapolis's North Loop: building and tree shade from LiDAR, sidewalk temperatures through the day, and walks routed to keep paws comfortable. An animation-heavy React app built on one Motion value for the time of day.",
      tech: ["TypeScript", "React", "Motion", "MapLibre", "Web Workers", "LiDAR"],
      href: "https://github.com/alrokosz/pawpath",
      image: "/projects/pawpath.jpg",
      // Its own Vercel project; next.config.ts forwards /pawpath to it.
      app: "/pawpath",
    },
    {
      name: "Podcast Recaps",
      description:
        'Spoiler-safe "previously on" segments for long-running podcasts: AI-written, narrated recaps spliced into a private copy of the feed in Apple Podcasts.',
      tech: ["TypeScript", "Claude API", "Text-to-speech", "RSS"],
      // Optional: add `image: "/projects/podcast-recaps.png"` to show a screenshot on the monitor.
      href: "https://github.com/alrokosz/podcast-recaps",
      // A working copy of the real UI with a fake backend, synced from the
      // podcast-recaps repo by scripts/sync-demos.mjs.
      demo: "/demos/podcast-recaps/index.html",
      localUrl: "127.0.0.1:8787",
    },
  ] as Project[],

  links: {
    email: "alrokosz@gmail.com",
    github: "https://github.com/alrokosz",
    linkedin: "https://www.linkedin.com/in/alexrrokosz",
    resume: "/resume.pdf",
  },
};

