import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeConnection, db } from "./db";

async function main() {
  try {
    await migrate(db, {
      migrationsFolder: "drizzle",
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
