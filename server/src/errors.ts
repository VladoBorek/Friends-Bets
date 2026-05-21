import type { ApiErrorCode } from "@pb138/shared/schemas/api";

export type ErrorCode = ApiErrorCode;
export type SafeErrorDetails = Record<string, unknown> | readonly unknown[];

type HttpErrorOptions = {
  status: number;
  code: ErrorCode;
  message: string;
  details?: SafeErrorDetails;
  cause?: unknown;
};

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly publicMessage: string;
  readonly details?: SafeErrorDetails;

  constructor(status: number, code: ErrorCode, message: string, details?: SafeErrorDetails);
  constructor(options: HttpErrorOptions);
  constructor(
    statusOrOptions: number | HttpErrorOptions,
    code?: ErrorCode,
    message?: string,
    details?: SafeErrorDetails,
  ) {
    const options =
      typeof statusOrOptions === "number"
        ? { status: statusOrOptions, code, message, details }
        : statusOrOptions;

    if (!options.code || !options.message) {
      throw new Error("HttpError requires status, code, and message");
    }

    super(options.message, "cause" in options ? { cause: options.cause } : undefined);

    this.name = "HttpError";
    this.status = options.status;
    this.code = options.code;
    this.publicMessage = options.message;
    this.details = options.details;
  }
}

export function toErrorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }

  return "Unexpected server error";
}