# Alerts System

A take-home exercise: users set up alerts and get notified by email or Slack when something important happens in the world. Channels can be extended, and there is an admin view.

The main deliverable is the plan and the documented decisions. The code is a small vertical slice: natural-disaster alerts, with earthquakes coming from the real USGS public feeds and other disaster types simulated.

## Docs

- [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md): every ambiguity in the brief, with options, trade-offs, impact and status.
- [docs/DECISIONS.md](docs/DECISIONS.md): the numbered decision log.
- [docs/PLAN.md](docs/PLAN.md): scope, features, data model, flow, channel design, risks and time budget.

## How the decisions were made

1. I listed every ambiguity in the brief, grouped by area.
2. I worked through them area by area, choosing between explicit options.
3. I recorded each choice in the decision log with its trade-off.
4. The plan only describes things that are in the decision log. Anything undecided is marked as Open.

## Running locally

_To be written once the slice exists (Next.js + Prisma/SQLite app, a worker process and a local email catcher)._

## Demo

_A link to the demo video will go here._
