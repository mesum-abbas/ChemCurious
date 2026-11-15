# ChemBot — AI Chemistry Tutor

A floating chat assistant on every student page (hidden on `/admin`). The browser talks only to
`POST /api/chat`; that route calls **Google Gemini first** and silently **fails over to Groq**.
API keys never leave the server.

## Setup

1. Create `.env.local` in the project root (it is gitignored) and add:

   ```bash
   GEMINI_API_KEY=your-google-ai-studio-key
   GROQ_API_KEY=your-groq-key
   # optional — defaults shown
   GEMINI_MODEL=gemini-3.5-flash-lite
   GROQ_MODEL=openai/gpt-oss-20b
   CHAT_TIMEOUT_MS=15000
   ```

2. Restart `npm run dev`.
3. **Production:** add the same variables in your host's environment settings (e.g. Vercel → Project →
   Settings → Environment Variables) and redeploy. Never use a `NEXT_PUBLIC_` prefix for these.

One key is enough: if only `GROQ_API_KEY` is set, ChemBot uses Groq directly (and vice versa).

## How failover works

```
browser ──► /api/chat ──► validate + rate-limit ──► Gemini ──ok──► reply (provider: "Gemini")
                                                       │ fails
                                                       ▼
                                                     Groq ──ok──► reply (provider: "Groq")
                                                       │ fails
                                                       ▼
                                          503 "Chemistry AI is temporarily busy…"
```

Gemini counts as failed on any non-2xx (429 quota, 5xx, 400/401/403/404), network error, timeout
(`CHAT_TIMEOUT_MS`), or an empty / safety-blocked answer. After a Gemini **429**, Gemini is skipped for
30 s (or its `Retry-After`) so students don't wait for it twice. Server logs show only
`[chat] gemini failed { status, reason }` — never keys, response bodies or student messages.

Code: `app/api/chat/route.ts` → `lib/chat/handler.ts` → `lib/chat/providers.ts`.

## Changing models

Set `GEMINI_MODEL` / `GROQ_MODEL` and restart. No code change needed. To see what your keys can use:

- Gemini: `GET https://generativelanguage.googleapis.com/v1beta/models` with header `x-goog-api-key: <key>`
- Groq: `GET https://api.groq.com/openai/v1/models` with header `Authorization: Bearer <key>`

Verified on 15 Nov 2026: `gemini-3.5-flash-lite` available; on Groq `llama-3.3-70b-versatile` and
`llama-3.1-8b-instant` were **not** offered, so the default is `openai/gpt-oss-20b` (a reasoning model;
the code sends `reasoning_effort: "low"` and hides its reasoning — only for `gpt-oss` models).

## Limits

| Limit | Value |
|---|---|
| Requests per IP | 12 / minute and 100 / hour (HTTP 429 + `Retry-After`) |
| Message length | 1000 chars in the UI, 1500 enforced by the server |
| History sent | last 12 messages, max 8000 chars total, body ≤ 32 KB |
| Reply | ~700 output tokens, capped at 4000 chars |

The rate limiter is in memory **per server instance** (resets on restart, not shared across serverless
instances). For strict global limits use a shared store such as Redis/Upstash.

Chats are saved in the student's browser (`localStorage`, key `chembot:v1:<userId|guest>`), at most
40 messages, for 30 days. Nothing is stored in the database.

## Privacy

Student messages (plus the recent conversation) are sent to **Google** (Gemini) and, on failover,
**Groq** to generate answers. The UI tells students not to share personal information. Free-tier
API usage may be used by providers to improve their services — check their terms before production.

## Troubleshooting

| Symptom (server log) | Cause / fix |
|---|---|
| `gemini failed { status: 401 }` or `403` | Invalid / restricted key — regenerate it in Google AI Studio |
| `gemini failed { status: 404 }` | Wrong model name — check `GEMINI_MODEL` against the models list |
| `gemini failed { status: 429 }` | Free-tier quota hit — Groq takes over automatically |
| `groq failed { status: 400 }` | Model doesn't accept a parameter / was retired — check `GROQ_MODEL` |
| `chat is not configured` | Neither key is set — add them to `.env.local` and restart |
| Every reply says "temporarily busy" | Both providers failing — check the two lines above in the log |

**Test the failover:** set `GEMINI_API_KEY=invalid` in `.env.local`, restart, ask a question — the
response JSON shows `"provider": "Groq"`.

## Security reminder

If a key was ever pasted into a chat, an issue, a screenshot or a commit, **regenerate it** in
Google AI Studio / the Groq console and update `.env.local` and your host. Keys in `.env.local` are
gitignored; `.env.example` contains names only.

## Tests

```bash
npx tsx scripts/test-chat.ts
```

Covers failover (mocked `fetch`), validation, rate limiting, the safe formatter and the route handler.
