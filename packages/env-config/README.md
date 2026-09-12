# @repo/env-config

Loads and validates environment variables for the server-side apps. Import it once, at the top
of an app's entry point, before anything that reads config:

```ts
import { ENV } from "@repo/env-config";
```

It reads `.env` at the repo root, then the process environment. Missing required variables
(`DATABASE_URL`, `JWT_SECRET`) throw at boot with the full list, rather than surfacing as an
undefined deep inside a request.

**Not for the browser.** `apps/web` cannot use this — Vite exposes `import.meta.env` with
`VITE_`-prefixed variables instead. See `apps/web/src/app/config.ts`.
