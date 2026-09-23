"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, MailCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { useStore } from "@/features/store/store-provider";
import type { FormState } from "@/lib/forms";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "../actions";

function useErr(state: FormState) {
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  return (field: string) => {
    const code = state.fieldErrors?.[field];
    if (!code) return undefined;
    return tv.has(code) ? tv(code) : te.has(code) ? te(code) : tv("invalid");
  };
}

function FormError({ state }: { state: FormState }) {
  const te = useTranslations("errors");
  if (!state.error || state.error === "validation") return null;
  return (
    <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-sm font-semibold text-error">
      {te.has(state.error) ? te(state.error) : te("generic")}
    </p>
  );
}

function PasswordInput({ id, name, autoComplete, error }: { id: string; name: string; autoComplete: string; error?: string }) {
  const t = useTranslations("auth");
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={name === "password" && autoComplete === "current-password" ? 1 : 8}
        maxLength={128}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-ink/5"
        aria-label={show ? t("hidePassword") : t("showPassword")}
        aria-pressed={show}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** After a successful sign-in/up: sync the client store (header, cart merge) and navigate. */
function useAfterAuth(state: FormState) {
  const router = useRouter();
  const { refresh } = useStore();
  React.useEffect(() => {
    if (!state.ok) return;
    const next = typeof state.meta?.next === "string" ? state.meta.next : "/account";
    void refresh().then(() => {
      router.replace(next);
      router.refresh();
    });
  }, [state, refresh, router]);
}

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = React.useActionState(loginAction, {});
  const err = useErr(state);
  useAfterAuth(state);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError state={state} />
      <Field label={t("email")} htmlFor="email" error={err("email")}>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!err("email")} />
      </Field>
      <Field label={t("password")} htmlFor="password" error={err("password")}>
        <PasswordInput id="password" name="password" autoComplete="current-password" error={err("password")} />
      </Field>
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-semibold text-coral-700 hover:underline">
          {t("forgot")}
        </Link>
      </div>
      <Button type="submit" variant="accent" size="lg" className="w-full" loading={pending}>
        {t("login")}
      </Button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action, pending] = React.useActionState(registerAction, {});
  const err = useErr(state);
  useAfterAuth(state);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("firstName")} htmlFor="firstName" error={err("firstName")}>
          <Input id="firstName" name="firstName" autoComplete="given-name" required maxLength={60} aria-invalid={!!err("firstName")} />
        </Field>
        <Field label={t("lastName")} htmlFor="lastName" error={err("lastName")}>
          <Input id="lastName" name="lastName" autoComplete="family-name" maxLength={60} />
        </Field>
      </div>
      <Field label={t("email")} htmlFor="email" error={err("email")}>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!err("email")} />
      </Field>
      <Field label={`${t("phone")} (${tc("optional")})`} htmlFor="phone" error={err("phone")}>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+380" aria-invalid={!!err("phone")} />
      </Field>
      <Field label={t("password")} htmlFor="password" error={err("password")} hint={t("passwordHint")}>
        <PasswordInput id="password" name="password" autoComplete="new-password" error={err("password")} />
      </Field>
      <Field label={t("confirmPassword")} htmlFor="confirmPassword" error={err("confirmPassword")}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" error={err("confirmPassword")} />
      </Field>
      <Button type="submit" variant="accent" size="lg" className="w-full" loading={pending}>
        {t("register")}
      </Button>
    </form>
  );
}

export function ForgotForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = React.useActionState(forgotPasswordAction, {});
  const err = useErr(state);
  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-12 text-success" aria-hidden="true" />
        <p role="status">{t("resetSent")}</p>
        <Link href="/login" className="font-semibold text-coral-700 hover:underline">
          {t("backToLogin")}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError state={state} />
      <Field label={t("email")} htmlFor="email" error={err("email")}>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!err("email")} />
      </Field>
      <Button type="submit" variant="accent" size="lg" className="w-full" loading={pending}>
        {t("sendLink")}
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = React.useActionState(resetPasswordAction, {});
  const err = useErr(state);
  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
        <p role="status">{t("resetDone")}</p>
        <Button asChild variant="accent">
          <Link href="/login">{t("login")}</Link>
        </Button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormError state={state} />
      <Field label={t("newPassword")} htmlFor="password" error={err("password")} hint={t("passwordHint")}>
        <PasswordInput id="password" name="password" autoComplete="new-password" error={err("password")} />
      </Field>
      <Field label={t("confirmPassword")} htmlFor="confirmPassword" error={err("confirmPassword")}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" error={err("confirmPassword")} />
      </Field>
      <Button type="submit" variant="accent" size="lg" className="w-full" loading={pending}>
        {t("setPassword")}
      </Button>
    </form>
  );
}
