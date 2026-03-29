import { closeConnection } from "./db/db";
import { readServerConfig } from "./config";
import { createApp } from "./app";

const { port } = readServerConfig();
const app = createApp();

app.listen(port);

console.log(`REST API running at http://localhost:${port}`);
console.log(`Swagger docs at http://localhost:${port}/swagger`);

const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

for (const signal of shutdownSignals) {
  process.once(signal, async () => {
    await closeConnection();
    process.exit(0);
  });
}
