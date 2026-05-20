import type { ApiErrorCode } from "@pb138/shared/schemas/api";

export type ErrorCode = ApiErrorCode;

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "HttpError";
  }
}

export function toErrorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }

  return "Unexpected server error";
}