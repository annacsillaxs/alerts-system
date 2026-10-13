## Prompt

Read docs/DESIGN.md §3–5. Build the ingestion pipeline, without any UI yet:

1. USGS source: fetch the "all earthquakes, past day" GeoJSON feed and
   normalise each feature into an Event. Before writing the parser,
   fetch the feed once and show me a real feature, so we use the actual
   field names.
2. Dedup by (source, externalId): existing events are skipped.
3. Matcher: magnitude ≥ rule threshold.
4. Channel registry with two adapters:
   - email: nodemailer to a local Mailpit SMTP server
   - slack-mock: doesn't call anything, just logs and returns success
5. Dispatcher: create Delivery rows, send inline, record sent/failed + error.
6. Expose it as a POST /api/ingest route that returns a summary
   (fetched, new, skipped, sent, failed).

Check whether Mailpit or Docker is installed. If neither is, stop and
ask me. Ask before installing anything else.

## Response

The ingestion pipeline works end to end through `POST /api/ingest`, using the real USGS feed. There's no UI yet. Typecheck and lint both pass, and there are no automated tests yet.

**Test runs**

| Run | Situation                         | Response                                                     |
| --- | --------------------------------- | ------------------------------------------------------------ |
| 1   | Fresh database                    | `{"fetched":231,"new":229,"skipped":2,"sent":72,"failed":0}` |
| 2   | Same feed again                   | `{"fetched":231,"new":0,"skipped":231,"sent":0,"failed":0}`  |
| 5   | 3 events removed, Mailpit stopped | `{"fetched":230,"new":3,"skipped":227,"sent":1,"failed":5}`  |

- **Run 1:** the 72 sends were 70 emails, which arrived in Mailpit (e.g. `bob@example.com | M 5.4 - Mid-Indian Ridge`), plus 2 mocked Slack messages. The log shows `[slack-mock] would POST to https://hooks.slack.com/services/T…LICE: M 6.7 - central Mid-Atlantic Ridge`. The 2 skipped features weren't earthquakes.
- **Run 2:** proves duplicate events are skipped.
- **Run 5:** the 5 emails were recorded as `failed` with `attempts: 1`, no `sentAt` and the error `ESOCKET`. The Slack mock still succeeded, and one failure didn't stop the run.

**A bug I found and fixed during testing:** in runs 3 and 4, emails were recorded as "sent" even though Mailpit was down. When the connection is refused, nodemailer rejects with an empty error message, and my dispatcher treated an empty string as "no error". I fixed it in two places:

- The dispatcher now checks `error !== null` instead of whether the message is truthy.
- A new helper, [lib/errors.ts](lib/errors.ts), makes sure an error message is never empty: it falls back to the error code or name. The email adapter, the dispatcher and the API route all use it now.

Those wrong "sent" rows were deleted and re-created by run 5.

**What was built**

- **USGS source:** [lib/ingestion/sources/usgs.ts](lib/ingestion/sources/usgs.ts). It uses the field names from the real feature I showed you, and anything that isn't an earthquake is skipped.
- **Pipeline:** [lib/ingestion/run.ts](lib/ingestion/run.ts) handles fetching, duplicate checks and matching. It checks for existing events in one query, and the database's unique constraint still stops duplicates if two runs overlap.
- **Matcher and metric:** [lib/matching/matcher.ts](lib/matching/matcher.ts) applies "magnitude ≥ threshold", with the metric defined in `lib/metrics/` (magnitude only).
- **Channels:** `lib/channels/` contains the email adapter (nodemailer to Mailpit), the Slack mock and the registry. The dispatcher looks adapters up in the registry and never checks the channel type itself.
- **Dispatcher:** [lib/dispatch/dispatcher.ts](lib/dispatch/dispatcher.ts) creates the delivery row, sends inline and records the result. Its `send()` function can be reused for the retry button.
- **Settings:** `SMTP_HOST`, `SMTP_PORT` and `MAIL_FROM` are added to `.env` and `.env.example`.

**Things to know about your environment**

- Port 3000 is used by another app of yours (a "finance" app). My first two POSTs went there by mistake and got a 404, so nothing changed in it.
- I tested against your dev server already running for this repo on port 3001 and left it running.
- I restarted Mailpit in the background, so the inbox is at http://localhost:8025.
- The database now holds real events and deliveries, including 5 failed emails that will be useful for testing the retry button later. Re-running the seed will clear the deliveries.

**Assumptions**

- **Null magnitude:** a missing magnitude doesn't skip the event. It's stored as `null` and never matches a rule. Only events missing `id`, `time` or `title` are skipped.
- **"Skipped" count:** it includes non-earthquakes and invalid features as well as duplicates, so that new + skipped = fetched.
- **Error detail:** "ESOCKET" is the most detail nodemailer gives here. I didn't dig out the underlying "connection refused" message.
- **Mock Slack check:** the mock only accepts webhook URLs that start with `https://`. It doesn't check that the host is Slack's.
- **Folder layout:** the code is in `lib/` at the project root, since there's no `src/` folder. DESIGN.md §6 still shows `src/`.
- **New dependency:** `nodemailer` 10.1.0 was published 3 days ago and ships its own types. Pin an older 10.x if that worries you.

**My verdict**

- Folder layout - scr/ was deleted from DESIGN.md
- checked one of the delivered email alert's event and checked it against the source - verified - see screenshots folder
