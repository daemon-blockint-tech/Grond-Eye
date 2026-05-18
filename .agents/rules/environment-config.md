# Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | JWT signing secret (generate with `openssl rand -hex 32`) |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | No | Cesium Ion access token |
| `EARTHENGINE_SERVICE_ACCOUNT_JSON` | No | Inline GCP service account JSON for Earth Engine basemap proxy |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Path to GCP service account key file (local dev alternative) |
| `EARTHENGINE_PROJECT` | No | GCP project id for `ee.initialize` (defaults from SA JSON) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Google 3D Tiles |
| `NEXT_PUBLIC_WWV_EDITION` | No | `local` / `cloud` / `demo` (default: `local`) |
| `NEXT_PUBLIC_WWV_PLUGIN_DATA_ENGINE_URL` | No | Override engine WebSocket URL (default: cloud) |
| `OPENSKY_CREDENTIALS` | No | Comma-separated `id:secret` pairs for credential rotation |
| `WWV_BRIDGE_TOKEN` | No | Shared secret for marketplace → WWV install bridge |
| `WWV_DEMO_ADMIN_SECRET` | No | Demo edition admin password |
| `IRANWARLIVE_BACKEND_URL` | No | Override for IranWarLive custom backend URL |
| `SUPABASE_PREFER_LOCAL` | No | When `true` (default in `local` edition / dev), use `http://127.0.0.1:54421` and local demo keys |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase API URL (local `54321` or hosted project) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (server only) |
| `SUPABASE_DATABASE_URL` | No | Direct Postgres URL (e.g. local Supabase DB on `54322`) |

### Local Supabase (preferred for development)

1. `pnpm supabase:start` — starts the local stack from `supabase/config.toml`
2. Copy the Supabase block from `.env.example` into `.env.local`
3. Optional: point `DATABASE_URL` at `postgresql://postgres:postgres@127.0.0.1:54422/postgres` so Prisma shares the same DB as Supabase Auth
4. Set `SUPABASE_PREFER_LOCAL=false` only when you intentionally want a hosted Supabase project

Secrets go in `.env.local` (gitignored). Non-secrets go in `.env` (committed).
