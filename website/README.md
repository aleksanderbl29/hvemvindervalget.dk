## kommunalvalg2025 frontend

Dashboard frontend for `api.hvemvindervalget.dk`, built with the Next.js App Router, TypeScript, Tailwind CSS, and PNPM.

## Requirements

- Node `v20.18.0` (`nvm use` reads `.nvmrc`)
- PNPM `^10`
- API access to `https://api.hvemvindervalget.dk`

## Setup

```bash
cp env.example .env.local   # populate API + feature flags
pnpm install
pnpm dev                    # http://localhost:3000
```

## Scripts

| Command        | Description                           |
| -------------- | ------------------------------------- |
| `pnpm dev`     | Start Next dev server                 |
| `pnpm build`   | Production build                      |
| `pnpm start`   | Run the compiled server               |
| `pnpm lint`    | Run `next lint`                       |
| `pnpm typecheck` | Run TypeScript in `--noEmit` mode   |

## Environment variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `NEXT_PUBLIC_API_BASE_URL` | Root API endpoint | `https://api.hvemvindervalget.dk` |
| `NEXT_PUBLIC_USE_STUB_DATA` | Toggle mock payloads locally | `true` |
| `NEXT_PUBLIC_CHART_LIBRARY` | Preferred charting engine (`recharts`, `echarts`, `chartjs`, `vega-lite`) | `recharts` |

Set these in `.env.local`. Only `NEXT_PUBLIC_*` variables are exposed to the browser.

## Project layout

- `src/app` – App Router routes, grouped under `(dashboard)` for the main experience plus detail routes for municipalities, polls, and scenarios.
- `src/lib` – Environment validation, API utilities, mock data, and telemetry helpers.
- `src/components` – Layout primitives, widgets, and chart shells ready for Recharts integration.

## Charting strategy

- Recharts is the primary charting library, providing server-renderable charts for static generation.
- Charts are defined using a `ChartSummary` payload with `chartData` in Recharts format.
- Apache ECharts, Chart.js, and Vega-Lite are marked as **planned** engines; switch between them by setting `NEXT_PUBLIC_CHART_LIBRARY` once their adapters land.
- `src/lib/charts/registry.ts` documents trade-offs plus readiness state so product/design can pick the right engine without spelunking the codebase.

## Observability & performance hooks

- Telemetry helpers are disabled and only expose dev-console messages that confirm nothing is emitted.
- `instrumentation.ts` remains as the extension point for future tracing but currently only reports stub/telemetry status in dev.
- React Query is configured for client-side cache hydration when we introduce interactive widgets.

## Deployment

- **Serverless**: Deploy the `frontend/` directory directly to Vercel/Netlify/Fly.io.
- **Containers**: Build using `pnpm install --frozen-lockfile && pnpm build` and run `pnpm start`.

Add CDN caching in front of `/public` assets and use edge caching for API proxy routes when the backend is ready.
