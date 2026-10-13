# Alerts System

A take-home exercise: users set up alerts and get notified by email or Slack when something important happens in the world. Channels can be extended, and there is an admin view.

The main deliverable is the plan and the documented decisions. The code is a small vertical slice: natural-disaster alerts, with earthquakes coming from the real USGS public feeds and other disaster types simulated.

## How I approached it

The brief was deliberately vague, so I treated the first job as turning ambiguity into decisions, before writing any code.

**1. Interrogate the brief.** I asked Claude to list every open question, with options and trade-offs, but not to decide anything. I made each decision myself and recorded it in [DECISIONS.md](docs/DECISIONS.md).

**2. Notice when it was too much.** That produced over 50 decisions and a design far too big for the time available. Instead of trying to build it all, I cut scope: several decisions (a delivery queue and worker, automatic retries, event revisions, category management) moved to
"designed but not built". I kept the designs, because they show where the system would go next.

**3. Design one small slice.** I wrote [DESIGN.md](docs/DESIGN.md) for just that slice: one real source (USGS earthquakes), email via a local mail catcher, a mocked Slack channel shaped like a real webhook, and an admin view. I asked the AI to list conflicts between my decisions rather than resolve them; it found 7, and I resolved them myself.

**4. Set standing rules.** I wrote a [CLAUDE.md](CLAUDE.md) so the AI followed the same rules in every session: follow existing patterns, don't invent APIs, ask before adding dependencies, and don't touch my decision and review logs.

**5. Build in small, checked steps.** Each prompt built one piece, and I didn't commit until I had checked it against something real: the live USGS feed, the database, the Mailpit inbox, or the numbers worked out by hand. That checking caught several real bugs (see "How I checked the
AI's work").

**6. Use a second opinion.** I used a separate Claude chat for planning and to review the AI's output. I treated those reviews critically too: one of its claims turned out to be wrong when I checked my prompt history.

# Planning and review chat (summary)

Alongside Claude in VS Code, I used a separate Claude chat as a planning
partner and second-opinion reviewer. The transcript isn't included,
because it mixes in personal conversation unrelated to the work. This is
what it was used for:

- **Planning:** the timeline, and what to cut to fit the deadline
  (one source, no worker, no auth).
