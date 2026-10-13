Key decisions (summary)

#1 Next.js single app
#5/#6 importance = source severity + per-category thresholds
#11 USGS as the one real source, the rest simulated
#24/#26 dedup by (source, externalId), unique event × rule delivery
#35 channel adapter interface + registry
#33/#34 Mailpit email, mocked Slack shaped like a webhook
#14 seeded users, no auth
#2 docs-first, minimal code

Scope cut (20:15): designed, but not built.

#23 queue + worker: send inline during ingestion. The Delivery row still records status and error, so the admin view still works.
#27 automatic backoff: manual “retry” button only.
#29 revisions: existing events are skipped.
#21 worker script: the “Run ingestion now” button first.
#7/#40 category CRUD and user management: categories are seeded. The admin view is read-only tables + run ingestion + inject simulated event + retry.
#17: earthquake magnitude is the only metric type in code. Storm/wind speed is designed only.

==========================================================================

1. Chose Next.js over separate FastAPI backend: single language, single deployable, simpler for reviewers to run. Trade-off: no native background jobs → manual/scripted polling.
2. Chose a plan- and documentation-first deliverable over a broad or polished codebase: the evaluation weight is on showing the plan, features and decisions; code stays minimal. Trade-off: less working functionality to demo.
3. Chose simulated data with one real external API (if time allows) over all-real or all-mocked: a real source adds credibility, simulation keeps the demo reliable. Trade-off: the mock/real boundary must be clearly documented.
4. Chose to deliver repo + docs + a deployed URL or a demo video. Which one is still open (see OPEN_QUESTIONS 0.3 / 8.2). Trade-off: time spent on non-feature work.
5. Chose source/system severity over user-defined or admin-curated importance: importance comes from data the source already provides (e.g. earthquake magnitude). Trade-off: sources without a native severity (e.g. plain news feeds) need a severity derived or assigned.
6. Chose per-category thresholds over keywords or a shared severity score: rules say e.g. "magnitude ≥ X" or "move ≥ Y%". Trade-off: each category needs its own threshold logic and UI.
7. Chose an admin-managed category list over a fixed enum or free-text topics. Trade-off: admin CRUD and a more generic schema.
8. Deferred personal context (location/radius, watchlists): an event is equally important for all users in the slice. Trade-off: less relevant alerts; noted as future work.
9. Chose built-in metric types in code over fully admin-defined metrics: admins manage categories, each mapped to a metric type implemented in code (e.g. magnitude ≥ X). Resolves the tension between #6 and #7. Trade-off: a new metric type needs a code change.
10. Chose one category end to end over two or three: other categories exist in the design docs only. Trade-off: generalisation of the event model is argued on paper rather than shown in running code.
11. Chose the USGS public earthquake feeds (free, no key) as the one real source; everything else is simulated. Its native magnitude fits #5/#6 directly. Trade-off: dependence on an external feed during the demo; simulation covers that.
12. Chose scheduled polling plus a manual trigger, both calling the same ingestion function, over push/webhooks or manual-only. Trade-off: latency equals the polling interval; where the scheduler runs is still open (3.1).
13. Chose "Natural disasters" as the one end-to-end category over the narrower "Earthquakes": earthquakes come from the real USGS feed, other disaster types are simulated. Trade-off: non-earthquake types need a metric of their own (see #9) or must reuse one.
14. Chose seeded users with a "switch user" control over real auth or a single user: shows multiple users' rules and deliveries without spending build time on auth. Trade-off: no real identity; documented as a demo shortcut.
15. Chose one channel per rule over multi-channel rules or saved destinations: fastest to build; a user wanting email and Slack creates two rules. Trade-off: rule duplication; channel destination lives on the rule.
16. Chose a role flag on User for admin access. Trade-off: combined with #14 (anyone can switch to the admin user), the admin view is effectively unprotected in the demo; must be stated in the docs.
17. Chose type-specific metrics per disaster type (e.g. magnitude for earthquakes, wind speed for storms) over a shared alert level: each is a metric type in code (#9). Trade-off: one metric implementation per disaster type.
18. Chose a simple rule form: category/disaster type + threshold + one channel destination (follows #6, #15), over an AND/OR builder. Trade-off: no compound conditions.
19. Chose personal alerts only: each rule belongs to one user. Trade-off: no shared team/workspace alerts, even though Slack hints at team use.
20. Deferred frequency controls (cooldowns, digests, quiet hours): every match notifies immediately in the slice. Trade-off: a busy feed can flood a user; documented as future work.
21. Chose a separate worker script for scheduled polling over external cron → API route or an in-process timer (confirms and refines #1). Trade-off: a second process to run and document; any deployment needs a host that keeps a long-running process (affects 8.2).
22. Chose a shared Event table with common fields plus type-specific metrics as JSON over metric columns or a table per type. Trade-off: metrics aren't directly queryable in SQL; must verify Prisma Json support on SQLite for the installed version (fallback: serialised string).
23. Chose a queue table + worker for delivery over sending during ingestion: ingestion/matching writes pending deliveries, the worker sends them. Trade-off: more moving parts; in return retries and admin visibility come naturally.
24. Chose "effectively once" delivery: a unique constraint per event × rule plus retries, over best effort or plain at-least-once. Trade-off: must be designed into the schema from the start; a crash between send and status update can still duplicate.
25. Chose a demo video with local run over a deployed URL: the worker (#21) and SQLite file need no hosting decisions. Completes #4. Trade-off: reviewers can't click a live link; README must make local setup easy.
26. Chose deduplication by source event ID, unique (source, externalId), over content hashing or cross-source clustering. Trade-off: the same real-world event from two sources would be two events (moot while only one real source exists).
27. Chose automatic retries with backoff plus a manual retry in the admin view for failed deliveries. Trade-off: retry state (attempts, next attempt time, last error) on each delivery.
28. Chose one alert per matching rule over collapsing per user/destination; matches the event × rule uniqueness of #24. Trade-off: overlapping rules can send the same user duplicate alerts on the same channel.
29. Chose to update stored events on revision and notify rules that the revision newly makes match, over ignoring updates or never re-notifying. Fits #24: a rule already notified for that event is not notified again. Trade-off: re-matching logic and tests for revisions.
30. Chose a ~5 minute polling interval over ~1 minute or configurable. Trade-off: up to ~5 min alert latency; gentler on the public feed.
31. Chose no AI model in the slice; AI (e.g. deriving severity for news) is documented as future work. Trade-off: news-style sources without native severity stay out of scope.
32. Chose plain-text messages, same text on every channel, over per-channel templates or rich formatting. Trade-off: less polished alerts.
33. Chose an SMTP library sending to a local email catcher (e.g. Nodemailer → Mailpit) over a real provider or an outbox-only fake. Trade-off: one more local tool to run; no real inbox delivery.
34. Chose a mocked Slack channel over incoming webhooks or a full Slack app: delivery is recorded, not posted. Trade-off: no real Slack message in the demo; the adapter boundary must make the real implementation an obvious swap.
35. Chose a channel adapter interface + registry: each channel implements one interface; adding a channel = one adapter + registration. No runtime DB configuration of channel types. Trade-off: new channels need a deploy.
36. Chose channelType + JSON config on each rule, validated by the channel's adapter, over a single target string or typed columns. Trade-off: weaker DB-level typing; same Prisma Json/SQLite check as #22.
37. Chose to shape the mocked Slack config as an incoming webhook URL over a channel name or user DM, so replacing the mock with a real webhook POST is a small swap. Trade-off: no DMs without a future Slack app.
38. Chose no destination ownership check; documented. Trade-off: in a real product this would allow using the system to spam others; acceptable for seeded demo users.
39. Chose unsubscribe/email compliance as out of scope, documented as required for production. Trade-off: not production-ready email.
40. Chose an admin view with user/rule management plus category CRUD (#7), a "run ingestion now" button (#12) and manual retry of failed deliveries (#27). Trade-off: more admin screens to build.
41. Chose an admin "inject simulated event" action that goes through normal matching, over no manual alerts or editorial broadcasts. Keeps importance source-driven (#5) while making the demo controllable. Trade-off: simulated events must be clearly labelled as such.
42. Chose tables plus summary counts (e.g. users, active rules, deliveries sent/failed) over plain tables or charts. Trade-off: no trends over time.
43. Chose to mask webhook URLs in the admin view (they act as credentials) while showing emails. Trade-off: admins can't copy a full webhook URL for debugging.
44. Chose to build for demo scale with a docs section on what changes at ~10k users / high event volume. Trade-off: scaling claims are argued, not demonstrated.
45. Chose to store channel config in plain text in the DB, documenting encryption at rest as production work. Trade-off: real webhook URLs (after un-mocking Slack) would be readable from the DB.
46. Chose minimal security checks with a documented security section over in-code validation or an SSRF guard. Trade-off: the slice is not safe to expose beyond local use.
47. Chose minimal tests with a documented test strategy, consistent with #2. Trade-off: correctness of matching and retries rests on the written strategy more than on automated tests.
48. Chose the delivery table plus console output from the worker as the only observability, over an ingestion-run log or structured logs. Trade-off: ingestion problems are visible only in the console.
49. Chose create/delete as the only rule actions for users (no pause, edit, or alert history). Trade-off: changing a rule means deleting and recreating it.
50. Chose to include the original source link in every alert message.
51. Deferred per-user time zones (UTC everywhere), backfill of past events for new rules, and data-retention cleanup; all documented as future work.
52. Chose a flat category list where each category is a disaster type (Earthquake, Storm, …) bound to a metric type in code; "Natural disasters" (#13) is a display grouping, not a data level. Refines #7/#9/#17. Trade-off: adding News/Markets later may need a grouping level.
53. Chose "≥" as the only threshold comparison ("notify when metric ≥ X"). Trade-off: no "falls below" or range rules.
54. Chose to ingest only USGS features with `type = earthquake`; explosions
    and quarry blasts are filtered out, because they'd be false alerts for
    an Earthquake category. Other types could map to their own categories
    later. Trade-off: some real seismic events are ignored. Found by
    inspecting the live feed (see AI_REVIEW_LOG).
