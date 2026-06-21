# Portfolio

My personal site. Next.js (App Router) + Tailwind, with a three.js apartment you can explore at `/apartment`.

## Develop

```bash
npm install
npm run dev   # http://localhost:3000
```

## Where things live

The homepage is a 3D office: you sit at the desk, the monitor is a browser with
a tab per project, the paper on the desk is the resume, and the framed photo is
the dog. `/simple` is a plain text version for anyone who wants the quick read.

- `src/content/site.ts`: all the copy (bio, dog, resume, projects, links). Edit this first.
- `src/components/desk/layout.ts`: where every object sits, in meters, plus the camera close-ups.
- `src/components/desk/ScreenUI.tsx`: what's on the monitor (real DOM, projected onto the screen).
- `src/components/desk/ResumePaper.tsx`: the resume sheet.
- `src/components/desk/Office.tsx`: the den (walls, floor, ceiling light, sized from the floor plan in `ROOM`) and desk props.
- `src/components/desk/DogBed.tsx`: the dog bed in the corner right of the desk, with a placeholder dog.
- `public/models/desk.glb`: the IKEA MITTZON 55" desk; `desk-lamp.glb`: the globe lamp (Draco-compressed; decoder in `public/draco`).
- `src/content/pile.ts`: the pile of models behind the sliding door, in the "under construction" area (`src/components/desk/Construction.tsx`).
- `public/models/pile/`: the pile's `.glb` files.
- `public/resume.pdf`, `public/dog.jpg`: add these.

Gotcha: use `DeferredHtml`, not drei's `Html`, for anything placed in the
scene. Plain `Html` can render empty on first load (see the comment in that file).

## Adding a model to the pile

1. Shrink it if it's over ~2 MB:
   `npx @gltf-transform/cli optimize in.glb public/models/pile/name.glb --compress draco --texture-compress webp --texture-size 1024`
   (add `--simplify-ratio 0.1` for very detailed scans).
2. Add an entry to `src/content/pile.ts` with its size in meters and where it sits. Scaling and setting it on the ground are automatic.

## Project demos

The Podcast Recaps tab on the monitor runs the app's real UI on sample data.

- `scripts/sync-demos.mjs` copies `index.html`, `app.js`, and `app.css` from
  `../podcast-recaps/src/ui` into `public/demos/podcast-recaps/`. It runs
  automatically before `npm run dev` and `npm run build`, or by hand with
  `npm run sync:demos`. Commit the copies; Vercel doesn't have the other repo.
- `public/demos/podcast-recaps/demo/mock.js` is the fake backend. It answers
  the UI's `/api/...` calls in the browser. If a UI change calls a new
  endpoint, the sync prints which one; add a matching route to `ROUTES`.
- Don't edit the copied `index.html`, `app.js`, or `app.css` here; edit them in
  podcast-recaps and re-sync.

## Next steps

- Replace placeholder props with real models (`.glb` in `public/models/`, loaded with `useGLTF`; `npx gltfjsx` turns a model into a component).
- Add project screenshots (`image` on each project in `site.ts`).
- Put the dog in the room as a model, not just a photo.

## Deploy

Push to GitHub, import the repo at vercel.com/new, then add your domain under Project → Settings → Domains.
