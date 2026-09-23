import { z } from "zod";
import { toMinor } from "@/lib/money";
import { normalizeCode } from "@/features/promo/validate";

const optInt = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .pipe(z.number().int().min(0).max(1_000_000).nullable());
const optDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "invalid");

export const promoSchema = z
  .object({
    id: z.string().max(40).optional(),
    code: z
      .string()
      .transform(normalizeCode)
      .pipe(z.string().min(3, "required").max(40, "tooLong").regex(/^[A-Z0-9_-]+$/, "invalid")),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.coerce.number().positive("required").max(1_000_000),
    minOrder: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : toMinor(v)))
      .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "invalid"),
    startsAt: optDate,
    endsAt: optDate,
    usageLimit: optInt,
    perUserLimit: optInt,
    isActive: z.boolean().default(true),
    description: z.string().trim().max(200).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.type === "PERCENTAGE" && (v.value > 100 || !Number.isInteger(v.value))) ctx.addIssue({ code: "custom", path: ["value"], message: "invalid" });
    if (v.startsAt && v.endsAt && v.endsAt < v.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "invalid" });
  });
