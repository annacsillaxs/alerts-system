# Planning and review chat (summary)

Alongside Claude in VS Code, I used a separate Claude chat as a planning partner and second-opinion reviewer. The transcript isn't included, because it mixes in personal conversation unrelated to the work. This is what it was used for:

- **Planning:** the timeline, and what to cut to fit the deadline (one source, no worker, no auth).
- **Stack:** discussed FastAPI vs Next.js; I chose Next.js (decision #1).
- **Prompt drafting:** first drafts of prompts 01–07 and of CLAUDE.md, which I adapted before sending them in VS Code.
- **Design review:** flagged 5 issues in DESIGN.md (channel type union, rule deletion behaviour, stuck pending deliveries, unverified USGS fields, Prisma SQLite support).
- **Output review:** suggested checks for the VS Code results (running ingestion twice, testing with Mailpit off, comparing an email with the USGS site, reconciling counts by hand).
- **Docs:** helped structure the README and drafted several sections ("How I approached it", "What works", "Adding a new channel", "How I checked the AI's work", "Known issues", "What I'd do next"), which I reviewed and edited.

One of its review claims was wrong (that the AI had ignored an instruction); I checked my prompt history and rejected it.
