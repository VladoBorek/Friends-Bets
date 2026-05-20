import {
  apiErrorResponseSchema,
  type ApiErrorCode,
  type ApiErrorResponse,
} from "@pb138/shared/schemas/api";

type ApiClientErrorOptions = {
  message: string;
  status: number;
  code?: ApiErrorCode;
  requestId?: string;
  details?: unknown;
  body?: unknown;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;
  readonly requestId?: string;
  readonly details?: unknown;
  readonly body?: unknown;

  constructor(options: ApiClientErrorOptions) {
    super(options.message);

    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
    this.body = options.body;
  }
}

export async function readJsonResponse(response: Response): Promise<unknown> {
  const rawBody = await response.text().catch(() => "");
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) {
    return null;
  }

  try {
    return JSON.parse(trimmedBody) as unknown;
  } catch {
    return trimmedBody;
  }
}

function parseApiErrorResponse(body: unknown): ApiErrorResponse | null {
  const parsed = apiErrorResponseSchema.safeParse(body);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function extractApiErrorMessage(body: unknown, fallbackMessage: string): string {
  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }

  const apiError = parseApiErrorResponse(body);

  if (apiError?.error.message.trim()) {
    return apiError.error.message.trim();
  }

  if (body && typeof body === "object") {
    const legacyMessage = (body as { message?: unknown }).message;

    if (typeof legacyMessage === "string" && legacyMessage.trim()) {
      return legacyMessage.trim();
    }
  }

  return fallbackMessage;
}

export function createApiClientError(
  response: Response,
  body: unknown,
  fallbackMessage: string,
): ApiClientError {
  const apiError = parseApiErrorResponse(body);

  if (apiError) {
    return new ApiClientError({
      message: apiError.error.message,
      status: response.status,
      code: apiError.error.code,
      requestId: apiError.error.requestId,
      details: apiError.error.details,
      body,
    });
  }

  return new ApiClientError({
    message: extractApiErrorMessage(body, fallbackMessage),
    status: response.status,
    requestId: response.headers.get("x-request-id") ?? undefined,
    body,
  });
}

export async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw createApiClientError(response, json, fallbackMessage);
  }

  return json;
}