# Open Questions

Ambiguities found in the product brief, with options and trade-offs. Decisions are recorded in [DECISIONS.md](DECISIONS.md); this file tracks status only.

> "We want users to be able to set up alerts so they get notified when something important happens in the world — like breaking news, market movements, natural disasters, that kind of thing. Should work for both email and Slack. Make it flexible enough that we can add more channels later. We need an admin view too."

**Legend:** Impact = how much it matters for an 8–10 h build. ⚠ = assumption. ❓ = unverified, check before relying on it.
**Status:** `Open` · `Decided (#n)` = see DECISIONS.md entry n · `Deferred` = consciously left out, documented.

---

## 0. Exercise

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 0.1 | What will evaluators value most? | (a) narrow, polished end-to-end slice; (b) wide feature coverage, shallow; (c) little code, heavy on plan and design write-up | Depth shows engineering quality; breadth shows product thinking | High | Decided (#2) |
| 0.2 | Can external services be mocked? | (a) all real; (b) mocks OK if documented; (c) at least one real integration expected | Realism vs setup time and demo reliability | High | Decided (#3) |
| 0.3 | What to hand in? | (a) repo + README; (b) + decision records/design doc; (c) + deployed URL or demo video | Each extra deliverable costs build time | Medium | Decided (#4, #25) |

## 1. What "important" means

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 1.1 | Who decides an event is important? | (a) user, via rule criteria; (b) system/source, from built-in severity (e.g. earthquake magnitude); (c) admin, by hand | Flexibility vs noise vs manual effort | High | Decided (#5) |
| 1.2 | How is importance expressed in a rule? | (a) keyword/topic match; (b) numeric threshold per category; (c) one shared severity score (e.g. 1–5) | Keywords work for anything but are noisy; thresholds are precise but need per-category logic; a shared score extends easily but the mapping is subjective | High | Decided (#6) |
| 1.3 | Are the three categories fixed or just examples? | (a) fixed set of three; (b) admin-managed category list; (c) free-text topics | Speed vs flexibility (admin CRUD, more generic schema) | Med–High | Decided (#7) |
| 1.4 | Does importance depend on the user's context? | (a) no; (b) location/radius filter; (c) personal watchlist (tickers, regions, keywords) | More useful vs extra data on events and rules | Medium | Deferred (#8) |

## 2. Data sources

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 2.1 | Real feeds or simulated events? | (a) all real; (b) seeded/generated + admin "inject test event"; (c) one real source + simulated others | Convincing vs reliable and controllable demo | High | Decided (#3, #11) |
| 2.2 | Which categories does the slice cover? | (a) one end to end; (b) two; (c) all three, shallow | Proves the event model generalises vs ingestion work per category | High | Decided (#10) |
| 2.3 | Which specific source(s)? | Disasters: USGS free public earthquake GeoJSON feeds, no key (confident). News: outlet RSS feeds ❓ terms vary per outlet. Markets: ❓ no free API named, terms and rate limits unverified | Real-time and complete sources often need keys or limit usage | Medium | Decided (#11) |
| 2.4 | Pull or push? | (a) scheduled polling; (b) provider webhooks; (c) manual trigger only | Simple and universal vs low latency (needs a public URL) | Medium | Decided (#12) |
| 2.5 | Show source and link to original? | (a) yes, with link; (b) summary only | Near-free credibility; may matter for feed terms of use | Low | Decided (#50) |

## 3. Event detection and processing

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 3.1 | Where do ingestion and detection run? | (a) API route called by an external scheduler/cron; (b) separate long-running worker script; (c) manual "run now" button only | Next.js has no native background jobs; a worker is cleaner but is a second process ⚠ depends on 8.2 | High | Decided (#21) |
| 3.2 | Event model? | (a) one shared Event schema; (b) a table per source type; (c) shared table + type-specific JSON | Easy matching and extension vs fidelity to each source | High | Decided (#22) |
| 3.3 | Deduplication? | (a) by source event ID; (b) by content hash; (c) cluster the same story across sources | Trivial vs what users actually want | Medium | Decided (#26) |
| 3.4 | Event updates (e.g. magnitude revised)? | (a) ignore; (b) treat as a new event; (c) update and re-notify only if a threshold is now crossed | Correctness vs complexity | Low | Decided (#29) |
| 3.5 | Latency target? | (a) seconds; (b) minutes (polling interval); (c) hourly/daily digest | Lower latency needs more infrastructure | Medium | Decided (#30) |
| 3.6 | What is a market "movement"? | (a) % vs previous close; (b) % within a rolling window; (c) user-defined price level | All need stored price history and a baseline | Med (High if markets chosen) | N/A in slice (#10, markets not built) |
| 3.7 | AI model/classifier for importance or category? | (a) no, rules only; (b) optional enrichment step; (c) core of detection | Handles messy text vs cost, non-determinism, harder testing, API key | Low–Med | Deferred (#31) |

## 4. Users and rules

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 4.1 | What is a user and how do they sign in? | (a) real auth (password or magic link); (b) seeded users + "switch user" control; (c) one hard-coded user | Real auth costs 1–2 h and isn't the core problem | High | Decided (#14) |
| 4.2 | How expressive are rules? | (a) simple form: category + threshold/keywords + channel(s); (b) AND/OR condition builder; (c) free-text subscriptions | Buildable and testable vs impressive but costly UI and logic | High | Decided (#18) |
| 4.3 | How do rules relate to channels? | (a) one channel per rule; (b) several channels per rule; (c) user saves channel destinations once, rules refer to them | (c) is cleanest for adding channels; (a) is fastest | Med–High | Decided (#15) |
| 4.4 | Individuals or teams? | (a) personal alerts only; (b) team/workspace alerts (e.g. shared Slack channel); (c) both | ❓ Slack hints at B2B, but the brief says "users". Affects ownership, permissions, admin view | Medium | Decided (#19) |
| 4.5 | Controls on how often alerts are sent? | (a) none, send immediately; (b) cooldown/rate limit per rule; (c) digests and quiet hours | Floods from busy feeds vs extra state | Medium | Deferred (#20) |
| 4.6 | What can users do with rules and alerts? | (a) create/delete; (b) + pause/edit; (c) + history of received alerts | History is cheap if a delivery log exists (5.3) | Low–Med | Decided (#49) |
| 4.7 | Time zones and localisation? | (a) UTC everywhere; (b) per-user time zone | Only matters with digests or quiet hours | Low | Deferred (#51) |

## 5. Matching and delivery

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 5.1 | When are rules checked against events? | (a) right away, during ingestion; (b) queue table + worker; (c) separate scheduled pass | Simplest vs decoupled, with easy retries and admin visibility | High | Decided (#23) |
| 5.2 | Delivery guarantee? | (a) best effort; (b) at-least-once with retries; (c) effectively once via a unique key per event × rule × channel | (c) is a cheap DB constraint but must be designed in early | Med–High | Decided (#24) |
| 5.3 | How are failures handled? | (a) log only; (b) automatic retries with backoff; (c) failed deliveries shown in admin with a manual retry | Gives the admin view real content vs needs a scheduler | Medium | Decided (#27) |
| 5.4 | Several of a user's rules match one event: how many alerts? | (a) one per rule; (b) one per user per channel; (c) one per user | Simple vs not annoying | Medium | Decided (#28) |
| 5.5 | Does a new rule apply to past events? | (a) no; (b) yes, last N events or hours | Good for demos vs a sudden burst of notifications | Low | Deferred (#51) |
| 5.6 | Message formatting? | (a) plain text; (b) simple template per channel; (c) rich (HTML email, structured Slack messages) | Demo polish vs time | Low–Med | Decided (#32) |

## 6. Channels

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 6.1 | How is email sent in the slice? | (a) real SMTP provider; (b) local catcher (e.g. Mailpit) via an SMTP library (e.g. Nodemailer); (c) DB outbox / console only | Realism vs credentials, deliverability, secrets | High | Decided (#33) |
| 6.2 | How is Slack integrated? | (a) user pastes an incoming webhook URL; (b) full Slack app with OAuth + bot token; (c) mocked | Minutes with a basic UX vs hours for the realistic product | High | Decided (#34) |
| 6.3 | Where do Slack alerts go? | (a) a channel; (b) direct message to the user; (c) either | DMs require the full app (6.2b) | Medium | Decided (#37) |
| 6.4 | How much extensibility should the code show? | (a) channel interface/adapter + registry in code; (b) + channel config in DB, configurable at runtime; (c) + a third channel (e.g. generic webhook) as proof | Explicit requirement vs speculative design | High | Decided (#35) |
| 6.5 | Must users prove they own a destination? | (a) no check; (b) "send test message" button; (c) real email verification | Open to abuse as a spam relay vs time | Medium | Decided (#38) |
| 6.6 | How is channel configuration stored? | (a) typed columns per channel; (b) JSON/text settings per channel; (c) a table per channel type | Type safety vs ease of adding channels ❓ check Prisma `Json` support on SQLite for the installed version | Medium | Decided (#36) |
| 6.7 | Unsubscribe and email compliance? | (a) out of scope, documented; (b) basic unsubscribe link | Legally needed in a real product; not core here | Low | Deferred (#39) |

## 7. Admin view

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 7.1 | Who is an admin and how is the view protected? | (a) role flag on User; (b) shared password from an env var; (c) unprotected, local demo only | Tied to 4.1; unprotected only acceptable if documented | Med–High | Decided (#16) |
| 7.2 | What is the admin view for? | (a) read-only monitoring (events, deliveries, failures); (b) management (users, rules, sources, categories); (c) operational actions (run ingestion, inject event, retry, disable source) | Cheap and useful vs lots of CRUD | High | Decided (#40) |
| 7.3 | Can admins send alerts by hand? | (a) no; (b) yes, editorial alerts to all or a segment | Simple, but changes the product model (see 1.1c) | Medium | Decided (#41) |
| 7.4 | Metrics or plain tables? | (a) filtered tables; (b) summary counts; (c) charts | Value per hour spent | Low–Med | Decided (#42) |
| 7.5 | Privacy: what can admins see? | (a) everything; (b) masked emails and webhook URLs | A line in the docs is probably enough | Low | Decided (#43) |

## 8. Non-functional

| ID | Question | Options | Trade-off | Impact | Status |
|---|---|---|---|---|---|
| 8.1 | What scale to design for? | (a) demo only; (b) demo build + written notes for ~10k users | Matching every rule against every event doesn't scale; describing the fix shows judgement | Medium | Decided (#44) |
| 8.2 | Local only or deployed? | (a) local + README; (b) serverless host; (c) host with a persistent server and disk | ⚠ SQLite doesn't reliably keep data on typical serverless hosts; affects 3.1 | High | Decided (#25) |
| 8.3 | Secrets and sensitive settings? | (a) plain text in DB; (b) encrypted at rest; (c) env vars only | Slack webhook URLs act as credentials | Low–Med | Decided (#45) |
| 8.4 | Which security basics are in scope? | (a) input validation + admin protection; (b) + SSRF guard on user-supplied URLs (allow Slack hosts only); (c) + rate limits, CSRF review | (b) is cheap and a clear signal for a webhook design | Medium | Decided (#46) |
| 8.5 | What testing? | (a) unit tests for matcher and adapters; (b) + integration tests from ingestion to delivery with fake channels; (c) + end-to-end UI tests | Matcher holds most of the value and is easiest to test | Medium | Decided (#47) |
| 8.6 | Observability? | (a) console logs; (b) delivery/ingestion log table; (c) structured logs + table | The log table also feeds the admin view and delivery state | Medium | Decided (#48) |
| 8.7 | Data retention? | (a) keep everything; (b) delete events after N days | Only matters in a long-running deployment | Low | Deferred (#51) |

---

## Coupled decisions
- 0.2 + 2.1 + 6.1 + 6.2 — what is real and what is mocked
- 4.1 + 7.1 — user and admin auth
- 3.1 + 5.1 + 8.2 (+ 0.3) — where background work runs and where you deploy
- 5.2 + 5.3 + 7.2 + 8.6 — one delivery log table could support all four
