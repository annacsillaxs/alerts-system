## Prompt:

Read docs/DECISIONS.md, especially the "Key decisions" and "Scope cut"
sections at the top. Those are final; don't reopen them.

Write docs/DESIGN.md for the slice I'm actually building. Keep it to
roughly one page. Include:

1. A pipeline diagram in Mermaid:
   Source → Event → Rule matcher → Dispatcher → Channel → Delivery log.
   Show what's real (USGS feed, email via Mailpit) and what's simulated
   (injected events, mocked Slack).

2. Data model: User, Category, Rule, Event, Delivery. Fields and types,
   relations, and the unique constraints: (source, externalId) on Event
   and (eventId, ruleId) on Delivery.

3. The channel adapter interface and registry as TypeScript type
   signatures only, no implementation. Include how an adapter validates
   its own config.

4. The metric type interface (how a category maps to a metric like
   earthquake magnitude, and how "metric ≥ threshold" is evaluated).

5. The ingestion flow as numbered steps, from "Run ingestion now"
   to delivery status being recorded, including what happens when a
   send fails.

6. The proposed folder structure.

Rules:

- Only design what's in scope. Anything from the scope cut goes in a
  short "Designed but not built" list at the end, one line each.
- List the USGS GeoJSON fields you plan to rely on, and mark each one
  "to verify". Don't assume field names or formats.
- If you notice any decisions that conflict with each other, list them
  at the end rather than resolving them yourself.
- No implementation code.

## Response:

I've written [docs/DESIGN.md](docs/DESIGN.md) for the slice as cut back in the "Scope cut" section, and treated those decisions as final.

It's longer than one page, mostly because of the TypeScript signature blocks and the data-model table. The diagram uses Mermaid, and I haven't rendered it to check that it displays correctly.

**How the scope cut shows up in the design**

- There's no worker or queue. "Run ingestion now" runs the whole pipeline in one go, and emails and Slack messages are sent during ingestion.
- Each send still gets a Delivery record, written first as pending and then updated to sent or failed. That's what the admin view reads.
- Failures are recorded as failed with the error message. Retrying is a manual button that re-sends the same failed delivery rather than creating a new one.
- An event that's already stored is skipped, not updated.
- Categories are seeded, and earthquake magnitude is the only metric.

**USGS fields**
The design relies on six fields, each marked "to verify": `id`, `mag`, `time`, `title` or `place`, `url`, and the `features[]` list itself. The feed URL also still needs checking.

**Conflicts I listed at the end of the doc (not resolved)**

1. Simulated "other disaster types" don't fit with magnitude being the only metric. Can injected events only be earthquakes?
2. Is scheduled 5-minute polling still in the build at all, or is there only the button?
3. Are the admin summary counts and the masking of Slack webhook URLs still in? The scope-cut admin list doesn't mention them.
4. #48 mentions a worker that no longer exists.
5. #50 puts a source link in every alert, but simulated events have no source URL.
6. #4 still says URL vs video is open, but #25 decided it.
7. PLAN.md and the statuses in OPEN_QUESTIONS.md still describe the design from before the scope cut.

## What it produced

Wrote docs/DESIGN.md with diagram, schema,
adapter interfaces. Listed 7 conflicts between my decisions.

## My verdict

There's a lot to cover and think through, I won't address all the conflicts for now.
