type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN =
  /(password|token|secret|cookie|authorization|auth_session|reset_link|resetLink)/i;

function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return "[MaxDepth]";
  }

  if (value instanceof Error) {
    return {
      type: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeLogValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[Redacted]" : sanitizeLogValue(nestedValue, depth + 1),
      ]),
    );
  }

  return value;
}

function writeLog(level: LogLevel, fields: LogFields): void {
  const entry = sanitizeLogValue({
    timestamp: new Date().toISOString(),
    level,
    ...fields,
  });

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const logger = {
  info: (fields: LogFields) => writeLog("info", fields),
  warn: (fields: LogFields) => writeLog("warn", fields),
  error: (fields: LogFields) => writeLog("error", fields),
};