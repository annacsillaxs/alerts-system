## Prompt:

I've been given this product brief for a take-home exercise, exactly as written:

"We want users to be able to set up alerts so they get notified when
something important happens in the world — like breaking news, market
movements, natural disasters, that kind of thing. Should work for both email
and Slack. Make it flexible enough that we can add more channels later.
We need an admin view too."

Context:

- I'm working solo with roughly 8-10 hours of build time.
- I plan to use Next.js (App Router) + TypeScript with SQLite via Prisma, in a single app.
- The goal is a small working vertical slice plus clear documentation of my decisions.

Don't write any code yet, and don't make decisions for me.

Please list every ambiguity or open question in this brief, grouped by area
(e.g. what "important" means, data sources, event detection, users and rules,
notification delivery, channels, admin view, non-functional concerns).

For each one, give:

1. The question
2. 2–3 realistic options
3. The main trade-off between them
4. How much it matters for an 8-10-hour build (high/medium/low)

Mark clearly anything you're assuming or unsure about, and don't name any
external APIs or libraries unless you're confident they exist and are free to use.

## Response:

# Open questions in the alerts brief

These are the ambiguities in the brief, grouped by area. Each item gives the question, the options, the main trade-off and how much it matters for an 8–10 hour build. I haven't made any decisions for you.

**Markers:** ⚠ = an assumption I'm making · ❓ = something I'm unsure about and you should check

---

## 0. The exercise itself

**0.1 What will the evaluators value most?** — Matters: **High**

- Options: (a) a narrow slice that is solid from start to finish; (b) wider feature coverage with thinner parts; (c) little code and a lot of design write-up.
- Trade-off: depth shows engineering quality, while breadth shows product thinking. Your answer changes how you use the time on almost everything below.

**0.2 Can external services be mocked or simulated?** — Matters: **High**

- Options: (a) everything must be real; (b) mocking is fine if it's clearly documented; (c) at least one real integration is expected.
- Trade-off: real integrations are more convincing, but they cost setup time and can break during a demo.

**0.3 What should be handed in?** — Matters: **Medium**

- Options: (a) a repo and a README; (b) also decision records or a design doc; (c) also a deployed URL or a demo video.
- Trade-off: each extra item takes time away from building.

> 0.1 and 0.2 are worth asking the person who set the exercise. Most of the other questions get easier once you have those answers.

---

## 1. What "important" means

**1.1 Who decides that an event is important?** — Matters: **High**

