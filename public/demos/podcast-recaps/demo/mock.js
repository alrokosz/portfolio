// Fake backend for the Podcast Recaps demo. The UI (app.js, app.css, synced
// from the real app by scripts/sync-demos.mjs) runs unchanged; this script
// loads first and answers its /api/... requests in the browser with made-up
// shows. Nothing leaves the page.
//
// Every route the UI calls must appear in ROUTES below as "METHOD /api/path"
// (":name" for parameters). The sync script checks that, so keep the format.
(() => {
  // ---------- sample data ----------

  const cover = (title, from, to) => {
    const initials = title
      .split(/\s+/)
      .filter((word) => /^[A-Z]/.test(word))
      .slice(0, 2)
      .map((word) => word[0])
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/><text x="150" y="172" font-family="Georgia, serif" font-size="96" fill="#fff" fill-opacity="0.92" text-anchor="middle">${initials}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  // Fictional shows, so the demo never implies anything about a real podcast.
  const catalog = [
    {
      title: "The Lighthouse Keepers",
      author: "Tidewater Audio Theatre",
      feedUrl: "https://feeds.example.com/lighthouse-keepers.xml",
      imageUrl: cover("The Lighthouse Keepers", "#1e3a5f", "#4f8fbf"),
      fiction: true,
      titles: [
        "The Fog Signal",
        "A Ship That Wasn't There",
        "Logbook Pages",
        "The Keeper's Daughter",
        "Low Tide",
        "What the Lens Saw",
        "The Inspector Arrives",
        "Storm Season",
        "Wreckage",
        "The Second Light",
        "Inquest",
        "First Light",
      ],
    },
    {
      title: "Salt and Empire",
      author: "Nadia Ferrer",
      feedUrl: "https://feeds.example.com/salt-and-empire.xml",
      imageUrl: cover("Salt and Empire", "#7a4b1f", "#d9a45b"),
      fiction: false,
      titles: [
        "The Salt Roads",
        "White Gold",
        "The Tax That Built a City",
        "Caravans",
        "The Venetian Monopoly",
        "Brine and Fire",
        "Salt Wars",
        "The Gabelle",
        "Smugglers",
        "Preserving the Navy",
        "The March to the Sea",
        "Cheap Salt",
        "Iodine",
        "The Last Salt Works",
      ],
    },
    {
      title: "Signal Lost",
      author: "Quiet Hours Fiction",
      feedUrl: "https://feeds.example.com/signal-lost.xml",
      imageUrl: cover("Signal Lost", "#2d1b4e", "#8a5cc7"),
      fiction: true,
      titles: ["Static", "The Relay Station", "Night Shift", "Echoes", "Dead Air", "Frequency", "Carrier Wave", "Sign Off"],
    },
    {
      title: "The Long Table",
      author: "Marcus Bell",
      feedUrl: "https://feeds.example.com/the-long-table.xml",
      imageUrl: cover("The Long Table", "#2f5233", "#86b36b"),
      fiction: false,
      titles: ["Bread", "Spice Routes", "The First Restaurants", "Canning", "The Supermarket", "Fast Food", "Farm to Table"],
    },
    {
      title: "Orbiting",
      author: "Priya Raman",
      feedUrl: "https://feeds.example.com/orbiting.xml",
      imageUrl: cover("Orbiting", "#111827", "#3b82f6"),
      fiction: false,
      titles: ["Sputnik", "The Race", "Apollo", "Skylab", "The Shuttle Years", "Mir", "The Station"],
    },
  ];

  // Hand-written recaps for the episodes that start out prepared.
  const writtenRecaps = {
    "The Lighthouse Keepers": {
      2: "Previously on The Lighthouse Keepers. Elsie Hart took the post on Gannet Rock to get away from the mainland, and on her first night the fog signal sounded on its own. Old Tomas swore he'd shut it down. Somewhere out in the dark, something answered.",
      3: "Previously on The Lighthouse Keepers. A ship's lights crossed the reef where no ship could sail, and by morning there was no wreck and no record of any vessel. Tomas burned the page of the log that mentioned it. Elsie saw him do it.",
      4: "Previously on The Lighthouse Keepers. Elsie found the missing logbook pages hidden in the oil store, written in a hand that wasn't Tomas's. They describe the same ghost ship, thirty years ago, and they're signed with a single initial: M.",
      5: "Previously on The Lighthouse Keepers. M was Maren, the last keeper's daughter, who left the island the winter the ship was first seen. Tomas admitted he knew her. He didn't say how, and he hasn't spoken to Elsie since.",
      6: "Previously on The Lighthouse Keepers. At the lowest tide of the year, Elsie walked out to the reef and found a ship's bell half buried in the sand, still bright, as if it had sunk last week. The name on it had been chiselled off.",
    },
  };

  const DAY = 86_400_000;
  const makeEpisodes = (entry) =>
    entry.titles.map((title, index) => ({
      guid: `${entry.feedUrl}#${index + 1}`,
      label: String(index + 1),
      title: `${index + 1} - ${title}`,
      publishedAt: new Date(Date.UTC(2026, 10, 20) - (entry.titles.length - 1 - index) * 7 * DAY).toISOString(),
      publishedJobId: null,
      deliveredToPhone: false,
      latestJob: null,
    }));

  const defaultSettings = () => ({
    mode: "previously-on",
    tone: null,
    instructions: null,
    model: "claude-opus-5-5",
    voice: null,
    wordsPerMinute: null,
    pauseSeconds: 1.2,
  });

  const token = () => Math.random().toString(36).slice(2, 14);

  let nextShowId = 1;
  let nextJobId = 1;
  const shows = []; // { id, entry, episodes, defaults, token }
  const jobs = new Map(); // id -> { id, showId, guid, status, progress, error, step, cost, text, sources }

  const addShow = (entry) => {
    const show = { id: nextShowId++, entry, episodes: makeEpisodes(entry), defaults: defaultSettings(), token: token() };
    shows.push(show);
    return show;
  };

  const status = { apiKeyConfigured: true, monthlyCapUsd: 10, spentThisMonthUsd: 1.42 };

  // Start with one show that has some history, and one fresh one.
  const lighthouse = addShow(catalog[0]);
  addShow(catalog[1]);
  for (const number of [2, 3, 4, 5, 6]) {
    const episode = lighthouse.episodes[number - 1];
    const job = {
      id: nextJobId++,
      showId: lighthouse.id,
      guid: episode.guid,
      status: "done",
      progress: "Done",
      error: null,
      step: 0,
      cost: 0.21,
      text: writtenRecaps["The Lighthouse Keepers"][number],
      sources: null,
    };
    jobs.set(job.id, job);
    Object.assign(episode, { publishedJobId: job.id, deliveredToPhone: number < 6, latestJob: publicJob(job) });
  }

  // ---------- recap writing (canned) ----------

  function publicJob(job) {
    return { id: job.id, status: job.status, progress: job.progress, error: job.error };
  }

  const recapFor = (show, episode, settings) => {
    const index = show.episodes.indexOf(episode);
    const name = show.entry.title;
    const before = show.episodes.slice(Math.max(0, index - 2), index).map(({ title }) => `“${title.replace(/^\d+ - /, "")}”`);
    const next = episode.title.replace(/^\d+ - /, "");
    if (!before.length) return { text: `This is the first episode of ${name}, so there's nothing to recap yet. Enjoy “${next}”.`, sources: null };
    const recent = before.join(" and ");
    if (settings.mode === "further-context" && !show.entry.fiction) {
      return {
        text: `Some background before “${next}”. ${name} has been following the story through ${recent}. This briefing adds context from outside the show, with sources, without getting ahead of the next episode.`,
        sources: "Sources: sample encyclopedia entries (demo data).",
      };
    }
    if (settings.mode === "recap" || settings.mode === "further-context") {
      return { text: `The story so far on ${name}. The last stretch covered ${recent}. Here's what you need to remember going into “${next}”.`, sources: null };
    }
    return { text: `Previously on ${name}. ${recent} raised the stakes, and the questions they left open matter now. Next: “${next}”.`, sources: null };
  };

  // Mirrors the real pipeline's progress messages.
  const STEPS = [
    "Starting",
    "Transcribing and summarizing earlier episodes",
    "Reading the upcoming episode privately",
    "Narrating and splicing",
  ];
  const COSTS = { "claude-opus-5-5": 0.21, "claude-haiku-5-5": 0.05, "claude-code": 0 };

  const showOf = (id) => {
    const show = shows.find((candidate) => candidate.id === Number(id));
    if (!show) throw httpError(404, "Show not found.");
    return show;
  };
  const episodeOf = (show, guid) => show.episodes.find((episode) => episode.guid === guid);
  const syncEpisode = (job) => {
    const show = shows.find(({ id }) => id === job.showId);
    const episode = show && episodeOf(show, job.guid);
    if (episode) episode.latestJob = publicJob(job);
    return episode;
  };

  const running = () => [...jobs.values()].find(({ status }) => status === "running");
  const queued = () => [...jobs.values()].filter(({ status }) => status === "queued");

  const tick = () => {
    const job = running();
    if (job) {
      job.step++;
      if (job.step < STEPS.length) {
        job.progress = STEPS[job.step];
        syncEpisode(job);
        return;
      }
      job.status = "done";
      job.progress = "Done";
      status.spentThisMonthUsd += job.cost;
      const episode = syncEpisode(job);
      if (episode) {
        episode.publishedJobId = job.id;
        episode.deliveredToPhone = false;
        // Pretend the phone downloads it a little later.
        setTimeout(() => (episode.deliveredToPhone = true), 12_000);
      }
    }
    const next = queued()[0] ?? [...jobs.values()].find(({ status }) => status === "waiting_for_budget");
    if (!next) return;
    if (status.monthlyCapUsd !== null && status.spentThisMonthUsd + next.cost > status.monthlyCapUsd) {
      next.status = "waiting_for_budget";
      next.progress = "Waiting until the monthly cap allows this episode";
    } else {
      next.status = "running";
      next.step = 0;
      next.progress = STEPS[0];
    }
    syncEpisode(next);
  };
  setInterval(tick, 1800);

  // ---------- routes ----------

  const httpError = (status, message) => Object.assign(new Error(message), { status });

  const rangeOf = (show, from, to) => {
    let start = show.episodes.findIndex(({ guid }) => guid === from);
    let end = show.episodes.findIndex(({ guid }) => guid === to);
    if (start < 0 || end < 0) throw httpError(400, "Pick a first and last episode.");
    if (start > end) [start, end] = [end, start];
    return show.episodes.slice(start, end + 1);
  };

  const showJson = (show) => ({
    id: show.id,
    title: show.entry.title,
    author: show.entry.author,
    imageUrl: show.entry.imageUrl,
    feedUrl: show.entry.feedUrl,
    episodeCount: show.episodes.length,
  });

  const ROUTES = {
    "GET /api/status": () => ({
      ...status,
      spentThisMonthUsd: Math.round(status.spentThisMonthUsd * 100) / 100,
      runningJobId: running()?.id ?? null,
      queuedJobs: queued().length,
    }),
    "GET /api/shows": () => shows.map(showJson),
    "POST /api/shows": (_, body) => {
      const entry = catalog.find(({ feedUrl }) => feedUrl === body.feedUrl);
      if (!entry) throw httpError(400, "This demo can only add its sample shows. Search for one by name.");
      const existing = shows.find((show) => show.entry === entry);
      if (existing) throw httpError(409, `${entry.title} is already added.`);
      return showJson(addShow(entry));
    },
    "GET /api/shows/:id": ({ id }) => showJson(showOf(id)),
    "DELETE /api/shows/:id": ({ id }) => {
      const show = showOf(id);
      shows.splice(shows.indexOf(show), 1);
      for (const job of jobs.values()) if (job.showId === show.id && job.status !== "done") job.status = "cancelled";
      return {};
    },
    "GET /api/shows/:id/episodes": ({ id }) => showOf(id).episodes,
    "POST /api/shows/:id/refresh": ({ id }) => (showOf(id), {}),
    "GET /api/shows/:id/feed": ({ id }) => {
      const show = showOf(id);
      return { feedUrl: `https://recaps-demo.example.ts.net/feeds/${show.id}/${show.token}.xml` };
    },
    "POST /api/shows/:id/rotate-feed-token": ({ id }) => {
      showOf(id).token = token();
      return {};
    },
    "GET /api/shows/:id/defaults": ({ id }) => showOf(id).defaults,
    "PUT /api/shows/:id/defaults": ({ id }, body) => {
      const show = showOf(id);
      show.defaults = { ...defaultSettings(), ...body.settings };
      return show.defaults;
    },
    "POST /api/shows/:id/estimate": ({ id }, body) => {
      const show = showOf(id);
      const episodes = rangeOf(show, body.from, body.to).map((episode) => {
        const reusesSavedRecap = Boolean(episode.publishedJobId);
        return { guid: episode.guid, reusesSavedRecap, usd: reusesSavedRecap ? 0 : COSTS[body.settings?.model] ?? 0.21 };
      });
      return {
        episodes,
        totalUsd: episodes.reduce((sum, { usd }) => sum + usd, 0),
        monthlyCapUsd: status.monthlyCapUsd,
        spentThisMonthUsd: status.spentThisMonthUsd,
      };
    },
    "POST /api/shows/:id/prepare": ({ id }, body) => {
      const show = showOf(id);
      const settings = { ...show.defaults, ...body.settings };
      return rangeOf(show, body.from, body.to).map((episode) => {
        const reuse = episode.publishedJobId ? jobs.get(episode.publishedJobId) : null;
        const { text, sources } = reuse ?? recapFor(show, episode, settings);
        const job = {
          id: nextJobId++,
          showId: show.id,
          guid: episode.guid,
          status: "queued",
          progress: null,
          error: null,
          step: 0,
          cost: reuse ? 0 : COSTS[settings.model] ?? 0.21,
          text,
          sources,
        };
        jobs.set(job.id, job);
        syncEpisode(job);
        return publicJob(job);
      });
    },
    "POST /api/jobs/:id/cancel": ({ id }) => {
      const job = jobs.get(Number(id));
      if (!job) throw httpError(404, "Job not found.");
      job.status = "cancelled";
      job.progress = "Cancelled";
      syncEpisode(job);
      return publicJob(job);
    },
    "GET /api/jobs/:id/text": ({ id }) => {
      const job = jobs.get(Number(id));
      if (!job) throw httpError(404, "Job not found.");
      return { text: job.text, sources: job.sources };
    },
    // Loaded by <audio> and <img> rather than fetch; see the src rewrite below.
    "GET /api/jobs/:id/audio": () => ({}),
    "GET /api/shows/:id/feed/qr.svg": () => ({}),
    "PUT /api/budget": (_, body) => {
      status.monthlyCapUsd = body.monthlyCapUsd;
      for (const job of jobs.values()) if (job.status === "waiting_for_budget") job.status = "queued";
      return {};
    },
    "POST /api/key": () => {
      status.apiKeyConfigured = true;
      return {};
    },
    "GET /api/publishing": () => ({ funnelCommand: "tailscale funnel --bg --https=443 http://127.0.0.1:8787" }),
    "GET /api/publishing/check": () => ({ reachable: true, reason: "Your public link is on." }),
    "GET /api/voices": () => [
      { name: "Samantha", locale: "en_US" },
      { name: "Daniel", locale: "en_GB" },
      { name: "Karen", locale: "en_AU" },
      { name: "Moira", locale: "en_IE" },
    ],
    "GET /api/search": (_, __, query) => {
      const q = (query.get("q") ?? "").trim().toLowerCase();
      return catalog
        .filter(({ title, author }) => !q || `${title} ${author}`.toLowerCase().includes(q))
        .map(({ title, author, feedUrl, imageUrl, titles }) => ({ title, author, feedUrl, imageUrl, episodes: titles.length }));
    },
  };

  const compiled = Object.entries(ROUTES).map(([key, handle]) => {
    const [method, path] = key.split(" ");
    const names = [];
    const pattern = new RegExp(`^${path.replace(/:([a-zA-Z]+)/g, (_, name) => (names.push(name), "([^/]+)"))}$`);
    return { method, pattern, names, handle };
  });

  const respond = (status, body) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.origin);
    if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
    const method = (init.method ?? "GET").toUpperCase();
    // A little latency so loading states show, like the real local server.
    await new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 180));
    for (const route of compiled) {
      if (route.method !== method) continue;
      const match = route.pattern.exec(url.pathname);
      if (!match) continue;
      const params = Object.fromEntries(route.names.map((name, index) => [name, decodeURIComponent(match[index + 1])]));
      try {
        const body = init.body ? JSON.parse(init.body) : {};
        return respond(200, route.handle(params, body, url.searchParams));
      } catch (error) {
        return respond(error.status ?? 500, { error: error.message });
      }
    }
    console.warn(`[demo] No mock for ${method} ${url.pathname}`);
    return respond(404, { error: `The demo doesn't support ${method} ${url.pathname} yet.` });
  };

  // The UI points <img> and <audio> at the API directly. Swap those for local
  // files before the browser tries to load them.
  const qr = (() => {
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cells = [];
    const finder = (x, y) =>
      `<rect x="${x}" y="${y}" width="7" height="7" fill="#000"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#000"/>`;
    for (let y = 0; y < 25; y++)
      for (let x = 0; x < 25; x++) {
        const inFinder = (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
        if (!inFinder && rand() > 0.55) cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#000"/>`);
      }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 29 29" shape-rendering="crispEdges"><rect x="-2" y="-2" width="29" height="29" fill="#fff"/>${cells.join("")}${finder(0, 0)}${finder(18, 0)}${finder(0, 18)}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  })();
  const rewriteSrc = (value) => {
    if (typeof value !== "string" || !value.startsWith("/api/")) return value;
    if (value.includes("/feed/qr.svg")) return qr;
    if (/\/api\/jobs\/\d+\/audio/.test(value)) return "demo/sample-recap.m4a";
    return value;
  };
  const setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    return setAttribute.call(this, name, name === "src" ? rewriteSrc(value) : value);
  };

  // When shown inside the portfolio, let Escape leave the close-up even while
  // focus is inside this frame.
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && window.parent !== window) window.parent.postMessage({ type: "demo:escape" }, location.origin);
  });
})();
