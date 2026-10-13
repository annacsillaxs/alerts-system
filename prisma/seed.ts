import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { name: "Admin", email: "admin@example.com", role: "admin" },
  });
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { name: "Alice", email: "alice@example.com", role: "user" },
  });
  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { name: "Bob", email: "bob@example.com", role: "user" },
  });

  const earthquake = await prisma.category.upsert({
    where: { key: "earthquake" },
    update: {},
    create: { key: "earthquake", name: "Earthquake", metricType: "magnitude" },
  });

  // Rules have no natural unique key, so reset them to keep the seed re-runnable.
  await prisma.delivery.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.rule.createMany({
    data: [
      {
        userId: alice.id,
        categoryId: earthquake.id,
        threshold: 4.5,
        channelType: "email",
        channelConfig: JSON.stringify({ to: alice.email }),
      },
      {
        userId: alice.id,
        categoryId: earthquake.id,
        threshold: 6,
        channelType: "slack",
        channelConfig: JSON.stringify({
          webhookUrl: "https://hooks.slack.com/services/T000/B000/MOCK-ALICE",
        }),
      },
      {
        userId: bob.id,
        categoryId: earthquake.id,
        threshold: 2.5,
        channelType: "email",
        channelConfig: JSON.stringify({ to: bob.email }),
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    rules: await prisma.rule.count(),
  };
  console.log("Seeded:", counts, "admin:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
