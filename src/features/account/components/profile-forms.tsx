"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { FormState } from "@/lib/forms";
import { changePasswordAction, updateProfileAction } from "@/features/auth/actions";

function useFieldError(state: FormState) {
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  return (f: string) => {
    const c = state.fieldErrors?.[f];
    return c ? (tv.has(c) ? tv(c) : te.has(c) ? te(c) : tv("invalid")) : undefined;
  };
}

export function ProfileForm({ defaults }: { defaults: { firstName: string; lastName: string; phone: string; email: string } }) {
  const t = useTranslations("auth");
  const ta = useTranslations("account");
  const tc = useTranslations("common");
  const [state, action, pending] = React.useActionState(updateProfileAction, {});
  const err = useFieldError(state);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("firstName")} htmlFor="p-first" error={err("firstName")}>
          <Input id="p-first" name="firstName" defaultValue={defaults.firstName} required maxLength={60} autoComplete="given-name" />
        </Field>
        <Field label={t("lastName")} htmlFor="p-last" error={err("lastName")}>
          <Input id="p-last" name="lastName" defaultValue={defaults.lastName} maxLength={60} autoComplete="family-name" />
        </Field>
        <Field label={t("phone")} htmlFor="p-phone" error={err("phone")}>
          <Input id="p-phone" name="phone" type="tel" defaultValue={defaults.phone} placeholder="+380" autoComplete="tel" />
        </Field>
        <Field label={t("email")} htmlFor="p-email">
          <Input id="p-email" value={defaults.email} disabled readOnly />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          {tc("save")}
        </Button>
        {state.ok && (
          <span role="status" className="font-semibold text-success">
            {ta("saved")}
          </span>
        )}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations("auth");
  const ta = useTranslations("account");
  const [state, action, pending] = React.useActionState(changePasswordAction, {});
  const err = useFieldError(state);
  const formRef = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={ta("currentPassword")} htmlFor="pw-current" error={err("currentPassword")}>
          <Input id="pw-current" name="currentPassword" type="password" autoComplete="current-password" required />
        </Field>
        <Field label={t("newPassword")} htmlFor="pw-new" error={err("password")}>
          <Input id="pw-new" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label={t("confirmPassword")} htmlFor="pw-confirm" error={err("confirmPassword")}>
          <Input id="pw-confirm" name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" loading={pending}>
          {ta("changePassword")}
        </Button>
        {state.ok && (
          <span role="status" className="font-semibold text-success">
            {ta("passwordChanged")}
          </span>
        )}
      </div>
    </form>
  );
}
