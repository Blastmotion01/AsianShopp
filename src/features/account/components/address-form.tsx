"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import type { DeliveryMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { DELIVERY_METHODS, NEEDS_ADDRESS, NEEDS_BRANCH } from "@/lib/integrations/delivery";
import { createAddressAction } from "../actions";

export function AddressForm() {
  const t = useTranslations("checkout");
  const ta = useTranslations("account");
  const tv = useTranslations("validation");
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState<DeliveryMethod>("NOVA_POSHTA_BRANCH");
  const [state, action, pending] = React.useActionState(createAddressAction, {});
  const err = (f: string) => (state.fieldErrors?.[f] ? (tv.has(state.fieldErrors[f]) ? tv(state.fieldErrors[f]) : tv("invalid")) : undefined);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the form once saved
    if (state.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" /> {ta("addAddress")}
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border-2 border-ink bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ta("addressLabel")} htmlFor="a-label" className="sm:col-span-2">
          <Input id="a-label" name="label" maxLength={40} />
        </Field>
        <Field label={t("firstName")} htmlFor="a-first" error={err("firstName")}>
          <Input id="a-first" name="firstName" required maxLength={60} />
        </Field>
        <Field label={t("lastName")} htmlFor="a-last" error={err("lastName")}>
          <Input id="a-last" name="lastName" required maxLength={60} />
        </Field>
        <Field label={t("phone")} htmlFor="a-phone" error={err("phone")}>
          <Input id="a-phone" name="phone" type="tel" placeholder="+380" required />
        </Field>
        <Field label={t("city")} htmlFor="a-city" error={err("city")}>
          <Input id="a-city" name="city" defaultValue="Дніпро" required maxLength={80} />
        </Field>
        <Field label={t("method")} htmlFor="a-method" className="sm:col-span-2">
          <Select id="a-method" name="deliveryMethod" value={method} onChange={(e) => setMethod(e.target.value as DeliveryMethod)}>
            {DELIVERY_METHODS.map((m) => (
              <option key={m} value={m}>
                {t(`methods.${m}`)}
              </option>
            ))}
          </Select>
        </Field>
        {NEEDS_BRANCH.includes(method) && (
          <Field label={t("branch")} htmlFor="a-branch" error={err("branch")} className="sm:col-span-2">
            <Input id="a-branch" name="branch" placeholder={t("branchPlaceholder")} maxLength={120} />
          </Field>
        )}
        {NEEDS_ADDRESS.includes(method) && (
          <Field label={t("address")} htmlFor="a-street" error={err("street")} className="sm:col-span-2">
            <Input id="a-street" name="street" placeholder={t("addressPlaceholder")} maxLength={200} />
          </Field>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="submit" loading={pending}>
          {ta("addAddress")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          ✕
        </Button>
      </div>
    </form>
  );
}
