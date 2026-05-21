import { randomUUID } from "node:crypto";

const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_MAX_LENGTH = 128;
const SAFE_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;

export function resolveRequestId(headers: Record<string, string | undefined>): string {
  const incomingRequestId = headers[REQUEST_ID_HEADER]?.trim();

  if (
    incomingRequestId &&
    incomingRequestId.length <= REQUEST_ID_MAX_LENGTH &&
    SAFE_REQUEST_ID_PATTERN.test(incomingRequestId)
  ) {
    return incomingRequestId;
  }

  return randomUUID();
}