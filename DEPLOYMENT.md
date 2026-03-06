# Deployment Guide

## Required Environment Variables (set in Vercel Dashboard)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | `eyJ...` |
| `INNGEST_EVENT_KEY` | Inngest event key | `...` |
| `INNGEST_SIGNING_KEY` | Inngest signing key | `signkey-...` |
| `NEXT_PUBLIC_APP_URL` | Production URL | `https://polyplot.io` |

## Deployment Steps

1. Push to main branch -> Vercel auto-deploys
2. Run database migrations: `npx supabase db push --linked`
3. Verify Inngest functions are registered at `https://polyplot.io/api/inngest`
4. Seed data if first deploy: `npx supabase db seed --linked`
5. Create initial access codes via Supabase SQL editor

## Creating Access Codes

```sql
INSERT INTO access_codes (code_hash, access_duration_days, is_single_use)
VALUES (encode(sha256('YOUR-CODE-HERE'), 'hex'), NULL, false);
```
