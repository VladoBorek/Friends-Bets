export async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json && typeof json === "object" && "message" in json
        ? String((json as { message: unknown }).message)
        : fallbackMessage;

    throw new Error(message);
  }

  return json;
}