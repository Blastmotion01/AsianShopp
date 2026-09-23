"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { toActionError, zodFieldErrors } from "@/lib/errors";
import { formToObject, type FormState } from "@/lib/forms";
import { phoneSchema } from "@/features/orders/schemas";
import { NEEDS_ADDRESS, NEEDS_BRANCH } from "@/lib/integrations/delivery";

const addressSchema = z
  .object({
    label: z.string().trim().max(40, "tooLong").optional().default(""),
    firstName: z.string().trim().min(1, "required").max(60, "tooLong"),
    lastName: z.string().trim().min(1, "required").max(60, "tooLong"),
    phone: phoneSchema,
    city: z.string().trim().min(1, "required").max(80, "tooLong"),
    deliveryMethod: z.enum(["NOVA_POSHTA_BRANCH", "NOVA_POSHTA_COURIER", "COURIER_DNIPRO", "PICKUP_DNIPRO"]),
    branch: z.string().trim().max(120, "tooLong").optional().default(""),
    street: z.string().trim().max(200, "tooLong").optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (NEEDS_BRANCH.includes(v.deliveryMethod) && !v.branch) ctx.addIssue({ code: "custom", path: ["branch"], message: "required" });
    if (NEEDS_ADDRESS.includes(v.deliveryMethod) && !v.street) ctx.addIssue({ code: "custom", path: ["street"], message: "required" });
  });

export async function createAddressAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = addressSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    const user = await requireUser();
    const count = await db.address.count({ where: { userId: user.id } });
    if (count >= 10) return { error: "validation" };
    await db.address.create({
      data: { ...parsed.data, label: parsed.data.label || null, branch: parsed.data.branch || null, street: parsed.data.street || null, userId: user.id, isDefault: count === 0 },
    });
    revalidatePath("/[locale]/(shop)/account/addresses", "page");
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteAddressAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id") ?? "");
  // deleteMany with userId scope = ownership check
  await db.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/[locale]/(shop)/account/addresses", "page");
}

export async function setDefaultAddressAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id") ?? "");
  const owned = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!owned) return;
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/[locale]/(shop)/account/addresses", "page");
}
