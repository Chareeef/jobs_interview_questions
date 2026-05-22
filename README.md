# Interview Question Generator

A small Next.js app that takes a job title and returns 3 thoughtful, role-specific interview questions using Claude.

Built as a technical screen for the Melo Associates Technical Co-Founder / Founding Engineer role.

## Stack

- **Next.js 15** (App Router) — single page + one API route
- **Anthropic Claude Haiku 4.5** — fast, cheap, reliable structured output
- **TypeScript**, plain CSS (no UI framework)
- Deployed on **Vercel**

## How it works

```
app/page.tsx               → form, loading state, results list
app/api/questions/route.ts → POST { jobTitle } → { questions: string[] }
```

The API route calls Claude with a system prompt that asks for exactly 3 questions in a specific structure (behavioral / situational / skill), formatted as strict JSON. The route parses and validates the response before returning it to the client. The API key never leaves the server.

## Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000

## Deploy

Push to GitHub, import to Vercel, set `ANTHROPIC_API_KEY` as an environment variable. That's it.

## Key decisions

- **Claude Haiku 4.5** — I use Claude every day; Haiku 4.5 is the right size/speed/cost for a short structured output like this.
- **Server-side API call** — keeps the API key out of the browser (the brief flagged privacy/security).
- **Strict JSON output + server-side parsing** — treats the model as a structured-output engine, not a chat. Easier to render, easier to validate, fails closed if the model misbehaves.
- **Prompt structure (behavioral / situational / skill)** — three different question types produce a more useful set than three variations on the same theme.

## What I'd improve with more time

- Use Anthropic's native tool-use / structured output instead of prompt-based JSON for stronger guarantees.
- Cache identical job titles to avoid redundant API calls.
- Add a basic rate limit on the API route.
- Light tests around the JSON parser (it has edge cases — code fences, extra prose, etc.).
