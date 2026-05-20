import { createApp } from "./app";
import { readServerConfig } from "./config";
import { closeConnection } from "./db/db";
import { logger } from "./observability";
import { emailClient } from "./services/email-service";

const { port } = readServerConfig();
const app = createApp();

app.listen({
  port,
  hostname: "0.0.0.0",
});

void emailClient.verify().catch((error) => {
  logger.error({
    event_name: "email_client_verification_failed",
    error,
  });
});

logger.info({
  event_name: "server_started",
  port,
  rest_api_url: `http://localhost:${port}`,
  swagger_url: `http://localhost:${port}/swagger`,
});

const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

for (const signal of shutdownSignals) {
  process.once(signal, async () => {
    logger.info({
      event_name: "server_shutdown_started",
      signal,
    });

    await closeConnection();

    logger.info({
      event_name: "server_shutdown_completed",
      signal,
    });

    process.exit(0);
  });
}