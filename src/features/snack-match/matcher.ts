import { z } from "zod";

/** Question ids and answer options. Texts live in messages/*.json → snackMatch.questions. */
export const QUESTIONS = [
  { id: "sweet", options: ["love", "sometimes", "no"] },
  { id: "spicy", options: ["fire", "mild", "no"] },
  { id: "format", options: ["drink", "snack", "both"] },
  { id: "unusual", options: ["yes", "classic"] },
  { id: "adventure", options: ["1", "2", "3"] },
] as const;

export const answersSchema = z.object({
  sweet: z.enum(["love", "sometimes", "no"]),
  spicy: z.enum(["fire", "mild", "no"]),
  format: z.enum(["drink", "snack", "both"]),
  unusual: z.enum(["yes", "classic"]),
  adventure: z.enum(["1", "2", "3"]),
});
export type Answers = z.infer<typeof answersSchema>;

export type MatchCandidate = { tags: string[]; spiceLevel: number; categorySlug: string };

/**
 * Rule-based scoring (no AI). Each answer nudges the score using product tags,
 * spice level and category. Higher = better match.
 */
export function scoreProduct(p: MatchCandidate, a: Answers): number {
  const has = (t: string) => p.tags.includes(t);
  const isDrink = has("drink") || p.categorySlug === "drinks";
  const isMystery = p.categorySlug === "mystery-box";
  let s = 0;

  // sweet tooth
  if (a.sweet === "love") s += has("sweet") ? 3 : -1;
  else if (a.sweet === "sometimes") s += has("sweet") ? 1 : 0;
  else if (has("sweet") && !has("salty") && !has("spicy")) s -= 3;

  // heat tolerance
  if (a.spicy === "fire") s += p.spiceLevel >= 3 ? 4 : p.spiceLevel > 0 ? 1 : -1;
  else if (a.spicy === "mild") s += p.spiceLevel >= 1 && p.spiceLevel <= 2 ? 2 : p.spiceLevel >= 4 ? -3 : 0;
  else if (p.spiceLevel >= 2) s -= 6;

  // format
  if (a.format === "drink") s += isDrink ? 4 : -1;
  else if (a.format === "snack") s += isDrink ? -4 : 1;

  // novelty
  if (a.unusual === "yes") s += has("unusual") ? 2 : 0;
  else s += has("classic") ? 2 : has("unusual") ? -1 : 0;

  // adventurousness
  if (a.adventure === "3") s += (has("extreme") ? 2 : 0) + (has("unusual") ? 1 : 0) + (isMystery ? 2 : 0);
  else if (a.adventure === "1") s += (has("extreme") ? -3 : 0) + (isMystery ? -2 : 0) + (has("classic") ? 1 : 0);

  return s;
}

export function rankProducts<T extends MatchCandidate & { id: string; stock: number }>(products: T[], a: Answers, take = 6): T[] {
  return products
    .filter((p) => p.stock > 0)
    .map((p) => ({ p, s: scoreProduct(p, a) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || x.p.id.localeCompare(y.p.id))
    .slice(0, take)
    .map((x) => x.p);
}