- Options: (a) the user, through rule criteria; (b) the system or the source, using a severity built into the data (e.g. earthquake magnitude, or a source's "breaking" flag); (c) an admin who picks or marks events by hand.
- Trade-off: (a) is the most flexible but users can make rules that are too noisy or too quiet. (b) is objective but only some sources have a severity. (c) is the simplest to control but doesn't scale and needs a person.

**1.2 How is importance expressed in a rule?** — Matters: **High**

- Options: (a) keyword or topic match; (b) numeric thresholds for each category (magnitude ≥ X, price move ≥ Y%); (c) one shared severity score (e.g. 1–5) that every source is mapped onto.
- Trade-off: keywords work for any category but are noisy. Thresholds are precise but need separate logic and UI for each category. A shared score is easy to extend, but the mapping is subjective.

**1.3 Are "breaking news, markets, disasters" a fixed list or just examples?** — Matters: **Medium–High**

- Options: (a) those three as fixed categories; (b) a category list the admin can manage; (c) free-text topics with no categories.
- Trade-off: a fixed list is fast to build but rigid. A managed list adds admin CRUD and makes the schema more generic.

**1.4 Does importance depend on the user's own context (location, holdings, interests)?** — Matters: **Medium**

- Options: (a) no, an event is equally important for everyone; (b) filtering by location or radius; (c) a personal watchlist (tickers, regions, keywords).
- Trade-off: personal relevance makes the product much more useful. It also adds location or entity data to both events and rules.

---

## 2. Data sources

**2.1 Real feeds or simulated events?** — Matters: **High**

- Options: (a) real external sources; (b) seeded or generated events plus an admin "inject test event" action; (c) a mix of one real source and simulated data for the others.
- Trade-off: real data is convincing. Simulated data makes the demo reliable and lets you trigger alerts whenever you want.

**2.2 Which categories will the slice actually cover?** — Matters: **High**

- Options: (a) one category from start to finish; (b) two; (c) all three, each kept shallow.
- Trade-off: covering more categories shows that the event model generalises, but each one needs its own ingestion and normalisation code.

**2.3 Which specific sources?** — Matters: **Medium**

- Disasters: I'm confident the USGS publishes free, public earthquake feeds in GeoJSON that need no API key.
- News: many outlets publish free RSS feeds. ❓ Terms of use vary by outlet, so check each one.
- Markets: ❓ I'm **not** confident about the current free-tier terms or rate limits of any specific market-data API, so I'm not naming one. Free market data often has delays, rate limits or a requirement for an API key.
- Trade-off: the most real-time and complete sources tend to need keys, have rate limits or restrictive terms.

**2.4 Pull or push?** — Matters: **Medium**

- Options: (a) poll on a schedule; (b) receive webhooks from sources that offer them; (c) trigger ingestion by hand only.
- Trade-off: polling is simple and works with almost any source but adds delay. Push is faster, but few free sources offer it and you'd need a public URL.

**2.5 Should alerts show the source and link to the original?** — Matters: **Low**

- Options: (a) yes, with a link; (b) a summary only.
- Trade-off: a link costs almost nothing and helps credibility. It may matter for some feeds' terms of use.

---

## 3. Event detection and processing

**3.1 Where do background ingestion and detection run?** — Matters: **High**

- Options: (a) an API route that an external scheduler or cron job calls; (b) a separate long-running worker script next to the Next.js app; (c) a "run ingestion now" button only.
- Trade-off: Next.js isn't built for long-running background jobs. A separate worker is cleaner but adds a second process to run and document.
- ⚠ The best choice depends on whether you deploy, and where (see 8.2).

**3.2 How should events be modelled?** — Matters: **High**

- Options: (a) one shared `Event` schema (category, title, severity, location, time, source URL, raw payload); (b) a separate table for each source type; (c) a shared table plus a type-specific JSON field.
- Trade-off: a shared model makes matching and new sources simple. Separate tables keep more detail from each source but make matching messier.

**3.3 How are duplicates handled?** — Matters: **Medium**

- Options: (a) remove duplicates by the source's own event ID; (b) by a hash of the content; (c) group the same story across different sources.
- Trade-off: (a) is trivial. (c) is what users would actually want but is hard to do well.

**3.4 What happens when an event is updated (e.g. a magnitude is revised)?** — Matters: **Low**

- Options: (a) ignore updates; (b) treat an update as a new event; (c) update the stored event and re-notify only if it now crosses a threshold.
- Trade-off: getting this right is complicated, but ignoring it can lead to missed or duplicate alerts.

**3.5 How fast must an alert arrive?** — Matters: **Medium**

- Options: (a) within seconds; (b) within minutes, set by the polling interval; (c) a digest every hour or day.
- Trade-off: lower latency needs more infrastructure. The brief doesn't give a target.

**3.6 For markets, what counts as a "movement"?** — Matters: **Medium** (High if you pick markets)

- Options: (a) % change from the previous close; (b) % change within a rolling time window; (c) a price crossing a level the user sets.
- Trade-off: every option needs stored price history and a defined baseline, so it's harder than "a new item appeared."

**3.7 Should an AI model or classifier judge importance or category?** — Matters: **Low–Medium**

- Options: (a) no, rules only; (b) optional enrichment step; (c) the core of detection.
- Trade-off: it handles messy news text better, but adds cost, non-deterministic results, harder testing and an API key.

---

## 4. Users and rules

**4.1 What is a "user," and how do they sign in?** — Matters: **High**

- Options: (a) real auth (email + password or magic link); (b) seeded users with a "switch user" control for the demo; (c) one hard-coded user.
- Trade-off: real auth can easily take 1–2 hours and has nothing to do with alerting. Faking it saves that time but needs to be clearly documented.

**4.2 How expressive are rules?** — Matters: **High**

- Options: (a) a simple form: category + threshold or keywords + channel(s); (b) a builder with combined conditions (AND/OR); (c) free-text subscriptions.
- Trade-off: (a) can be built and tested within the time. (b) is impressive but takes a lot of UI and logic work.

**4.3 How do rules relate to channels?** — Matters: **Medium–High** (it shapes the schema)

- Options: (a) each rule has one channel; (b) a rule can send to several channels; (c) the user saves channel destinations once and rules refer to them.
- Trade-off: (c) is the cleanest model for adding channels later. (a) is the quickest to build.

**4.4 Is this for individuals or for teams?** — Matters: **Medium**

- Options: (a) personal alerts only; (b) team or workspace alerts, e.g. posted to a shared Slack channel; (c) both.
- ❓ Mentioning Slack hints at a team (B2B) product, but the brief says "users." This changes ownership, permissions and the admin view.

**4.5 Are there controls on how often alerts are sent?** — Matters: **Medium**

- Options: (a) none, send immediately; (b) rate limits or cooldowns per rule; (c) digests and quiet hours.
- Trade-off: without controls, a busy feed floods users. Even a simple cooldown adds state.

**4.6 What can users do with their rules and alerts?** — Matters: **Low–Medium**

- Options: (a) create and delete only; (b) also pause and edit; (c) also see a history of alerts they received.
- Trade-off: history is cheap if you already keep a delivery log (see 5.3).

**4.7 Time zones and localisation?** — Matters: **Low**

- Options: (a) everything in UTC; (b) a time zone per user.
- Trade-off: this only matters if you build digests or quiet hours.

---

## 5. Matching and delivery

**5.1 When are rules checked against events?** — Matters: **High**

- Options: (a) right away, as each event is ingested; (b) ingestion writes jobs to a queue table and a worker processes them; (c) a separate scheduled matching pass.
- Trade-off: (a) is simplest. (b) separates ingestion from delivery and makes retries and the admin view straightforward, but takes more time.

**5.2 What delivery guarantee?** — Matters: **Medium–High**

- Options: (a) best effort; (b) at-least-once, with retries; (c) effectively once, using a unique key per event × rule × channel.
- Trade-off: (c) is cheap to do with a database unique constraint and prevents duplicates, but you have to design it in from the start.

**5.3 How are failures handled?** — Matters: **Medium**

- Options: (a) log only; (b) automatic retries with backoff; (c) failed deliveries shown in the admin view with a manual retry button.
- Trade-off: (c) shows how the system would be run and gives the admin view real content. (b) needs a worker or scheduler.

**5.4 If several of a user's rules match the same event, how many alerts go out?** — Matters: **Medium**

- Options: (a) one per matching rule; (b) one per user per channel; (c) one per user.
- Trade-off: sending fewer alerts needs grouping logic. Sending one per rule is simpler but annoys users.

**5.5 Does a new rule apply to past events?** — Matters: **Low**

- Options: (a) no; (b) yes, for the last N events or hours.
- Trade-off: backfill is useful for the demo but can create a sudden burst of notifications.

**5.6 How are messages formatted?** — Matters: **Low–Medium**

- Options: (a) plain text for every channel; (b) a simple template for each channel; (c) rich formatting (HTML email, structured Slack messages).
- Trade-off: rich formatting looks good in a demo but takes time.

---

## 6. Channels

**6.1 How is email sent in the slice?** — Matters: **High**

- Options: (a) real sending through an SMTP provider; (b) a local email catcher for development; (c) an outbox table in the database or console logging only.
- I'm confident Nodemailer (free Node SMTP library) and Mailpit (free local email catcher) both exist.
- Trade-off: real sending is convincing but needs credentials, has deliverability problems and puts secrets in the setup. A local catcher shows real messages without those problems.

**6.2 How is Slack integrated?** — Matters: **High**

- Options: (a) the user pastes a Slack incoming webhook URL; (b) a full Slack app with OAuth and a bot token; (c) mocked.
- I'm confident incoming webhooks exist and are free on Slack.
- Trade-off: (a) takes minutes but the user experience is basic, with one URL per channel. (b) is the realistic product but can easily take several hours, including app setup and token storage.

**6.3 Where do Slack alerts go?** — Matters: **Medium**

- Options: (a) a channel; (b) a direct message to the user; (c) either.
- Trade-off: direct messages need the full Slack app (6.2b). Webhooks only post to the channel they were created for.

**6.4 How much extensibility should the code show for "add more channels later"?** — Matters: **High** (an explicit requirement, so evaluators will look for it)

- Options: (a) a channel interface or adapter in code, with one implementation per channel and a registry; (b) also store channel settings in the database so channels can be configured at runtime; (c) build a third channel, such as a generic webhook, to prove the design works.
- Trade-off: too little abstraction fails the requirement. Too much is speculative design. Building a third channel is a cheap, concrete way to show it works.

**6.5 Must users prove they own a channel destination?** — Matters: **Medium**

- Options: (a) no check; (b) a "send test message" button; (c) a real email verification flow.
- Trade-off: with no check, the system can be used to spam other people's addresses. Real verification costs time.

**6.6 How is channel configuration stored?** — Matters: **Medium**

- Options: (a) typed columns for each channel type; (b) a JSON or text field holding settings for each channel; (c) a separate table for each channel type.
- Trade-off: typed columns are safer, while JSON makes new channels easier to add.
- ❓ I believe newer Prisma versions support a `Json` field type on SQLite and older ones didn't. Check this against the Prisma version you install. Otherwise, store a serialised string.

**6.7 Unsubscribe links and email compliance?** — Matters: **Low** to build, worth a line in the docs

- Options: (a) leave it out and document why; (b) add a basic unsubscribe link.
- Trade-off: a real product legally needs this, but it doesn't affect the core slice.

---

## 7. Admin view

**7.1 Who is an admin, and how is the admin view protected?** — Matters: **Medium–High**

- Options: (a) a role flag on the user record; (b) a separate shared password from an environment variable; (c) no protection, local demo only.
- Trade-off: this is tied to how you handle auth (4.1). Leaving it unprotected is only acceptable if you document it.

**7.2 What is the admin view for?** — Matters: **High** (the brief only says "an admin view")

- Options: (a) read-only monitoring: events, deliveries, failures; (b) management: users, rules, sources, categories; (c) operational actions: run ingestion, inject a test event, retry failed deliveries, turn a source off.
- Trade-off: (a) is cheap if delivery logs exist. (c) is the most useful for a demo. (b) is a lot of CRUD with little payoff.

**7.3 Can admins send alerts by hand ("this is breaking news")?** — Matters: **Medium**

- Options: (a) no; (b) yes, as editorial alerts to everyone or to a segment of users.
- Trade-off: this is a different product model (see 1.1c). It's simple to build but changes what the product is about.

**7.4 Metrics or plain tables?** — Matters: **Low–Medium**

- Options: (a) tables with filters; (b) summary counts (sent, failed, by channel); (c) charts.
- Trade-off: summary counts give the most value for the effort. Charts take time.

**7.5 Privacy: what user data can admins see?** — Matters: **Low**

- Options: (a) everything; (b) masked emails and webhook URLs.
- Trade-off: a sentence in the docs is probably enough here.

---

## 8. Non-functional concerns

**8.1 What scale should you design for?** — Matters: **Medium** (mostly for the docs)

- Options: (a) demo scale only; (b) build for demo scale and write notes for about 10k users and high event volume.
- Trade-off: checking every rule against every event works for a demo but not at scale. Describing what you'd change shows judgement without building it.

**8.2 Local only, or deployed?** — Matters: **High**

- Options: (a) local only, with a clear README; (b) deployed on a serverless host; (c) deployed on a host that keeps a persistent server and disk.
- ⚠ I'm fairly confident that a SQLite file doesn't reliably keep its data on typical serverless hosts, because their filesystems are temporary. Background jobs (3.1) are also harder there.
- Trade-off: a deployed URL is convenient for reviewers but may push you to a different database or job setup.

**8.3 How are secrets and sensitive settings handled?** — Matters: **Low–Medium**

- Options: (a) plain text in the database (it's a demo); (b) encrypted at rest; (c) environment variables only.
- Note: Slack webhook URLs act as credentials, since anyone with the URL can post.

**8.4 Which security basics are in scope?** — Matters: **Medium**

- Options: (a) input validation and admin protection only; (b) also protect against SSRF when users supply webhook URLs, by only allowing Slack hosts; (c) also rate limits and CSRF review.
- Trade-off: (b) is cheap and, for a webhook-based design, gives evaluators a clear signal.

**8.5 What testing?** — Matters: **Medium**

- Options: (a) unit tests for rule matching and channel adapters; (b) also integration tests from ingestion to delivery with fake channels; (c) also end-to-end UI tests.
- Trade-off: the matching logic is where most of the value is and is the easiest to test. End-to-end UI tests cost a lot of time.

**8.6 Observability?** — Matters: **Medium**

- Options: (a) console logs; (b) a delivery and ingestion log table; (c) structured logs plus that table.
- Trade-off: a log table also gives the admin view its data and records delivery state (5.2, 5.3), so one piece of work covers three needs.

**8.7 Data retention?** — Matters: **Low**

- Options: (a) keep everything; (b) delete events after N days.
- Trade-off: only matters in a long-running deployment.

---

## Questions that depend on each other

These pairs or groups are best decided together:

- **0.2 + 2.1 + 6.1 + 6.2:** how much is real and how much is mocked.
- **4.1 + 7.1:** auth for users and for admins.
- **3.1 + 5.1 + 8.2:** where background work runs and where you deploy.
- **5.2 + 5.3 + 7.2 + 8.6:** a delivery log table could support all four.

Before you decide anything, I'd send three clarifying questions to whoever set the exercise:

1. What do they want you to optimise for (0.1)?
2. Is mocking acceptable (0.2)?
3. Does "important" mean user-defined, source-defined or editorial (1.1)?
