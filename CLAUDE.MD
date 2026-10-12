# Project: World Event Alerts (take-home)

Users create alert rules and get notified by email or Slack when matching
real-world events occur. Includes an admin view.

## Stack

- Next.js (App Router) + TypeScript, single app
- SQLite via Prisma
- nodemailer for email, Slack incoming webhooks for Slack
- Data source: USGS earthquake feed (more sources later via adapters)

## How to work with me

- Don't write code unless I ask. When planning, propose options and trade-offs.
- Make small, focused changes. One concern per change.
- Follow existing patterns in the codebase. Before creating a new file or
  abstraction, check if something similar already exists and reuse it.
- Don't add new dependencies without asking me first and saying why.
- Never invent API endpoints, response fields or library functions. If you're
  not sure something exists, say so explicitly.
- Never hardcode secrets. Use .env and keep .env.example updated.
- Before saying something works, run the typecheck and relevant tests and
  show me the output.
- State any assumptions you make at the end of your answer.

## Architecture rules

- Pipeline: Source → Event → Rule matcher → Dispatcher → Channel → Delivery log
- Channels implement a shared interface and are looked up from a registry.
  Never branch on channel type (no `if (channel === "slack")`).
- Events are deduplicated by source + external ID.

## Don't touch

- docs/DECISIONS.md, docs/AI_REVIEW_LOG.md and prompts/ are written by me.
  Don't edit them.
