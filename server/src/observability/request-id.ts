import { randomUUID } from "node:crypto";

const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_MAX_LENGTH = 128;
const SAFE_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

export function resolveRequestId(headers?: Record<string, string | string[] | undefined>): string {
  const incomingRequestId = normalizeHeaderValue(headers?.[REQUEST_ID_HEADER])?.trim();

  if (
    incomingRequestId &&
    incomingRequestId.length <= REQUEST_ID_MAX_LENGTH &&
    SAFE_REQUEST_ID_PATTERN.test(incomingRequestId)
  ) {
    return incomingRequestId;
  }

  return randomUUID();
}
