1. The brief interrogation produced ~50 questions; answering all of them produced a design too big for the timebox. I re-scoped and moved several decisions to documented-only.

2. Asked AI to surface conflicts rather than resolve them; it found 7.

3. 03-setup-app-and-db promt:
   It caught that the scaffold’s .env\* rule would hide .env.example, explained the LayoutProps failure instead of hacking around it, and flagged the audit warnings rather than blindly “fixing” them.

   Ran 'npx prisma studio' to check the DB - works

   Ran 'npm run dev' - works

   Deleted src/ from the DESIGN.md §6 and moved app/ and lib/ to the top level.

4. Design assumed every USGS feature is an earthquake

- **Source:** DESIGN.md §5 (USGS source), prompt 02
- **Problem:** the live feed also contains `explosion` and `quarry blast` events
- **How it was caught:** I inspected a real feed response before the parser was written
- **Action:** filter on `properties.type === "earthquake"`, count the
  skipped ones in the ingestion summary; decision #54

5. 05-pipeline

- It sent POST requests to my other app on port 3000.
- **70 emails to Bob in one day.** That's alert flooding, which I deferred in #20.
- Folder layout - scr/ was deleted from DESIGN.md
- checked one of the delivered email alert's event and checked it against the source - verified - see screenshots folder

6. Admin page
   The numbers reconcile. The earlier runs gave 72 sent. 6 deliveries were deleted with the 3 test events, and run 5 re-sent 1, so 72 − 6 + 1 = 67. That’s exactly what the page shows. The retry then took it to 68, and the injected M 6.5 matched exactly 3 rules (Alice email ≥ 4.5, Alice Slack ≥ 6, Bob email ≥ 2.5), which is correct.

   An empty magnitude field used to pass validation as 0, because Number("") is 0. It's now rejected. - validated, see screenshots/empty-magnituded-fixed.png

7. User page - Slack adapter accepts any https URL

- **Source:** Slack mock adapter validateConfig, prompt 06
- **Problem:** `https://google.com` is accepted as a Slack webhook; only
  the https:// prefix is checked, not the host
- **How it was caught:** I tested the form with a non-Slack URL
- **Action:** not fixed (Slack is mocked, nothing is sent). Before a real
  Slack adapter: only allow https://hooks.slack.com/. Added to Known issues.
