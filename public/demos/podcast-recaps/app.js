// Podcast Recaps local UI. Talks only to this Mac's loopback API.
// Feed text is untrusted, so everything is inserted with textContent, never as HTML.

const MODES = {
  "previously-on": "Previously On",
  recap: "Recap",
  "further-context": "Further Context",
};
const MODE_HINTS = {
  "previously-on": "A short, dramatic reminder of what matters next.",
  recap: "A clear catch-up of the story so far.",
  "further-context": "Cited outside background. Best for nonfiction; fiction gets a Recap.",
};
const TONES = { "": "The mode's own tone", dramatic: "Dramatic", documentary: "Documentary", conversational: "Conversational", playful: "Playful" };
const MODELS = {
  "claude-opus-5-5": "Claude Opus 5.5 (best)",
  "claude-haiku-5-5": "Claude Haiku 5.5 (cheapest)",
  "claude-code": "Claude Code session (your plan, no API key)",
};

const state = {
  status: null,
  publishing: null,
  publicCheck: null,
  shows: [],
  showId: null,
  show: null,
  episodes: [],
  feed: null,
  voices: [],
  view: "show",
  previewJobId: null,
  filter: "",
  estimate: null,
};

// ---------- helpers ----------

const api = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? `Request failed (${response.status})`);
  return json;
};

/** Builds an element. Strings become text nodes, so feed content can never inject markup. */
const h = (tag, attrs = {}, ...children) => {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") element.className = value;
    else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
    else if (key in element && typeof value !== "string") element[key] = value;
    else element.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
};

const usd = (value) => `$${Number(value ?? 0).toFixed(2)}`;

