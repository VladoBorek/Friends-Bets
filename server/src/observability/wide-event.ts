import { logger } from "./logger";

type WideEventFields = Record<string, unknown>;

type WideEventBuilderInput = {
  requestId: string;
  method: string;
  path: string;
};

function getOutcome(statusCode: number): "success" | "client_error" | "server_error" {
  if (statusCode >= 500) {
    return "server_error";
  }

  if (statusCode >= 400) {
    return "client_error";
  }

  return "success";
}

export class WideEventBuilder {
  private readonly startedAtMs = Date.now();
  private readonly fields: WideEventFields;
  private emitted = false;

  constructor(input: WideEventBuilderInput) {
    this.fields = {
      event_name: "http_request",
      service_name: process.env.SERVICE_NAME ?? "pb138-server",
      service_version: process.env.SERVICE_VERSION ?? process.env.npm_package_version,
      environment: process.env.NODE_ENV ?? "development",
      request_id: input.requestId,
      method: input.method,
      path: input.path,
    };
  }

  add(fields: WideEventFields): void {
    Object.assign(this.fields, fields);
  }

  setUserId(userId: number | string | null | undefined): void {
    if (userId !== null && userId !== undefined) {
      this.fields.user_id = String(userId);
    }
  }

  setError(error: {
    type?: string;
    code?: string;
    message?: string;
    stack?: string;
  }): void {
    this.fields.error_type = error.type;
    this.fields.error_code = error.code;
    this.fields.error_message = error.message;
    this.fields.error_stack = error.stack;
  }

  emit(statusCode: number): void {
    if (this.emitted) {
      return;
    }

    this.emitted = true;

    const durationMs = Date.now() - this.startedAtMs;
    const outcome = getOutcome(statusCode);

    logger.info({
      ...this.fields,
      status_code: statusCode,
      duration_ms: durationMs,
      outcome,
    });
  }
}