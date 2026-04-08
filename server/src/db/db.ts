import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config();

if (!process.env.DATABASE_URL) {
  const envCandidates = [
    fileURLToPath(new URL("../../.env", import.meta.url)),
    fileURLToPath(new URL("../../../.env", import.meta.url)),
  ];

  for (const envPath of envCandidates) {
    dotenv.config({ path: envPath });
    if (process.env.DATABASE_URL) {
      break;
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and set DATABASE_URL.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export async function closeConnection(): Promise<void> {
  await pool.end();
}