let toastTimer;
const toast = (message) => {
  const element = document.getElementById("toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (element.hidden = true), 4500);
};

/** Runs an action, disabling its button meanwhile and showing any error. */
const act = (button, work) => async () => {
  if (button) button.disabled = true;
  try {
    await work();
  } catch (error) {
    toast(error.message);
  } finally {
    if (button) button.disabled = false;
  }
};

const copy = async (text) => {
  await navigator.clipboard.writeText(text);
  toast("Copied. With Universal Clipboard, you can paste it on your iPhone.");
};

const select = (options, value, attrs = {}) =>
  h(
    "select",
    attrs,
    Object.entries(options).map(([key, label]) => h("option", { value: key, selected: key === (value ?? "") }, label)),
  );

const field = (label, control, hint) => h("label", { class: "field" }, h("span", {}, label), control, hint ? h("small", { class: "muted" }, hint) : null);

const replace = (id, ...children) => {
  const element = document.getElementById(id);
  if (element) element.replaceChildren(...children.filter((child) => child !== null && child !== undefined && child !== false));
};

// ---------- data ----------

const loadStatus = async () => {
  [state.status, state.shows] = await Promise.all([api("/api/status"), api("/api/shows")]);
};

const loadShow = async (id) => {
  if (state.showId !== id) state.onlyRecaps = undefined;
  state.showId = id;
  state.estimate = null;
  state.previewJobId = null;
  const [show, episodes, feed, defaults] = await Promise.all([
    api(`/api/shows/${id}`),
    api(`/api/shows/${id}/episodes`),
    api(`/api/shows/${id}/feed`),
    api(`/api/shows/${id}/defaults`),
  ]);
  Object.assign(state, { show, episodes, feed, defaults });
};

const refreshEpisodes = async () => {
  if (!state.showId) return;
  state.episodes = await api(`/api/shows/${state.showId}/episodes`);
};

const activeJobs = () => state.episodes.filter(({ latestJob }) => ["queued", "running", "waiting_for_budget"].includes(latestJob?.status));

// ---------- top bar and sidebar ----------

const renderChips = () => {
  const { status, publicCheck } = state;
  if (!status) return;
  const chip = (kind, text) => h("span", { class: `chip ${kind}` }, text);
  const cap = status.monthlyCapUsd === null ? "no cap" : `cap ${usd(status.monthlyCapUsd)}`;
  replace(
    "chips",
    chip(status.apiKeyConfigured ? "ok" : "bad", status.apiKeyConfigured ? "API key set" : "No API key"),
    chip(publicCheck?.reachable ? "ok" : "warn", publicCheck?.reachable ? "Public link on" : "Public link off"),
    status.runningJobId ? chip("warn", `Preparing, ${status.queuedJobs} queued`) : null,
    chip("", `${usd(status.spentThisMonthUsd)} this month, ${cap}`),
  );
};

const renderSidebar = () => {
  replace(
    "show-list",
    ...state.shows.map((show) =>
      h(
        "li",
        {},
        h(
          "button",
          {
            type: "button",
            "aria-current": state.view === "show" && show.id === state.showId ? "true" : "false",
            onclick: act(null, async () => {
              state.view = "show";
              await loadShow(show.id);
              render();
            }),
          },
          show.imageUrl ? h("img", { src: show.imageUrl, alt: "" }) : h("span", { class: "art-placeholder" }),
          h("span", { class: "name" }, show.title),
        ),
      ),
    ),
  );
  if (!state.shows.length) replace("show-list", h("li", { class: "muted small-text" }, "No shows yet."));
  renderBudget();
};

const renderBudget = () => {
  const { status } = state;
  if (!status) return;
  const input = h("input", { type: "number", min: "0", step: "1", placeholder: "No cap", value: status.monthlyCapUsd ?? "", "aria-label": "Monthly cap in dollars" });
  const save = h("button", { type: "button", class: "button small secondary" }, "Save");
  save.addEventListener(
    "click",
    act(save, async () => {
      const value = input.value.trim();
      await api("/api/budget", { method: "PUT", body: { monthlyCapUsd: value === "" ? null : Number(value) } });
      toast(value === "" ? "Monthly cap removed." : `Monthly cap set to ${usd(value)}.`);
      await refresh();
    }),
  );
  replace(
    "budget",
    h("h3", {}, "Spending"),
    h("p", { class: "small-text" }, `${usd(status.spentThisMonthUsd)} spent on Claude this month.`),
    h("div", { class: "row" }, h("span", { class: "small-text muted" }, "Monthly cap $"), input, save),
    h("p", { class: "small-text muted" }, "Jobs wait instead of starting once the cap would be passed."),
  );
};

// ---------- setup ----------

const setupPanel = () => {
  const { status, publishing, publicCheck } = state;
  const parts = [];
  if (!status?.apiKeyConfigured) {
    const input = h("input", { type: "password", autocomplete: "off", placeholder: "sk-ant-...", "aria-label": "Anthropic API key" });
    const save = h("button", { type: "button", class: "button" }, "Save to Keychain");
    save.addEventListener(
      "click",
      act(save, async () => {
        await api("/api/key", { method: "POST", body: { apiKey: input.value } });
        input.value = "";
        toast("API key saved to the macOS Keychain.");
        await refresh();
      }),
    );
    parts.push(
      h(
        "div",
        { class: "stack" },
        h("h2", {}, "1. Add your Anthropic API key"),
        h("p", { class: "muted" }, "Claude writes the recaps with your own key. It's stored in the macOS Keychain and never leaves this Mac except to call Anthropic."),
        h("div", { class: "row" }, input, save),
      ),
    );
  }
  if (!publicCheck?.reachable) {
    const command = publishing?.funnelCommand ?? "tailscale funnel --bg --https=443 http://127.0.0.1:8787";
    const check = h("button", { type: "button", class: "button secondary" }, "Check again");
    check.addEventListener(
      "click",
      act(check, async () => {
        await checkPublic();
        render();
      }),
    );
    parts.push(
      h(
        "div",
        { class: "stack" },
        h("h2", {}, `${parts.length + 1}. Turn on your public link`),
        h(
          "p",
          { class: "muted" },
          "Your iPhone downloads feeds from this Mac through Tailscale Funnel. Install Tailscale, sign in, then run this once in Terminal:",
        ),
        h("div", { class: "row" }, h("code", {}, command), h("button", { type: "button", class: "button small secondary", onclick: () => copy(command) }, "Copy")),
        h("p", { class: "small-text muted" }, publicCheck?.reason ?? "Checking…"),
        h("div", { class: "row" }, check),
      ),
    );
  }
  return parts.length ? h("section", { class: "panel stack", "aria-label": "Setup" }, ...parts) : null;
};

const checkPublic = async () => {
  [state.publishing, state.publicCheck] = await Promise.all([api("/api/publishing"), api("/api/publishing/check")]);
};

// ---------- add show ----------

const addShow = async (feedUrl) => {
  const show = await api("/api/shows", { method: "POST", body: { feedUrl } });
  toast(`Added ${show.title}.`);
  state.view = "show";
  await loadStatus();
  await loadShow(show.id);
  render();
};

const addShowView = () => {
  const results = h("ul", { class: "results" });
  const query = h("input", { type: "search", placeholder: "Show name, such as Revolutions", "aria-label": "Search podcasts" });
  const searchButton = h("button", { type: "button", class: "button" }, "Search");
  const runSearch = act(searchButton, async () => {
    const found = await api(`/api/search?q=${encodeURIComponent(query.value)}`);
    results.replaceChildren(
      ...(found.length ? found : [null]).map((show) =>
        show
          ? h(
              "li",
              {},
              show.imageUrl ? h("img", { src: show.imageUrl, alt: "" }) : h("span", { class: "art-placeholder" }),
              h("div", { class: "grow" }, h("div", {}, show.title), h("div", { class: "small-text muted" }, [show.author, show.episodes ? `${show.episodes} episodes` : null].filter(Boolean).join(" · "))),
              (() => {
                const add = h("button", { type: "button", class: "button small" }, "Add");
                add.addEventListener("click", act(add, () => addShow(show.feedUrl)));
                return add;
              })(),
            )
          : h("li", { class: "muted" }, "No shows found."),
      ),
    );
  });
  searchButton.addEventListener("click", runSearch);
  query.addEventListener("keydown", (event) => event.key === "Enter" && runSearch());

  const url = h("input", { type: "url", placeholder: "https://example.com/feed.xml", "aria-label": "RSS feed URL" });
  const addUrl = h("button", { type: "button", class: "button secondary" }, "Add feed");
  addUrl.addEventListener("click", act(addUrl, () => addShow(url.value.trim())));

  return h(
    "div",
    { class: "stack" },
    h("h1", {}, "Add a show"),
    h("section", { class: "panel stack" }, h("h2", {}, "Search Apple Podcasts"), h("div", { class: "row" }, query, searchButton), results),
    h("section", { class: "panel stack" }, h("h2", {}, "Or paste an RSS feed URL"), h("div", { class: "row" }, url, addUrl)),
  );
};

// ---------- show page ----------

const statusBadge = (episode) => {
  const job = episode.latestJob;
  const badge = (kind, text, detail) => [h("span", { class: `badge ${kind}` }, text), detail ? h("span", { class: "progress" }, detail) : null];
  if (job?.status === "running") return badge("busy", "Preparing", job.progress);
  if (job?.status === "queued") return badge("busy", "Queued");
  if (job?.status === "waiting_for_budget") return badge("warn", "Waiting for budget");
  if (episode.publishedJobId) {
    return episode.deliveredToPhone ? badge("ok", "On your iPhone") : badge("ok", "Ready", "Download it in Apple Podcasts");
  }
  if (job?.status === "failed") return badge("bad", "Failed", job.error);
  if (job?.status === "cancelled") return badge("", "Cancelled");
  return [];
};

const safeBanner = () => {
  const active = activeJobs();
  const published = state.episodes.filter(({ publishedJobId }) => publishedJobId);
  const missing = published.filter(({ deliveredToPhone }) => !deliveredToPhone);
  if (active.length) {
    return h(
      "div",
      { class: "banner warn" },
      h("div", {}, h("strong", {}, `Preparing ${active.length} episode${active.length === 1 ? "" : "s"}. Keep this Mac awake.`), h("p", {}, "Each one appears in your feed as soon as it's ready.")),
    );
  }
  if (missing.length) {
    const labels = missing.slice(0, 8).map(({ label }) => label).join(", ");
    return h(
      "div",
      { class: "banner info" },
      h(
        "div",
        {},
        h("strong", {}, `${missing.length} prepared episode${missing.length === 1 ? " hasn't" : "s haven't"} reached your iPhone yet`),
        h("p", {}, `Download ${labels}${missing.length > 8 ? ", …" : ""} in Apple Podcasts before closing this Mac. Downloaded episodes play without it.`),
      ),
    );
  }
  if (published.length) {
    return h(
      "div",
      { class: "banner ok" },
      h("div", {}, h("strong", {}, "Safe to close your Mac"), h("p", {}, "Every prepared episode has been downloaded to your iPhone. Check that they show as downloaded in Apple Podcasts.")),
    );
  }
  return null;
};

const phoneCard = () => {
  const { feed, showId } = state;
  if (!feed?.feedUrl) {
    return h("section", { class: "panel" }, h("h2", {}, "Listen on your iPhone"), h("p", { class: "muted" }, "Turn on your public link to get a feed URL."));
  }
  const rotate = h("button", { type: "button", class: "button small secondary" }, "New URL");
  rotate.addEventListener(
    "click",
    act(rotate, async () => {
      if (!confirm("Make a new feed URL? The current one stops working, and you'll need to follow the show again in Apple Podcasts.")) return;
      await api(`/api/shows/${showId}/rotate-feed-token`, { method: "POST", body: {} });
      state.feed = await api(`/api/shows/${showId}/feed`);
      renderShowCards();
      toast("New feed URL ready.");
    }),
  );
  return h(
    "section",
    { class: "panel phone" },
    h("img", { src: `/api/shows/${showId}/feed/qr.svg?v=${encodeURIComponent(feed.feedUrl.slice(-12))}`, alt: "QR code for the private feed URL" }),
    h(
      "div",
      { class: "stack" },
      h("h2", {}, "Listen on your iPhone"),
      h("p", {}, "Scan the code with the Camera, or copy the URL. In Apple Podcasts, open Library, tap ⋯, then Follow a Show by URL."),
      h("div", { class: "feed-url" }, feed.feedUrl),
      h("div", { class: "row" }, h("button", { type: "button", class: "button small", onclick: () => copy(feed.feedUrl) }, "Copy URL"), rotate),
      h("p", { class: "small-text muted" }, "Keep this URL private. Anyone with it can listen and use Prepare next."),
    ),
  );
};

/** Reads the settings form into the API's shape. */
const readSettings = (form) => {
  const value = (name) => form.querySelector(`[name="${name}"]`).value.trim();
  return {
    mode: value("mode"),
    tone: value("tone") || null,
    instructions: value("instructions") || null,
    model: value("model"),
    voice: value("voice") || null,
    wordsPerMinute: value("wordsPerMinute") ? Number(value("wordsPerMinute")) : null,
    pauseSeconds: Number(value("pauseSeconds") || 1.2),
  };
};

const settingsCard = () => {
  const settings = state.defaults ?? {};
  const voiceOptions = { "": "System default" };
  for (const { name, locale } of state.voices) if (locale.startsWith("en")) voiceOptions[name] = `${name} (${locale})`;
  const modeHint = h("small", { class: "muted" }, MODE_HINTS[settings.mode] ?? "");
  const mode = select(MODES, settings.mode, { name: "mode", onchange: (event) => (modeHint.textContent = MODE_HINTS[event.target.value]) });
  const save = h("button", { type: "button", class: "button secondary" }, "Save as default");
  const form = h(
    "div",
    { class: "stack" },
    h("div", { class: "fields" },
      h("label", { class: "field" }, h("span", {}, "Mode"), mode, modeHint),
      field("Tone", select(TONES, settings.tone ?? "", { name: "tone" })),
      field("Model", select(MODELS, settings.model, { name: "model" })),
      field("Voice", select(voiceOptions, settings.voice ?? "", { name: "voice" })),
      field("Speed (words per minute)", h("input", { name: "wordsPerMinute", type: "number", min: "90", max: "360", placeholder: "About 175", value: settings.wordsPerMinute ?? "" })),
      field("Pause before episode (seconds)", h("input", { name: "pauseSeconds", type: "number", min: "0", max: "10", step: "0.1", value: settings.pauseSeconds ?? 1.2 })),
    ),
    field(
      "Instructions for Claude (optional)",
      h("textarea", { name: "instructions", maxlength: "1000", placeholder: "For example: focus on the key people and keep it under a minute." }, settings.instructions ?? ""),
      "Changes focus and style. The spoiler rules always apply.",
    ),
    h("div", { class: "row" }, save, h("span", { class: "small-text muted" }, "Prepare next on your iPhone uses the saved default.")),
  );
  save.addEventListener(
    "click",
    act(save, async () => {
      state.defaults = await api(`/api/shows/${state.showId}/defaults`, { method: "PUT", body: { settings: readSettings(form) } });
      toast("Saved. Prepare next will use these settings.");
    }),
  );
  return { element: h("section", { class: "panel stack", id: "settings-card" }, h("h2", {}, "Recap settings"), form), form };
};

const prepareCard = (settingsForm) => {
  const options = Object.fromEntries(state.episodes.map(({ guid, label, title }) => [guid, `${label} · ${title}`]));
  const firstUnprepared = state.episodes.find((episode, index) => index > 0 && !episode.publishedJobId)?.guid;
  const from = select(options, firstUnprepared, { "aria-label": "First episode" });
  const to = select(options, state.episodes.at(-1)?.guid, { "aria-label": "Last episode" });
  const summary = h("div", { class: "stack" });
  const estimate = h("button", { type: "button", class: "button secondary" }, "Estimate cost");

  const body = () => ({ from: from.value, to: to.value, settings: readSettings(settingsForm) });
  estimate.addEventListener(
    "click",
    act(estimate, async () => {
      const result = await api(`/api/shows/${state.showId}/estimate`, { method: "POST", body: body() });
      const reused = result.episodes.filter(({ reusesSavedRecap }) => reusesSavedRecap).length;
      const capLeft = result.monthlyCapUsd === null ? null : result.monthlyCapUsd - result.spentThisMonthUsd;
      const prepare = h("button", { type: "button", class: "button" }, `Prepare ${result.episodes.length} episode${result.episodes.length === 1 ? "" : "s"} for about ${usd(result.totalUsd)}`);
      prepare.addEventListener(
        "click",
        act(prepare, async () => {
          const jobs = await api(`/api/shows/${state.showId}/prepare`, { method: "POST", body: body() });
          toast(`Queued ${jobs.length} episode${jobs.length === 1 ? "" : "s"}.`);
          summary.replaceChildren();
          await refresh();
        }),
      );
      summary.replaceChildren(
        h(
          "div",
          { class: "banner info" },
          h(
            "div",
            {},
            h("strong", {}, `${result.episodes.length} episodes, about ${usd(result.totalUsd)}`),
            h("p", {}, `Runs in episode order, about 1 to 3 minutes each. ${reused ? `${reused} already have recap text and are free. ` : ""}Estimates round up for rewrites.`),
            capLeft !== null && capLeft < result.totalUsd
              ? h("p", {}, `This is more than the ${usd(capLeft)} left under your monthly cap, so later episodes will wait until you raise it.`)
              : null,
          ),
        ),
        h("div", { class: "row" }, prepare),
      );
    }),
  );

  return h(
    "section",
    { class: "panel stack" },
    h("h2", {}, "Prepare episodes"),
    h("p", { class: "muted" }, "Prepare a range now, then download it on your iPhone so you can listen with this Mac closed."),
    h("div", { class: "grid-2" }, field("From", from), field("To", to)),
    h("div", { class: "row" }, estimate),
    summary,
  );
};

const previewRow = (episode) => {
  const jobId = episode.publishedJobId ?? episode.latestJob?.id;
  const box = h("div", { class: "preview" }, "Loading…");
  api(`/api/jobs/${jobId}/text`)
    .then(({ text, sources }) => {
      box.replaceChildren(text ?? "No recap text saved.", sources ? h("p", { class: "small-text muted" }, sources) : "");
      if (episode.publishedJobId) box.append(h("audio", { controls: true, preload: "none", src: `/api/jobs/${jobId}/audio` }));
    })
    .catch((error) => box.replaceChildren(error.message));
  return h("tr", {}, h("td", { colspan: "5" }, box));
};

const hasRecapActivity = (episode) => Boolean(episode.publishedJobId || episode.latestJob);

const episodeRows = () => {
  const filter = state.filter.toLowerCase();
  const rows = [];
  for (const episode of [...state.episodes].reverse()) {
    if (filter && !`${episode.label} ${episode.title}`.toLowerCase().includes(filter)) continue;
    if (state.onlyRecaps && !hasRecapActivity(episode)) continue;
    const job = episode.latestJob;
    const active = ["queued", "running", "waiting_for_budget"].includes(job?.status);
    const actions = [];
    if (episode.publishedJobId || job?.status === "done") {
      actions.push(
        h("button", {
          type: "button",
          class: "link-button",
          onclick: () => {
            state.previewJobId = state.previewJobId === episode.guid ? null : episode.guid;
            renderEpisodes();
          },
        }, state.previewJobId === episode.guid ? "Hide" : "Preview"),
      );
    }
    if (active) {
      const cancel = h("button", { type: "button", class: "link-button" }, "Cancel");
      cancel.addEventListener("click", act(cancel, async () => {
        await api(`/api/jobs/${job.id}/cancel`, { method: "POST", body: {} });
        await refresh();
      }));
      actions.push(cancel);
    }
    rows.push(
      h(
        "tr",
        {},
        h("td", { class: "label" }, episode.label),
        h("td", {}, episode.title),
        h("td", { class: "date" }, new Date(episode.publishedAt).toLocaleDateString()),
        h("td", { class: "status" }, statusBadge(episode)),
        h("td", { class: "actions" }, actions),
      ),
    );
    if (state.previewJobId === episode.guid) rows.push(previewRow(episode));
    if (rows.length > 600) break;
  }
  return rows;
};

const renderEpisodes = () => {
  replace("safe-banner", safeBanner() ?? "");
  replace("episode-rows", ...episodeRows());
};

const renderShowCards = () => {
  replace("phone-card", phoneCard());
};

const showView = () => {
  const { show } = state;
  const refreshFeed = h("button", { type: "button", class: "button small secondary" }, "Refresh feed");
  refreshFeed.addEventListener("click", act(refreshFeed, async () => {
    await api(`/api/shows/${state.showId}/refresh`, { method: "POST", body: {} });
    await loadShow(state.showId);
    render();
    toast("Feed refreshed.");
  }));
  const remove = h("button", { type: "button", class: "button small danger" }, "Remove");
  remove.addEventListener("click", act(remove, async () => {
    if (!confirm(`Remove ${show.title}? Its private feed stops working. Cached files stay on disk.`)) return;
    await api(`/api/shows/${state.showId}`, { method: "DELETE" });
    state.showId = null;
    await loadStatus();
    if (state.shows[0]) await loadShow(state.shows[0].id);
    render();
  }));

  const { element: settings, form } = settingsCard();
  const filter = h("input", { type: "search", placeholder: "Filter episodes", value: state.filter, "aria-label": "Filter episodes" });
  filter.addEventListener("input", () => {
    state.filter = filter.value;
    renderEpisodes();
  });
  // Start with only recap activity when there is some, so prepared episodes aren't buried in a long back catalog.
  state.onlyRecaps ??= state.episodes.some(hasRecapActivity);
  const onlyRecaps = h("input", { type: "checkbox", checked: state.onlyRecaps });
  onlyRecaps.addEventListener("change", () => {
    state.onlyRecaps = onlyRecaps.checked;
    renderEpisodes();
  });
  const filters = h("div", { class: "row" }, h("label", { class: "row small-text" }, onlyRecaps, "Only episodes with recaps"), filter);

  const view = h(
    "div",
    { class: "stack" },
    h(
      "div",
      { class: "show-head" },
      show.imageUrl ? h("img", { src: show.imageUrl, alt: "" }) : null,
      h("div", {}, h("h1", {}, show.title), h("p", { class: "muted" }, [show.author, `${show.episodeCount} episodes`].filter(Boolean).join(" · "))),
      h("div", { class: "actions row" }, refreshFeed, remove),
    ),
    h("div", { id: "safe-banner" }),
    h("div", { id: "phone-card" }),
    h("div", { class: "grid-2" }, settings, prepareCard(form)),
    h(
      "section",
      { class: "panel" },
      h("div", { class: "episodes-head" }, h("h2", {}, "Episodes"), filters),
      h(
        "table",
        {},
        h("thead", {}, h("tr", {}, h("th", {}, "#"), h("th", {}, "Title"), h("th", { class: "date" }, "Published"), h("th", {}, "Status"), h("th", {}, ""))),
        h("tbody", { id: "episode-rows" }),
      ),
    ),
  );
  return view;
};

// ---------- main render and polling ----------

const render = () => {
  renderChips();
  renderSidebar();
  const main = document.getElementById("main");
  const setup = setupPanel();
  if (state.view === "add" || (!state.shows.length && state.view !== "show-loading")) {
    main.replaceChildren(...[setup, addShowView()].filter(Boolean));
    return;
  }
  if (!state.show) {
    main.replaceChildren(...[setup, h("div", { class: "empty" }, "Choose a show.")].filter(Boolean));
    return;
  }
  main.replaceChildren(...[setup, showView()].filter(Boolean));
  renderShowCards();
  renderEpisodes();
};

const refresh = async () => {
  await Promise.all([loadStatus(), refreshEpisodes()]);
  renderChips();
  renderBudget();
  if (state.view === "show" && state.show) renderEpisodes();
};

const poll = async () => {
  try {
    await refresh();
  } catch {
    // The service may be restarting. Try again on the next tick.
  }
  const busy = state.status?.runningJobId || state.status?.queuedJobs;
  setTimeout(poll, busy ? 3000 : 15000);
};

const start = async () => {
  document.getElementById("add-show-button").addEventListener("click", () => {
    state.view = "add";
    render();
  });
  await Promise.all([loadStatus(), checkPublic().catch(() => {})]);
  state.voices = await api("/api/voices").catch(() => []);
  if (state.shows[0]) await loadShow(state.shows[0].id);
  render();
  setTimeout(poll, 3000);
  // Funnel can be switched on or off at any time, so recheck it now and then.
  setInterval(() => checkPublic().then(() => { renderChips(); }).catch(() => {}), 60000);
};

start().catch((error) => {
  document.getElementById("main").replaceChildren(h("div", { class: "empty" }, `Couldn't reach the Podcast Recaps service: ${error.message}`));
});
