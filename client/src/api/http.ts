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

export function extractApiErrorMessage(body: unknown, fallbackMessage: string): string {
  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }

  if (body && typeof body === "object") {
    const error = (body as { error?: unknown }).error;

    if (error && typeof error === "object") {
      const message = (error as { message?: unknown }).message;

      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
    }

    const legacyMessage = (body as { message?: unknown }).message;

    if (typeof legacyMessage === "string" && legacyMessage.trim()) {
      return legacyMessage.trim();
    }
  }

  return fallbackMessage;
}

export async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(json, fallbackMessage));
  }

  return json;
}