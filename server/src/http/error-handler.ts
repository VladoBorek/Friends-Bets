import { NotFoundError } from "elysia/error";
import { ZodError } from "zod";
import { HttpError, type ErrorCode, type SafeErrorDetails } from "../errors";
import { logger, resolveRequestId, type WideEventBuilder } from "../observability";
import { buildErrorResponse } from "./error-response";

type ResponseHeaders = Record<string, string | number | boolean | undefined>;

type ErrorHandlerContext = {
  error: unknown;
  headers: Record<string, string | undefined>;
  set: {
    status?: number | string;
    headers: ResponseHeaders;
  };
  wideEvent?: WideEventBuilder;
};

type ResolvedError = {
  status: number;
  code: ErrorCode;
  message: string;
  details?: SafeErrorDetails;
  logUnexpectedError: boolean;
};

function getResponseRequestId(headers: ResponseHeaders): string | null {
  const requestId = headers["x-request-id"];

  return typeof requestId === "string" && requestId.trim() ? requestId : null;
}

function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error";
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function resolveError(error: unknown): ResolvedError {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      code: error.code,
      message: error.publicMessage,
      details: error.details,
      logUnexpectedError: false,
    };
  }

  if (error instanceof NotFoundError) {
    return {
      status: 404,
      code: "ENDPOINT_NOT_FOUND",
      message: "Endpoint not found",
      logUnexpectedError: false,
    };
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
      : "Validation failed";

    return {
      status: 400,
      code: "VALIDATION_FAILED",
      message,
      details: error.issues,
      logUnexpectedError: false,
    };
  }

  return {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error",
    logUnexpectedError: true,
  };
}

export function handleAppError(context: ErrorHandlerContext) {
  const requestId = getResponseRequestId(context.set.headers) ?? resolveRequestId(context.headers);
  const resolvedError = resolveError(context.error);

  context.set.status = resolvedError.status;
  context.set.headers["content-type"] = "application/json; charset=utf-8";
  context.set.headers["x-request-id"] = requestId;

  context.wideEvent?.setError({
    type: getErrorName(context.error),
    code: resolvedError.code,
    message: getErrorMessage(context.error),
    stack: getErrorStack(context.error),
  });
  context.wideEvent?.emit(resolvedError.status);

  if (resolvedError.logUnexpectedError) {
    logger.error({
      event_name: "unexpected_error",
      request_id: requestId,
      error: context.error,
    });
  }

  return buildErrorResponse({
    code: resolvedError.code,
    message: resolvedError.message,
    details: resolvedError.details,
    requestId,
  });
}