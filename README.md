# Prospex

AI-powered B2B sales research agent. Paste a company name, get web-sourced intel, an ICP fit score, detected pain points, a personalized cold email draft — and optionally file it straight into your Notion CRM.

Built with Next.js 14, Claude Sonnet 4.6 (web search), and the Notion API.

## Live demo

<!-- Replace with your Vercel URL after deploy -->
**Deploy URL:** _Add after Vercel deploy — e.g. `https://prospex.vercel.app`_

## Screenshot

<!-- Add a screenshot after recording your demo -->
![Prospex agent console](./docs/screenshot.png)

## How it works

1. **Research** — Claude searches the web for real-time company intel
2. **Analyze** — Scores ICP fit (High / Medium / Low) and detects 3 pain points
3. **Draft** — Writes a personalized cold email referencing researched details
4. **File** — Creates a populated page in your Notion CRM database (optional)

## Quick start

### Prerequisites

- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/)
- Notion integration + CRM database (optional, for Step 4)

### Setup

```bash
git clone https://github.com/Akash8585/Prospex.git
cd Prospex
npm install
cp .env.local.example .env.local
```

Add your Anthropic key to `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo mode

Click **Load demo** to pre-fill ICP and prospect fields (Linear), then **Run research agent**.

## Notion setup

Prospex writes to a Notion database at the end of each run. Setup takes ~5 minutes.

### 1. Create an integration

1. Go to [notion.so/profile/integrations](https://www.notion.so/profile/integrations)
2. Click **New integration** → name it (e.g. "Prospex")
3. Copy the **Internal Integration Secret** (`secret_...`)

### 2. Create a CRM database

Create a new database with these **exact column names**:

| Column | Type | Options |
|---|---|---|
| Name | Title | — |
| Status | Select | `Researched` |
| Industry | Text | — |
| Company size | Text | — |
| ICP fit | Select | `High`, `Medium`, `Low` |
| Research summary | Text | — |

### 3. Share the database with your integration

1. Open the database in Notion
2. Click **···** (top right) → **Add connections**
3. Select your Prospex integration

### 4. Get the database ID

Open the database in the browser. The URL looks like:

```
https://www.notion.so/workspace/DATABASE_ID?v=...
```

Copy the 32-character `DATABASE_ID` from the URL.

### 5. Paste credentials in the app

Enter the integration token and database ID in the **Notion CRM** card, then run a prospect.

### Notion template (optional)

<!-- Replace with your shareable Notion template link -->
**Template link:** _Add your public Notion template URL here_

Duplicate the template into your workspace, connect your integration, and use that database ID.

## Environment variables

| Variable | Where | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` (server-side only) | Yes |
| Notion token | Browser input → sent to `/api/notion` | No (skips Notion write if blank) |
| Notion database ID | Browser input → sent to `/api/notion` | No |

The Anthropic key never reaches the browser. Notion credentials are sent per-request and not stored server-side.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy

```bash
npm run build   # verify locally first
```

Notion credentials are entered by each user in the UI — no extra Vercel env vars needed.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| AI | Claude Sonnet 4.6 via Anthropic API |
| Web search | Claude `web_search_20250305` tool |
| CRM | Notion API v1 |
| Deployment | Vercel |

## Project structure

```
app/
  page.tsx              # Agent console (single UI route)
  api/research/route.ts # Step 1 — web research
  api/analyze/route.ts  # Step 2 — ICP scoring
  api/draft/route.ts    # Step 3 — email draft
  api/notion/route.ts   # Step 4 — Notion write
components/             # UI cards, status bar, results panel
lib/                    # Shared types and demo data
```

## Demo checklist

Before submitting your challenge demo:

- [ ] Load demo → Run against **Linear** or **Razorpay**
- [ ] Confirm intel, fit score, pain points, and email draft appear
- [ ] Confirm Notion page is created with all properties populated
- [ ] Record a walkthrough under 3 minutes

## License

MIT
