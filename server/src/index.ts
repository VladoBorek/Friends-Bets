import { closeConnection } from "./db/db";
import { readServerConfig } from "./config";
import { createApp } from "./app";
import { emailClient } from "./services/email-service";

const { port } = readServerConfig();
const app = createApp();

app.listen(port);
void emailClient.verify().catch((error) => {
  console.error("Email client verification failed:", error);
});

console.log(`REST API running at http://localhost:${port}`);
console.log(`Swagger docs at http://localhost:${port}/swagger`);

const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

for (const signal of shutdownSignals) {
  process.once(signal, async () => {
    await closeConnection();
    process.exit(0);
  });
}
