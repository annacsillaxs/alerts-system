import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/app/action-form";
import styles from "@/app/ui.module.css";
import { describeChannelConfig, listChannels } from "@/lib/channels/registry";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { getMetric } from "@/lib/metrics/registry";
import { deleteRuleAction } from "./actions";
import { RuleForm } from "./rule-form";
import { UserSwitcher } from "./user-switcher";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <h1>My alerts</h1>
      <p>
        <Link href="/admin">Admin view →</Link>
      </p>
      <Suspense fallback={<p>Loading…</p>}>
        <UserContent />
      </Suspense>
    </main>
  );
}

async function UserContent() {
  const [user, users, categories] = await Promise.all([
    getCurrentUser(),
    db.user.findMany({ orderBy: { name: "asc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!user) return <p>No users found. Run the seed.</p>;

  const rules = await db.rule.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
  const channels = listChannels().map(({ type, label, configFields }) => ({ type, label, configFields }));

  return (
    <>
      <UserSwitcher users={users} currentId={user.id} />

      <h2>{user.name}&apos;s rules</h2>
      {rules.length === 0 ? (
        <p>No rules yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr><th>Category</th><th>Threshold</th><th>Channel</th><th>Destination</th><th></th></tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>{r.category.name}</td>
                <td>≥ {r.threshold}</td>
                <td>{r.channelType}</td>
                <td>{describeChannelConfig(r.channelType, r.channelConfig)}</td>
                <td>
                  <ActionForm action={deleteRuleAction} label="Delete">
                    <input type="hidden" name="ruleId" value={r.id} />
                  </ActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Create a rule</h2>
      <RuleForm
        channels={channels}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          metricLabel: getMetric(c.metricType)?.label ?? c.metricType,
        }))}
      />
    </>
  );
}
