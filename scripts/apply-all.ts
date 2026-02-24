import { init, id, tx } from "@instantdb/admin";
import schema from "../instant.schema";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error("Missing NEXT_PUBLIC_INSTANTDB_APP_ID or INSTANTDB_ADMIN_TOKEN");
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

async function applyAll() {
  console.log("Fetching users, events, and existing applications...");

  const [{ users }, { events }, { applications }] = await Promise.all([
    db.query({ users: {} }),
    db.query({ events: {} }),
    db.query({ applications: { user: {}, event: {} } }),
  ]);

  console.log(`Found ${users.length} users, ${events.length} events, ${applications.length} existing applications.`);

  const existing = new Set(
    applications.map((a) => {
      const userId = (a as unknown as { user: { id: string }[] }).user?.[0]?.id;
      const eventId = (a as unknown as { event: { id: string }[] }).event?.[0]?.id;
      return `${userId}:${eventId}`;
    })
  );

  const now = new Date().toISOString();
  const pairs: { userId: string; eventId: string }[] = [];

  for (const event of events) {
    for (const user of users) {
      if (!existing.has(`${user.id}:${event.id}`)) {
        pairs.push({ userId: user.id, eventId: event.id });
      }
    }
  }

  console.log(`${pairs.length} new applications to create (${existing.size} already exist).`);

  const BATCH_SIZE = 100;
  let created = 0;

  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);
    const txns = batch.map(({ userId, eventId }) =>
      tx.applications[id()]
        .update({ status: "applied", createdAt: now })
        .link({ user: userId, event: eventId })
    );
    await db.transact(txns);
    created += batch.length;
    console.log(`  Created ${created} / ${pairs.length}`);
  }

  console.log(`Done! ${created} applications created.`);
}

applyAll().catch((err) => {
  console.error("apply-all failed:", err);
  process.exit(1);
});
