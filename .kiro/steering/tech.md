---
inclusion: always
---

# Tech

- TypeScript (strict) + Vite. No UI framework. Node >= 22.
- PWA via `vite-plugin-pwa` (Workbox, `injectManifest`). Service worker: `src/sw.ts`.
- Tests: Vitest (unit), Playwright + Chromium (e2e).
- Deploy: GitHub Actions publishes to the `gh-pages` branch. PRs get a preview under `/pr-preview/pr-<n>/`.

## Language

- All code, identifiers, comments, commit messages, tests and docs (`README.md`, `AGENTS.md`, steering) are in **English**.
- The UI is available in **English and German** (`src/i18n.ts`). Song titles and lyrics are not translated.
- Every user-visible string goes through `t()` or a `data-i18n*` attribute; add each new key to both languages.
- Tests that check UI text run with the `de-DE` locale (see the Playwright configs); `tests/e2e/i18n.spec.ts` overrides it.
- Reply to the user in the language they write in.

## Commands

```bash
npm run dev               # dev server: http://localhost:5173/Glockenspiel/
npm run check             # type-check, lint, format check, unit tests
npm run test:e2e          # production build + Playwright
npm run test:e2e:preview  # gh-pages layout, live site + PR preview
npm run build
npm run format
```

## Working rules

- Do not commit or push unless the user asks.
- Before any push, run `npm run check && npm run test:e2e && npm run test:e2e:preview`.
- Never rewrite git history or force-push without an explicit request.
- Preferred flow: feature branch, PR, try the preview, merge.
- Stop dev and preview servers when done.
- Keep the service worker out of `dev`; it is only active in the production build.
