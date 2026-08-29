import slugify from "slugify";
import { randomBytes } from "crypto";

export function createSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function createUniqueSlug(text: string, suffix?: string): string {
  const base = createSlug(text);
  if (suffix) return `${base}-${suffix}`;
  const shortId = randomBytes(3).toString("hex");
  return `${base}-${shortId}`;
}

export function normalizeName(name: string): string {
  const numberWords: Record<string, string> = {
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
  };

  return name
    .toLowerCase()
    .replace(/tamagotchi\s*/gi, "")
    .replace(/\bversion\s+(\d+)\b/gi, "v$1")
    .replace(/\bversion\s+(one|two|three|four|five|six)\b/gi, (_, w) => `v${numberWords[w]}`)
    .replace(/\bver\.?\s*(\d+)\b/gi, "v$1")
    .replace(/\bver\.?\s*(one|two|three|four|five|six)\b/gi, (_, w) => `v${numberWords[w]}`)
    .replace(/\bv\s+(\d+)\b/gi, "v$1")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
