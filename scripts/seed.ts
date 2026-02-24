import { init, id, tx } from "@instantdb/admin";
import schema from "../instant.schema";
import fs from "fs";
import path from "path";

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID;
const ADMIN_TOKEN = process.env.INSTANTDB_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error("Missing NEXT_PUBLIC_INSTANTDB_APP_ID or INSTANTDB_ADMIN_TOKEN");
  process.exit(1);
}

const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

interface UserJson {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  linkedin: string;
  created_at: string;
  updated_at: string;
  events: { event: string }[];
  [key: string]: unknown;
}

interface CsvRow {
  email: string;
  location: string;
  linkedin: string;
  current_title_and_company: string;
  prior_title_and_company: string;
  school_and_degree: string;
  internal_notes: string;
  created_at: string;
}

function parseCsv(raw: string): CsvRow[] {
  const lines = raw.split("\n");
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]);
  const results: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (values[idx] ?? "").trim();
    });
    results.push(obj as unknown as CsvRow);
  }
  return results;
}

function parseRow(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  values.push(current);
  return values;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybePick<T>(arr: T[], chance = 0.7): T | null {
  return Math.random() < chance ? pick(arr) : null;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => {
      if (w.length <= 2 && w !== "ai") return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

async function clearTable(table: string) {
  const data = await (db as unknown as { query: (q: Record<string, object>) => Promise<Record<string, { id: string }[]>> }).query({ [table]: {} });
  const rows = data[table] ?? [];
  if (rows.length === 0) return;
  console.log(`  Deleting ${rows.length} existing ${table}...`);
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.transact(batch.map((r) => (tx as any)[table][r.id].delete()));
  }
}

async function seed() {
  console.log("Clearing existing data...");
  await clearTable("applicationAnswers");
  await clearTable("applications");
  await clearTable("eventQuestions");
  await clearTable("events");
  await clearTable("users");

  console.log("Loading data files...");

  const usersRaw: UserJson[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/users.json"), "utf-8")
  );
  const csvRaw = fs.readFileSync(
    path.join(__dirname, "../data/attendee_list.csv"),
    "utf-8"
  );
  const csvRows = parseCsv(csvRaw);

  const csvByEmail = new Map<string, CsvRow>();
  for (const row of csvRows) {
    const email = row.email?.toLowerCase().trim();
    if (!email) continue;
    const existing = csvByEmail.get(email);
    if (
      !existing ||
      new Date(row.created_at) > new Date(existing.created_at)
    ) {
      csvByEmail.set(email, row);
    }
  }

  console.log(`Loaded ${usersRaw.length} users, ${csvRows.length} CSV rows (${csvByEmail.size} unique emails)`);

  const uniqueLocations = [...new Set(csvRows.map((r) => r.location?.trim()).filter(Boolean))];
  const uniqueTitles = [...new Set(csvRows.map((r) => r.current_title_and_company?.trim()).filter(Boolean))];
  const uniquePriorTitles = [...new Set(csvRows.map((r) => r.prior_title_and_company?.trim()).filter(Boolean))];
  const uniqueSchools = [...new Set(csvRows.map((r) => r.school_and_degree?.trim()).filter(Boolean))];
  const uniqueNotes = [...new Set(csvRows.map((r) => r.internal_notes?.trim()).filter(Boolean))];

  console.log(`Unique pools — locations: ${uniqueLocations.length}, titles: ${uniqueTitles.length}, prior: ${uniquePriorTitles.length}, schools: ${uniqueSchools.length}, notes: ${uniqueNotes.length}`);

  const eventSlugs = new Set<string>();
  for (const u of usersRaw) {
    if (u.events) {
      for (const e of u.events) {
        if (e.event) eventSlugs.add(e.event);
      }
    }
  }

  console.log(`Creating ${usersRaw.length} users...`);
  const BATCH_SIZE = 100;
  let enrichedCount = 0;

  for (let i = 0; i < usersRaw.length; i += BATCH_SIZE) {
    const batch = usersRaw.slice(i, i + BATCH_SIZE);
    const txns = batch.map((u) => {
      const email = u.email?.toLowerCase().trim();
      const csvMatch = csvByEmail.get(email);

      if (csvMatch) {
        enrichedCount++;
      }

      const userData: Record<string, unknown> = {
        email,
        firstName: u.first_name || "",
        lastName: u.last_name || "",
        linkedin: csvMatch?.linkedin || u.linkedin || null,
        location: csvMatch?.location || maybePick(uniqueLocations, 0.85),
        currentTitleAndCompany: csvMatch?.current_title_and_company || maybePick(uniqueTitles, 0.8),
        priorTitleAndCompany: csvMatch?.prior_title_and_company || maybePick(uniquePriorTitles, 0.6),
        schoolAndDegree: csvMatch?.school_and_degree || maybePick(uniqueSchools, 0.75),
        internalNotes: csvMatch?.internal_notes || maybePick(uniqueNotes, 0.3),
        isAdmin: false,
        createdAt: u.created_at || new Date().toISOString(),
        updatedAt: u.updated_at || null,
      };

      return tx.users[id()].update(userData);
    });
    await db.transact(txns);
    console.log(`  Users ${i + 1} – ${Math.min(i + BATCH_SIZE, usersRaw.length)}`);
  }

  console.log(`  ${enrichedCount} users enriched from CSV`);

  const slugArray = Array.from(eventSlugs);
  console.log(`Creating ${slugArray.length} events: ${slugArray.join(", ")}`);
  const eventTxns = slugArray.map((slug) =>
    tx.events[id()].update({
      slug,
      title: titleFromSlug(slug),
      description: `Welcome to ${titleFromSlug(slug)}! More details coming soon.`,
      status: "draft",
      createdAt: new Date().toISOString(),
    })
  );
  await db.transact(eventTxns);

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
