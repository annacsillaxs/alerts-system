# Plan

Build plan for the alerts vertical slice. Every point refers to a numbered entry in [DECISIONS.md](DECISIONS.md). Anything not decided yet is listed under **Open** at the end.

## Goal

Show the plan, features and decisions. Keep the code minimal and focused on one working slice (#2). Deliver the repo, these docs and a demo video of a local run (#4, #25).

## Scope

**In the slice**
- One category group, natural disasters (#13), modelled as a flat list of disaster-type categories (#52).
- Earthquakes come from the real USGS public feeds (#11). Other disaster types are simulated (#13, #41).
- Seeded users and a "switch user" control. No real auth (#14).
- Personal rules: category + "metric ≥ threshold" + one channel (#15, #18, #19, #53). Users can create and delete rules (#49).
- Email through an SMTP library to a local email catcher (#33). Slack is mocked (#34).
- An admin view (#40–#43).

**Deferred or out of scope (to be documented as future work)**
- News and markets categories (#10, #31). Personal context such as location or watchlists (#8).
- Frequency controls (#20), time zones (#51), backfill (#51), data retention (#51).
- Teams and workspaces (#19). A real Slack integration (#34). Destination verification (#38). Unsubscribe and compliance (#39).
- Real auth (#14), encryption at rest (#45), in-code security hardening (#46).
- AI enrichment (#31). Deployment (#25).

## Features

**User side** (#14, #18, #49)
- Switch between seeded users.
- List my rules.
- Create a rule: choose a category, enter a threshold (≥) for that category's metric, choose a channel type (email or Slack) and enter the destination (an email address, or a Slack webhook URL that is mocked).
- Delete a rule.

**Admin side** (users with the admin role, #16, #40–#43)
- Summary counts: users, active rules, deliveries sent and failed (#42).
- Users and their rules, with webhook URLs masked (#40, #43).
- Create, edit and delete categories. Each category is bound to a metric type that exists in code (#7, #9, #52).
- A "run ingestion now" button (#12).
- "Inject simulated event", which goes through normal matching (#41).
- Failed deliveries, with a manual retry (#27).

**Background worker** (#21)
- Polls USGS about every 5 minutes (#30).
- Sends pending deliveries and retries failures with backoff (#23, #27).

## Data model (sketch)

| Entity | Key fields | Decisions |
|---|---|---|
| User | name, email, role (user/admin) | #14, #16 |
| Category | name (= disaster type), metricType (key of a metric implemented in code) | #7, #9, #17, #52 |
| Event | source, externalId, **unique(source, externalId)**, category, title, occurredAt, sourceUrl, metrics (JSON), simulated flag, updatedAt | #22, #26, #29, #41, #50 |
| Rule | user, category, threshold (≥), channelType, channelConfig (JSON) | #15, #18, #36, #53 |
| Delivery | event, rule, **unique(event, rule)**, status (pending/sent/failed), attempts, nextAttemptAt, lastError, sentAt | #23, #24, #27, #28, #48 |

## Flow

1. **Ingest.** The worker runs every ~5 minutes, or an admin presses "run ingestion now". Both call the same function (#12, #21, #30).
   1. Fetch the USGS feed and turn each item into an Event (#11, #22).
   2. Save it using (source, externalId) as the key: new items are inserted and existing ones updated (#26, #29).
   3. Simulated events injected by an admin start at step 2 (#41).
2. **Match.** This runs for each Event that was inserted or updated.
   1. Find every rule for the event's category where the metric is ≥ the rule's threshold (#53).
   2. Create a pending Delivery for each one, unless one already exists for that event and rule (#24, #28).
   3. Because of that check, a revision only notifies rules it newly matches (#29).
3. **Deliver.** The worker picks up pending deliveries whose time has come (#23).
   1. It looks up the channel adapter for the rule's channel type and sends a plain-text message that includes the source link (#32, #35, #50).
   2. On success the delivery is marked sent. On failure it records the error, increases the attempt count and schedules the next try with backoff.
   3. Once retries are used up the delivery is marked failed and appears in the admin view for a manual retry (#27).
4. **Observe.** Delivery rows show the state of every alert. The worker prints its progress to the console (#48).

## Channel extensibility (#35, #36)

- Every channel implements one adapter interface: a type key, a function that validates its own config, and a send function that takes a message and a config.
- A registry maps channel types to adapters. Adding a channel means writing one adapter and registering it. No schema change is needed because the config is stored as JSON.
- **Email adapter:** sends through SMTP to a local catcher (#33).
- **Slack adapter:** a mock. Its config has the same shape as an incoming webhook URL, so a real HTTP POST can replace it later (#34, #37).

## Docs still to write (part of the deliverable)

- **Scaling notes**: what changes at about 10k users or high event volume (#44).
- **Security section**: no real auth, the admin view is effectively open in the demo, configs are stored in plain text, destinations aren't verified, and the SSRF risk once Slack is real (#16, #38, #45, #46).
- **Test strategy**: what would be tested and how, with a few tests in the code (#47).
- **Future work**: everything in the deferred list above.
- **README**: how to run locally and a link to the demo video (#25).

## Risks and things to check

- ❓ Check whether Prisma supports `Json` fields on SQLite in the installed version. If not, store the JSON as a string (#22, #36).
- ⚠ SQLite allows only one writer at a time. The Next.js app and the worker share one database file, so they may hit "database is busy" errors under concurrent writes.
- The USGS feed could be down or quiet while you record the demo. Injecting a simulated event covers that (#41).
- ❓ Confirm the USGS feed's ID, magnitude and URL fields when you build ingestion (#26).
- Overlapping rules can send duplicate alerts to the same destination (#28). This is a known, documented limitation.

## Rough time budget

This is an estimate, not a decision, so adjust it as you see fit.

| Work | Hours |
|---|---|
| Docs: decisions, plan, scaling, security, test strategy, README | ~2.5 |
| Schema, seed data, USGS ingestion and normalisation | ~1.5 |
| Matching, delivery queue, worker, retries | ~1.5 |
| Channel adapters (email + Slack mock) | ~0.5 |
| User UI (switch user, rules list, create, delete) | ~1 |
| Admin view | ~1.5 |
| Demo video and buffer | ~1 |

## Open

- Which disaster types are simulated besides earthquakes, and what metric each one uses (#13, #17)?
- Retry parameters: the maximum number of attempts and the backoff schedule (#27).
- Which seeded users exist (names, and which one is the admin) (#14, #16)?
