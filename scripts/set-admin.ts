import { init, tx } from "@instantdb/admin";
import schema from "../instant.schema";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error("Missing NEXT_PUBLIC_INSTANTDB_APP_ID or INSTANTDB_ADMIN_TOKEN in .env.local");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun run scripts/set-admin.ts <email>");
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

async function setAdmin() {
  const { users } = await db.query({ users: { $: { where: { email: email.toLowerCase() } } } });

  if (users.length === 0) {
    console.log(`No user found with email "${email}". Creating one...`);
    const { id } = await import("@instantdb/admin");
    const newId = id();
    await db.transact(
      tx.users[newId].update({
        email: email.toLowerCase(),
        firstName: email.split("@")[0],
        lastName: "",
        isAdmin: true,
        createdAt: new Date().toISOString(),
      })
    );
    console.log(`Created admin user: ${email}`);
  } else {
    const user = users[0];
    await db.transact(tx.users[user.id].update({ isAdmin: true }));
    console.log(`Set isAdmin=true for ${email} (id: ${user.id})`);
  }
}

setAdmin().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