- **Stack:** discussed FastAPI vs Next.js; I chose Next.js (decision #1).
- **Prompt drafting:** first drafts of prompts 01–07 and of CLAUDE.md,
  which I adapted before sending them in VS Code.
- **Design review:** flagged 5 issues in DESIGN.md (channel type union,
  rule deletion behaviour, stuck pending deliveries, unverified USGS
  fields, Prisma SQLite support).
- **Output review:** suggested checks for the VS Code results (running
  ingestion twice, testing with Mailpit off, comparing an email with
  the USGS site).
- **Docs:** helped structure the README and drafted "How I approached it",
  which I edited.

One of its review claims was wrong (that the AI had ignored an
instruction); I checked my prompt history and rejected it.

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

1. `npm install`
2. `brew install mailpit` and run `mailpit` in a separate terminal (inbox: http://localhost:8025)
3. `cp .env.example .env`
4. `npx prisma migrate dev` and `npx prisma db seed`
5. `npm run dev`, then open / (user view) and /admin
   Typecheck on a clean checkout: `npx next typegen` first.

## Demo

Steps + screenshots: switch user → create rule → admin: run ingestion → inject simulated event → see delivery → Mailpit → retry a failure.

## What works / what's simulated / what's cut

**Works (real):**

- Ingestion from the live USGS "past day" earthquake feed, triggered from the admin page (or `POST /api/ingest`). Only `type = earthquake` is ingested; explosions and quarry blasts are filtered out.
- Deduplication by (source, externalId): running ingestion twice creates no new events or deliveries.
- Rule matching: magnitude ≥ the rule's threshold.
- Email delivery via nodemailer to a local Mailpit inbox.
- A delivery log with status, attempts and the last error. A failed delivery never stops the run.
- Manual retry of failed deliveries (same row, attempts +1).
- Admin view: summary counts, run ingestion, inject a simulated event, and tables of events, rules (Slack webhook URLs masked) and deliveries.
- User view: switch user, create and delete rules. Each channel's config is validated by its own adapter. Deleting a rule deletes its deliveries.

**Simulated:**

- **Slack:** the adapter validates a webhook-shaped config and logs the message, but doesn't call Slack.
- **Injected events:** earthquakes with a chosen magnitude, labelled [SIMULATED], going through normal matching.
- **Users:** seeded, with a dropdown instead of auth. The admin view is unprotected.
- **Email:** real SMTP, but only to a local inbox.

**Cut (designed but not built, see DESIGN.md):**

- A background worker, scheduled polling and a delivery queue
- Automatic retries with backoff
- Updating events when USGS revises them
- Category and user management in the admin view
- Other disaster types, news and markets sources
- Frequency controls (cooldowns, digests), time zones, unsubscribe
- A demo video (screenshots instead)

## Adding a new channel

Channels are plugins. Each one is an adapter in `lib/channels/` that
implements one interface:

- `type` and `label`: its identifier and display name
- `configFields`: the fields the user fills in (e.g. `to`, `webhookUrl`)
- `validateConfig()`: checks a rule's config before saving and before sending
- `send()`: delivers the message and returns success or an error
- `describeConfig()`: how the config is shown in the admin view, with secrets masked

To add a channel, e.g. Microsoft Teams or a generic webhook:

1. Write one adapter file in `lib/channels/`.
2. Register it in the channel registry.

Nothing else changes. Rules store `channelType` plus a JSON config, so there's no schema change. The dispatcher looks adapters up in the registry, and the rule form renders the adapter's own `configFields`. Nowhere in the code branches on channel type.

**Limits:** due to time, this hasn't been demonstrated with a third channel. All channels send the same plain-text message, and a new channel needs a code deploy, not just configuration.

## How I checked the AI's work

I didn't accept "it works" from the AI. Each step was checked against something real before I committed it. Full details are in [AI_REVIEW_LOG.md](docs/AI_REVIEW_LOG.md); the most important checks:

- **Failure path testing found a real bug.** With Mailpit switched off, emails were recorded as "sent". The cause: nodemailer rejects with an empty error message, and the dispatcher treated an empty string as "no error". It was fixed, and re-tested with Mailpit off (failed, with an error) and on (retry succeeded).
- **Real data versus the design.** Inspecting the live USGS feed showed it also contains explosions and quarry blasts, which the design assumed away. I added a type filter (decision #54).
- **Dedup proven:** running ingestion twice gave 0 new events and 0 new deliveries the second time.
- **Numbers reconciled by hand:** the sent counts added up across test runs (72 − 6 deleted + 1 re-sent = 67), and injected events matched exactly the rules I expected (M 6.5 → 3 rules, M 7.2 → 4 rules).
- **Testing the validation myself:** a Slack rule with `https://google.com` was accepted (see Known issues).
- **AI self-corrections I verified:** an empty magnitude field was accepted as 0, and React 19's form reset submitted the wrong channel. The AI found and fixed both; I re-tested each in the browser.
- **Scope:** the first brief analysis produced 50+ decisions, too much for the timebox. I cut scope instead of building it all.
- **Not blindly fixing warnings:** npm audit issues are in Prisma's dev tooling only, and the suggested "fix" would have downgraded Prisma. Accepted and documented.
- **Agent side effects:** while testing, the agent sent requests to a different local app on port 3000. No harm done, but noted as a risk.
- **Reviewing the reviewer:** a second-opinion review claimed the AI had ignored one of my instructions. I checked my prompt history; it hadn't, so I rejected the claim.

## Known issues

- **Alert flooding:** every match sends immediately. In testing, one user with a "magnitude ≥ 2.5" rule got 70 emails from one day's feed.
- **Duplicate rules are allowed,** so one user can get the same alert twice on the same channel.
- **The Slack config check is weak:** any `https://` URL is accepted, not just `hooks.slack.com`. That's harmless while Slack is mocked, but a real adapter would POST to whatever URL a user enters.
- **Stuck deliveries:** a delivery left `pending` (e.g. after a crash) can't be retried; retry only works on `failed`.
- **No auth:** anyone can switch to any user, including the admin. Email destinations aren't verified, so a user could send alerts to someone else's address.
- **Secrets in plain text:** channel config (including webhook URLs) is stored unencrypted in the database.
- The ingestion summary's "skipped" count combines duplicates, non-earthquakes and invalid features.
- **No automated tests:** checks were manual, in the browser, the database and Mailpit.
- **Setup quirks:** `npx next typegen` is needed before `tsc` on a clean checkout; re-running the seed clears the delivery log; Mailpit keeps its inbox in memory only.
- **Dependencies:** npm audit reports high-severity issues in Prisma's dev tooling (accepted), and nodemailer 10.1.0 was only days old when installed (pinned).

## What I'd do next

In priority order:

1. **Alert flooding:** per-user cooldowns or digests, and preventing duplicate rules. This is the biggest real-world problem testing showed.
2. **Automated tests** for matching, dedup and the dispatcher's failure handling, the parts where bugs were actually found.
3. **Background processing:** a worker with scheduled polling, a delivery queue, and automatic retries with backoff (already designed).
4. **Real Slack:** a webhook POST, with only `hooks.slack.com` URLs allowed.
5. **Auth and roles,** a protected admin view, and verified email destinations.
6. **Event revisions:** update events when USGS revises them, and notify rules that newly match.
7. **More sources:** other disaster types, then news and markets. These don't come with a severity, so they need a way to derive one.
8. **Personal relevance:** location and radius, and watchlists.
9. **Production email:** unsubscribe links, a real provider, and encrypted channel config.
