# ClipFlow Handoff — PR #15

**Date:** 2026-10-25
**Branch:** `reconcile/ai-studio-stock`
**PR:** https://github.com/digitalkingbeat-a11y/clip/pull/15
**Fix commit:** `bfcf425` — Fix billing margin reporting and social platform type (pushed)

## What was fixed

1. **Billing profitability test**
   - `server/billing.ts`: per-plan `grossMarginPercent` now reports plan unit economics
     (`(priceMonthly - perUserCost) / priceMonthly`) instead of `0` when a plan has no
     current subscribers.
   - Dollar fields (`revenue`, `estimatedCost`, `grossMarginUsd`) still reflect actual
     subscribers, so no billing/credit enforcement was relaxed.
   - Creator margin on the current cost model is **87.6%**.

2. **SocialAccountsView type error**
   - Removed the impossible `acc.platform === "meta"` comparison in
     `src/components/SocialAccountsView.tsx`.
   - `SocialPlatform` is `youtube | tiktok | instagram | facebook | linkedin | x`; Meta
     advertising is a separate paid-ads surface in the same view, and the server never
     creates an organic `meta` account. This is a real type correction, not a cast or a
     disabled check.

## Verification (this machine)

| Check | Result |
|---|---|
| `npm run test:billing` | **9/9 pass** |
| `npx tsx server/test_stock.ts` | **all pass** (Pexels + Pixabay mocked, real ffmpeg) |
| `npx tsx server/test_stripe.ts` | **all pass** (Stripe mocked) |
| `npx tsx server/test_runninghub.ts` | **all pass** (RunningHub + Veo mocked, fresh storage) |
| `npm run build` | **pass** — Vite 2331 modules + PWA, esbuild `dist/server.cjs` |
| `PORT=3105 node dist/server.cjs` + `/api/health` | **pass** — `status: ok`; FFmpeg 6.1.1 READY |
| `tsc --noEmit` | changed files clean; **3 errors remain in unrelated local WIP** (see below) |

No paid video provider was called. All paid-provider suites use fetch-level mocks.

### Type-check caveat

The full project type-check completes, but exits non-zero on files that are **not part of
this PR** and were deliberately preserved:

- `src/components/Sidebar.tsx` — duplicate `isAdmin` property declaration
- `src/components/AIClipsWorkflow.tsx` — untracked WIP importing missing
  `SAMPLE_VIDEOS` from `../mockData`

`SocialAccountsView.tsx` no longer appears in the type-check output.

## Unrelated local changes preserved (not committed)

- Modified: `server/auth.ts`, `src/components/Sidebar.tsx`
- Untracked: `README.md`, `package-lock.json`, `src/components/AIClipsWorkflow.tsx`

## Environment notes

- C: was down to **38.8 MB free**; it is still tight (~249 MB free).
- `node_modules` is a local junction to `F:\clipflow-verify\node_modules` (same
  `package.json`), because C: cannot hold a fresh install.
- The Codex runtime cache was moved to `F:\cache\codex-runtimes` with a junction at the
  original path to create pagefile headroom.
- The server needed ~3 minutes to bind under memory pressure (0 MB free RAM); this is
  environmental, not an application error.
- The RunningHub suite hardcodes `/tmp`; on Windows it must run from a drive where
  `<drive>:\tmp` exists, with fresh storage (it de-duplicates jobs by `userId + shotId`).

## Remaining blockers / next steps

1. Full `tsc --noEmit` remains blocked by the unrelated WIP files above. Resolve those in
   a separate change before requiring a clean type-check gate.
2. C: disk space is still critically low; reclaim space or continue using the F: junction
   setup before the next build/install.
3. PR #15 is **not merged and not deployed**; it is ready for review.
4. Follow-up: make `server/test_runninghub.ts` use `os.tmpdir()` so it runs on any drive.
