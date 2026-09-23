import { z } from "zod";
import { phoneSchema } from "@/features/orders/schemas";

const email = z.string().trim().toLowerCase().pipe(z.email("email").max(160, "tooLong"));
const password = z.string().min(8, "passwordMin").max(128, "tooLong");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "required").max(128, "tooLong"),
  next: z.string().optional(),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "required").max(60, "tooLong"),
    lastName: z.string().trim().max(60, "tooLong").optional().default(""),
    email,
    phone: z.union([z.literal(""), phoneSchema]).optional().default(""),
    password,
    confirmPassword: z.string(),
    next: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch" });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ token: z.string().min(10), password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch" });

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "required").max(60, "tooLong"),
  lastName: z.string().trim().max(60, "tooLong").optional().default(""),
  phone: z.union([z.literal(""), phoneSchema]).optional().default(""),
});

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "required"), password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch" });

/** Only allow same-site relative redirects after login (prevents open redirects). */
export function safeNext(next: string | undefined | null, fallback = "/account") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
