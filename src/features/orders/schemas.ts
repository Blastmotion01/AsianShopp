import { z } from "zod";
import { NEEDS_ADDRESS, NEEDS_BRANCH, DNIPRO_ONLY } from "@/lib/integrations/delivery";

/** Normalizes Ukrainian phone numbers to +380XXXXXXXXX. */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^0\d{9}$/.test(digits)) return `+38${digits}`;
  if (/^380\d{9}$/.test(digits)) return `+${digits}`;
  return digits;
}

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^\+380\d{9}$/, "phone"));

const text = (max: number) => z.string().trim().min(1, "required").max(max, "tooLong");

export const checkoutSchema = z
  .object({
    firstName: text(60),
    lastName: text(60),
    phone: phoneSchema,
    email: z.string().trim().toLowerCase().pipe(z.email("email")),
    city: text(80),
    deliveryMethod: z.enum(["NOVA_POSHTA_BRANCH", "NOVA_POSHTA_COURIER", "COURIER_DNIPRO", "PICKUP_DNIPRO"], "required"),
    branch: z.string().trim().max(120, "tooLong").optional().default(""),
    address: z.string().trim().max(200, "tooLong").optional().default(""),
    comment: z.string().trim().max(1000, "tooLong").optional().default(""),
    paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD_ONLINE"], "required"),
    saveAddress: z.boolean().optional().default(false),
  })
  .superRefine((v, ctx) => {
    if (NEEDS_BRANCH.includes(v.deliveryMethod) && !v.branch) ctx.addIssue({ code: "custom", path: ["branch"], message: "required" });
    if (NEEDS_ADDRESS.includes(v.deliveryMethod) && !v.address) ctx.addIssue({ code: "custom", path: ["address"], message: "required" });
  })
  .transform((v) => ({
    ...v,
    // Dnipro-only methods always ship to Dnipro regardless of what was typed.
    city: DNIPRO_ONLY.includes(v.deliveryMethod) ? "Дніпро" : v.city,
    branch: NEEDS_BRANCH.includes(v.deliveryMethod) ? v.branch : "",
    address: NEEDS_ADDRESS.includes(v.deliveryMethod) ? v.address : "",
  }));

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
