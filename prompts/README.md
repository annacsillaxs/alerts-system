# Prompt history

All prompts were sent to Claude in VS Code, except where noted. Each file
holds the exact prompt, a summary of the output, and my verdict.

| #   | File                                                           | What it did                         | Verdict                                              |
| --- | -------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------- |
| 01  | [01-brief-interrogation.md](01-brief-interrogation.md)         | Listed ambiguities in the brief     | Useful, but over-scoped (~50 questions); I re-scoped |
| 02  | [02-design-doc.md](02-design-doc.md)                           | Wrote DESIGN.md, listed 7 conflicts | Good; fixes from second review                       |
| 03  | [03-setup-app-and-db.md](03-setup-app-and-db.md)               | Next.js + Prisma + seed             | Accepted after checking DB                           |
| 04  | [04-decide-on-rule-deletion.md](04-decide-on-rule-deletion.md) | Cascade delete                      | My decision (#…)                                     |
| 05  | [05-pipeline.md](05-pipeline.md)                               | Ingestion, matching, channels       | Bug found: failed emails marked sent                 |
| 06  | [06-admin-page.md](06-admin-page.md)                           | Admin view, inject, retry           | Accepted; counts reconciled by hand                  |
| 07  | [07-user-page.md](07-user-page.md)                             | User page, rule create/delete       | Bug found: form reset; Slack URL check weak          |

## Raw conversations

- `raw/` — full exports of the VS Code sessions
