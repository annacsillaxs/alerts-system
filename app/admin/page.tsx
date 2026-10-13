import { Suspense } from "react";
import { describeChannelConfig } from "@/lib/channels/registry";
import { db } from "@/lib/db";
import { ActionForm } from "./action-form";
import { injectSimulatedEventAction, retryDeliveryAction, runIngestionAction } from "./actions";
import styles from "./admin.module.css";

export const metadata = { title: "Admin · Alerts" };

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <h1>Admin</h1>
      <section className={styles.actions}>
        <ActionForm action={runIngestionAction} label="Run ingestion now" />
        <ActionForm action={injectSimulatedEventAction} label="Inject simulated event">
          <label>
            Magnitude{" "}
            <input name="magnitude" type="number" step="0.1" min="-2" max="10" required defaultValue="5.0" />
          </label>
        </ActionForm>
      </section>
      <Suspense fallback={<p>Loading…</p>}>
        <AdminData />
      </Suspense>
    </main>
  );
}

const utc = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);

async function AdminData() {
  const [users, rules, events, sent, failed, recentEvents, allRules, recentDeliveries] = await Promise.all([
    db.user.count(),
    db.rule.count(),
    db.event.count(),
    db.delivery.count({ where: { status: "sent" } }),
    db.delivery.count({ where: { status: "failed" } }),
    db.event.findMany({ orderBy: { occurredAt: "desc" }, take: 15 }),
    db.rule.findMany({ include: { user: true, category: true }, orderBy: { createdAt: "asc" } }),
    db.delivery.findMany({
      orderBy: { updatedAt: "desc" },
      take: 25,
      include: { event: true, rule: { include: { user: true } } },
    }),
  ]);

  return (
    <>
      <section className={styles.counts}>
        <Count label="Users" value={users} />
        <Count label="Rules" value={rules} />
        <Count label="Events" value={events} />
        <Count label="Deliveries sent" value={sent} />
        <Count label="Deliveries failed" value={failed} />
      </section>

      <h2>Recent events</h2>
      <table className={styles.table}>
        <thead>
          <tr><th>Occurred (UTC)</th><th>Title</th><th>Source</th></tr>
        </thead>
        <tbody>
          {recentEvents.map((e) => (
            <tr key={e.id}>
              <td>{utc(e.occurredAt)}</td>
              <td>
                {e.sourceUrl ? <a href={e.sourceUrl}>{e.title}</a> : e.title}
              </td>
              <td>{e.source === "simulated" ? <strong>[SIMULATED]</strong> : e.source}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Rules</h2>
      <table className={styles.table}>
        <thead>
          <tr><th>User</th><th>Category</th><th>Threshold</th><th>Channel</th><th>Destination</th></tr>
        </thead>
        <tbody>
          {allRules.map((r) => (
            <tr key={r.id}>
              <td>{r.user.name}</td>
              <td>{r.category.name}</td>
              <td>≥ {r.threshold}</td>
              <td>{r.channelType}</td>
              <td>{describeChannelConfig(r.channelType, r.channelConfig)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Recent deliveries</h2>
      <table className={styles.table}>
        <thead>
          <tr><th>Updated (UTC)</th><th>Event</th><th>User / channel</th><th>Status</th><th>Attempts</th><th>Error</th><th></th></tr>
        </thead>
        <tbody>
          {recentDeliveries.map((d) => (
            <tr key={d.id}>
              <td>{utc(d.updatedAt)}</td>
              <td>{d.event.source === "simulated" ? `[SIMULATED] ${d.event.title}` : d.event.title}</td>
              <td>{d.rule.user.name} / {d.rule.channelType}</td>
              <td className={styles[d.status]}>{d.status}</td>
              <td>{d.attempts}</td>
              <td>{d.lastError}</td>
              <td>
                {d.status === "failed" && (
                  <ActionForm action={retryDeliveryAction} label="Retry">
                    <input type="hidden" name="deliveryId" value={d.id} />
                  </ActionForm>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.count}>
      <div className={styles.countValue}>{value}</div>
      <div>{label}</div>
    </div>
  );
}
