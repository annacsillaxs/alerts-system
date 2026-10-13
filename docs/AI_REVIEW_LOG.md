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
