## For README

- Setup: run `npx next typegen` before `tsc` on a clean checkout
- Known issue: npm audit reports high-severity issues in deepmerge-ts,
  via Prisma's dev tooling only. Accepted: the suggested fix would
  downgrade Prisma.
- nodemailer 10.1.0 is only 3 days old
