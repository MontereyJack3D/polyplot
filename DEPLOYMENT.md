# Deployment Guide

## Required Environment Variables (set in Vercel Dashboard)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | `eyJ...` |
| `NEXTAUTH_URL` | Auth callback base URL | `https://polyplot-web.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth secret | `openssl rand -base64 32` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project id | `...` |
| `NEXT_PUBLIC_ALCHEMY_ID` | Alchemy API key | `...` |
| `NFT_CONTRACT_ADDRESS` | Access NFT contract address | `0xbad6...f731` |
| `INNGEST_EVENT_KEY` | Inngest event key | `...` |
| `INNGEST_SIGNING_KEY` | Inngest signing key | `signkey-...` |
| `NEXT_PUBLIC_APP_URL` | Production URL | `https://polyplot.io` |

## Deployment Steps

1. Push to main branch -> Vercel auto-deploys
2. Run database migrations: `npx supabase db push --linked`
3. Verify Inngest functions are registered at `https://polyplot.io/api/inngest`
4. Seed data if first deploy: `npx supabase db seed --linked`
5. Verify wallet login and NFT gate at `/app/dashboard`
