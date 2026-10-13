## Prompt

Build the user page at /, using the existing lib/ code:

1. A dropdown to switch between seeded users (no auth, as decided).
2. A list of the selected user's rules, each with a Delete button.
   Deleting a rule should also delete its deliveries (cascade). Check the
   schema does this, and add a migration if it doesn't.
3. A "create rule" form: threshold, and a channel picked from the
   channel registry, with that channel's config field (email address or
   Slack webhook URL). Validate using the adapter's validateConfig().
   Don't check the channel type in the page.
4. Also make links visible on /admin. They currently look like plain text.

Show me: creating a rule, injecting an event that matches it, and the
delivery appearing in /admin.

## Response

The user page at `/` works, and I showed the full flow in the browser. Admin links are now blue and underlined, and typecheck and lint pass.

**What the browser run showed** (headless Chrome, as before)

1. **Switch user:** I picked Bob in the dropdown, and the heading changed to "Bob's rules".
2. **Bad config rejected:** with Slack selected, the form showed the "Slack webhook URL" field. A URL starting `http://` was rejected by the Slack adapter's own check: `Not saved: A 'webhookUrl' starting with https:// is required`.
3. **Rule created:** with a valid webhook URL, the page showed `Rule created`. The new rule appeared as `≥ 7 | slack | https://hooks.slack.com/services/T…HOOK`.
4. **Matching event:** I injected a simulated M 7.2 on `/admin`, which reported `sent 4, failed 0`. The deliveries table shows `[SIMULATED] M 7.2 - Simulated earthquake | Bob / slack | sent | 1`, along with Bob's email rule and Alice's two rules.
5. **Delete:** deleting the rule removed it from the list, and its deliveries were removed with it (1 before, 0 after). No migration was needed: the schema already has `onDelete: Cascade` and the migration has `ON DELETE CASCADE`.

**Two bugs found while testing, both fixed**

- **The create form submitted the wrong channel after an error.** React 19 resets a form after its action runs. That put the channel dropdown back to "Email" while the page still showed the Slack field, so the next submit sent `channelType=email`. The form now submits through `onSubmit` + `startTransition`, so it isn't reset and keeps what the user typed.
- **The dropdown showed the wrong user.** After switching to Bob it reset to "Alice", even though Bob's rules were shown. The dropdown now calls the switch action directly, and it re-mounts whenever the user changes.

**How it fits the existing code**

- **Channel fields come from the adapter:** each adapter now lists its own `configFields`, e.g. email has `to` and Slack has `webhookUrl`. The form renders whatever the selected adapter lists, and the page never checks the channel type.
- **Rule logic lives in `lib/`:** [lib/rules.ts](lib/rules.ts) checks the threshold with the category's metric and the config with the adapter's `validateConfig()`. It only deletes a rule if it belongs to the current user.
- **Current user:** [lib/current-user.ts](lib/current-user.ts) keeps it in a cookie, with no auth.
- **Shared UI:** the action form and the stylesheet moved up to `app/` so both pages use them. The unused scaffold `page.module.css` is deleted, and `/admin` now has a "← User view" link.

**Assumptions**

- **Default user:** with no cookie set, the page acts as the first normal user alphabetically (Alice). The admin user can also be picked from the dropdown.
- **Form values:** they stay filled in after a successful create, so creating a similar rule is quick.
- **Duplicate rules:** nothing stops a user creating two identical rules. That's how Bob briefly had two Slack rules and two Slack deliveries for one event. I removed the leftover test rule, so Bob is back to his single email rule.

None of this is committed yet.
