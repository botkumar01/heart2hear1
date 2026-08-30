# Gemini Setup (AI chatbot)

**Status: already configured** — `GEMINI_API_KEY` is already in `web/.env.local` (from a
credential the project owner already had). This doc explains how it's used and how to add it to
Vercel for production, plus how to get your own key if you ever need to rotate it.

- **Service**: Google Gemini API — powers the supportive AI chatbot (`web/api/aiChat.ts`).
- **Website**: https://aistudio.google.com/apikey (Google AI Studio)
- **Cost**: Free tier available; check current limits in AI Studio before heavy use.

## How it's used

`web/api/_lib/gemini.ts` calls the Gemini REST API directly (no SDK dependency) with the guardrail
system prompt from spec §25. `web/api/aiChat.ts` never calls Gemini at all for a message that the
deterministic safety filter (`_lib/safety.ts`) already flags as CRISIS — it returns a fixed safety
response instead, so the model is never in the loop for the highest-risk messages.

## Getting your own key (if you ever need to rotate it)

**WHERE**: Browser → https://aistudio.google.com/apikey

**STEPS**: Sign in with a Google account → **Create API key** → copy it.

## Adding it to Vercel (production)

**WHERE**: Vercel dashboard → project → **Settings → Environment Variables**

Add `GEMINI_API_KEY` with the value from `web/.env.local`, applied to Production (and Preview).
Redeploy for it to take effect.

## Changing the model

`GEMINI_MODEL` (optional env var) overrides the default (`gemini-2.0-flash`) if you want to try a
different Gemini model later — no code change needed.
