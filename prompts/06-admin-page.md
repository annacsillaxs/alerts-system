## Prompt

Read docs/DESIGN.md. Build the admin page at /admin, keeping it simple,
using the existing lib/ code. Don't duplicate logic.

1. Summary counts: users, rules, events, deliveries sent / failed.
2. Buttons: "Run ingestion now" (same function as /api/ingest), and
   "Inject simulated event" (an earthquake with a magnitude I type in,
   labelled [SIMULATED]).
3. Tables: recent events, all rules (mask Slack webhook URLs), and
   recent deliveries with status and error.
4. A "Retry" button on failed deliveries, reusing the dispatcher's send().

Plain styling is fine. Show me it working in the browser, including one retry.

## Response

The admin page at `/admin` works in a real browser, including a retry. I don't have a browser tool in this session, so I drove headless Chrome with a small script in the scratchpad and checked the screenshots. Typecheck and lint pass.

**What happened in the browser**

1. **Page load:** the counts showed 3 users, 3 rules, 229 events, 67 sent and 5 failed. The failed rows showed `ESOCKET` and a **Retry** button, and the Slack URL showed masked as `https://hooks.slack.com/services/T…LICE`.
2. **Retry:** I retried Bob's failed email for "M 6.7 - central Mid-Atlantic Ridge". The same row changed from `failed`, attempts 1, `ESOCKET` to `sent`, attempts 2, with no error, and the counts went to 68 sent and 4 failed. The email arrived in Mailpit.
3. **Inject a simulated M 6.5:** the page showed `Injected "M 6.5 - Simulated earthquake": sent 3, failed 0`. The event is tagged **[SIMULATED]** in the events table, and both emails reached Mailpit with the subject `[SIMULATED] M 6.5 - Simulated earthquake`.
4. **Run ingestion now:** the page showed `Fetched 230, new 3, skipped 227, sent 0, failed 0`.

**How it avoids duplicating logic**

- The button and `/api/ingest` call the same `runIngestion()`.
- I moved the "load category, match rules, send" steps into shared helpers in [lib/ingestion/run.ts](lib/ingestion/run.ts). Both ingestion and the new `injectSimulatedEvent()` use them.
- `retryDelivery()` in [lib/dispatch/dispatcher.ts](lib/dispatch/dispatcher.ts) loads the delivery, refuses anything that isn't failed, then calls the existing `send()` on the same row.
- Slack masking uses the adapter's own `describeConfig()`, through a new `describeChannelConfig()` in the registry. The page never checks the channel type itself.
- The page itself is [page.tsx](app/admin/page.tsx), the server actions are in [actions.ts](app/admin/actions.ts), and [action-form.tsx](app/admin/action-form.tsx) is one shared form that shows each action's result line.

**Fixes made along the way**

- An empty magnitude field used to pass validation as 0, because `Number("")` is `0`. It's now rejected.
- Following the Next 16 docs, database reads sit inside `<Suspense>` and the actions call `refresh()` from `next/cache`.

**Minor things you'll notice**

- After you inject an event, the magnitude field resets to 5.0.
- Event titles link to USGS, but the scaffold's CSS makes links look like plain text.

**Assumptions**

- **Validation:** the simulated magnitude uses the same check as a threshold (−2 to 10), via `validateThreshold`, so the range isn't written twice.
- **Labelling:** simulated titles are stored as "M x.x - Simulated earthquake". The [SIMULATED] label comes from `source = "simulated"`, so it isn't stored twice in the title.
- **Table sorting and size:** recent events are the latest 15 by time of the quake. Recent deliveries are the latest 25 by last update.
- **Access:** there's no auth check on `/admin`, as decided (#14, #16).
- **Mailpit inbox:** Mailpit keeps its inbox in memory, so restarting it earlier cleared the old messages.

None of this is committed yet.
