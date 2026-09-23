import { describe, expect, it } from "vitest";
import uk from "../messages/uk.json";
import ru from "../messages/ru.json";
import en from "../messages/en.json";

function keys(obj: unknown, prefix = ""): string[] {
  if (!obj || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("i18n messages", () => {
  const base = keys(uk).sort();
  it.each([
    ["ru", ru],
    ["en", en],
  ])("%s has exactly the same keys as uk", (_, messages) => {
    expect(keys(messages).sort()).toEqual(base);
  });
});
