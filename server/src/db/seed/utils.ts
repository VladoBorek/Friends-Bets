import { faker } from "@faker-js/faker";

export function normalizeUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function randomInviteCode(): string {
  return faker.string.alphanumeric({ length: 8, casing: "upper" });
}

export function toMoney(value: number): string {
  return value.toFixed(2);
}

export function pickSome<T>(items: T[], min: number, max: number): T[] {
  return faker.helpers.arrayElements(items, {
    min: Math.min(min, items.length),
    max: Math.min(max, items.length),
  });
}