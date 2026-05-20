import { Elysia } from "elysia";
import { resolveRequestId } from "./request-id";
import { WideEventBuilder } from "./wide-event";

export type RequestContext = {
  requestId: string;
  wideEvent: WideEventBuilder;
};

function getPathFromRequest(request: Request): string {
  return new URL(request.url).pathname;
}

export const requestContextPlugin = new Elysia({ name: "request-context" })
  .derive(({ headers, request, set }): RequestContext => {
    const requestId = resolveRequestId(headers);
    const wideEvent = new WideEventBuilder({
      requestId,
      method: request.method,
      path: getPathFromRequest(request),
    });

    set.headers["x-request-id"] = requestId;

    return {
      requestId,
      wideEvent,
    };
  })
  .onAfterHandle(({ set, wideEvent }) => {
    const statusCode = typeof set.status === "number" ? set.status : 200;
    wideEvent.emit(statusCode);
  });