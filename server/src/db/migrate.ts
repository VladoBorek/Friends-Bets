import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { closeConnection, db } from "./db";

const currentDir = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(currentDir, "../../../drizzle");

async function main() {
  try {
    await migrate(db, {
      migrationsFolder,
    });

    console.log("Migration script completed.");
  } catch (error) {
    console.error("Migration script failed:", error);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

void main();
