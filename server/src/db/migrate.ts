import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../observability";
import { closeConnection, db } from "./db";

const currentDir = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(currentDir, "../../../drizzle");

async function main() {
  try {
    await migrate(db, {
      migrationsFolder,
    });

    logger.info({
      event_name: "migration_completed",
    });
  } catch (error) {
    logger.error({
      event_name: "migration_failed",
      error,
    });

    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

void main();