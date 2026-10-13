1. The brief interrogation produced ~50 questions; answering all of them produced a design too big for the timebox. I re-scoped and moved several decisions to documented-only.

2. Asked AI to surface conflicts rather than resolve them; it found 7.

3. 03-setup-app-and-db promt:
   It caught that the scaffold’s .env\* rule would hide .env.example, explained the LayoutProps failure instead of hacking around it, and flagged the audit warnings rather than blindly “fixing” them.

   Ran 'npx prisma studio' to check the DB - works

   Ran 'npm run dev' - works

   Deleted src/ from the DESIGN.md §6 and moved app/ and lib/ to the top level.
