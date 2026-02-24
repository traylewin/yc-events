import { Pinecone } from "@pinecone-database/pinecone";
import { init } from "@instantdb/admin";
import schema from "../instant.schema";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN;

if (!PINECONE_API_KEY || !APP_ID || !ADMIN_TOKEN) {
  console.error("Missing env vars. Need: PINECONE_API_KEY, NEXT_PUBLIC_INSTANTDB_APP_ID, INSTANTDB_ADMIN_TOKEN");
  process.exit(1);
}

const INDEX_NAME = "users";
const EMBEDDING_MODEL = "multilingual-e5-large";
const DIMENSION = 1024;

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

function buildUserText(user: Record<string, unknown>): string {
  const parts: string[] = [];

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (name) parts.push(`Name: ${name}`);
  if (user.email) parts.push(`Email: ${user.email}`);
  if (user.location) parts.push(`Location: ${user.location}`);
  if (user.currentTitleAndCompany) parts.push(`Current role: ${user.currentTitleAndCompany}`);
  if (user.priorTitleAndCompany) parts.push(`Previous role: ${user.priorTitleAndCompany}`);
  if (user.schoolAndDegree) parts.push(`Education: ${user.schoolAndDegree}`);
  if (user.linkedin) parts.push(`LinkedIn: ${user.linkedin}`);
  if (user.internalNotes) parts.push(`Notes: ${user.internalNotes}`);

  return parts.join(". ");
}

async function ensureIndex() {
  const existing = await pc.listIndexes();
  const found = existing.indexes?.find((idx) => idx.name === INDEX_NAME);

  if (!found) {
    console.log(`Creating Pinecone index "${INDEX_NAME}"...`);
    await pc.createIndex({
      name: INDEX_NAME,
      dimension: DIMENSION,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    });
    console.log("Waiting for index to be ready...");
    await new Promise((r) => setTimeout(r, 15000));
  } else {
    console.log(`Index "${INDEX_NAME}" already exists.`);
  }
}

async function ingest() {
  await ensureIndex();

  console.log("Fetching users from InstantDB...");
  const { users } = await db.query({ users: {} });
  console.log(`Found ${users.length} users.`);

  const index = pc.index(INDEX_NAME);
  const BATCH_SIZE = 96;
  let upserted = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const texts = batch.map((u) => buildUserText(u));

    const embeddings = await pc.inference.embed({
      model: EMBEDDING_MODEL,
      inputs: texts,
      parameters: { inputType: "passage", truncate: "END" },
    });

    const records = batch.map((user, idx) => ({
      id: user.id,
      values: (embeddings.data?.[idx] as unknown as { values: number[] })?.values ?? [],
      metadata: {
        email: String(user.email ?? ""),
        firstName: String(user.firstName ?? ""),
        lastName: String(user.lastName ?? ""),
        location: String(user.location ?? ""),
        currentTitleAndCompany: String(user.currentTitleAndCompany ?? ""),
        priorTitleAndCompany: String(user.priorTitleAndCompany ?? ""),
        schoolAndDegree: String(user.schoolAndDegree ?? ""),
        internalNotes: String(user.internalNotes ?? ""),
        text: texts[idx],
      },
    }));

    await index.upsert({ records });
    upserted += batch.length;
    console.log(`  Upserted ${upserted} / ${users.length}`);
  }

  console.log(`Done! ${upserted} users ingested into Pinecone index "${INDEX_NAME}".`);
}

ingest().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
