import type { ErrorCode, SafeErrorDetails } from "../errors";

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    details?: SafeErrorDetails;
  };
};

type BuildErrorResponseInput = {
  code: ErrorCode;
  message: string;
  requestId: string;
  details?: SafeErrorDetails;
};

export function buildErrorResponse(input: BuildErrorResponseInput): ApiErrorBody {
  return {
    error: {
      code: input.code,
      message: input.message,
      requestId: input.requestId,
      ...(input.details === undefined ? {} : { details: input.details }),
    },
  };
}