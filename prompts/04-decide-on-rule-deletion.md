## Prompt

Use cascade delete for Rule → Delivery, and update the migration.

## Response

Deleting a rule now also deletes its deliveries, and I confirmed it works in the database.

- **Schema:** `Delivery.rule` now has `onDelete: Cascade` in [prisma/schema.prisma](prisma/schema.prisma).
- **Migration:** I regenerated the init migration rather than adding a second one. The old `20261013084439_init` is replaced by [20261013090444_init](prisma/migrations/20261013090444_init/migration.sql). That file now contains `"Delivery_ruleId_fkey" … ON DELETE CASCADE`. All other foreign keys still block deletes, which is Prisma's default.
- **Test:** I created a test event and a delivery, then deleted the rule. Deliveries went from 1 to 0 and the event remained. I then removed the test data.
- **Database:** I reset and re-seeded it, so it holds the same 3 users, 1 category and 3 rules as before. `tsc` passes.

**Assumptions**

- "Update the migration" meant editing the existing one, not adding a second. That was safe because the init migration was never committed and the database held only seed data. Once migrations are committed, schema changes should go in a new migration instead.
- I kept the delete on `Delivery.event` blocked, since you only asked about Rule → Delivery. Events can't be deleted in the slice anyway.
