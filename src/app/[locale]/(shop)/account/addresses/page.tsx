import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { AddressForm } from "@/features/account/components/address-form";
import { deleteAddressAction, setDefaultAddressAction } from "@/features/account/actions";
import { Badge } from "@/components/ui/badge";

// Reads cookies / URL params: always render per request (never statically cached).
export const dynamic = "force-dynamic";

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUserPage("/account/addresses");
  const [t, tco] = await Promise.all([getTranslations("account"), getTranslations("checkout")]);
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });

  return (
    <div className="space-y-5">
      {addresses.length === 0 && <p className="rounded-2xl border-2 border-dashed border-line p-8 text-center text-muted">{t("noAddresses")}</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="flex flex-col rounded-2xl border-2 border-line bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 font-display font-bold">
                <MapPin className="size-4 text-coral-600" aria-hidden="true" /> {a.label || a.city}
              </p>
              {a.isDefault && <Badge variant="NEW">{t("default")}</Badge>}
            </div>
            <p className="mt-2 text-sm">{tco(`methods.${a.deliveryMethod}`)}</p>
            <p className="text-sm text-muted">
              {a.city}
              {a.branch && `, ${a.branch}`}
              {a.street && `, ${a.street}`}
            </p>
            <p className="text-sm text-muted">
              {a.firstName} {a.lastName} · {a.phone}
            </p>
            <div className="mt-4 flex gap-2 pt-2">
              {!a.isDefault && (
                <form action={setDefaultAddressAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="rounded-full border-2 border-line px-3 py-1.5 text-sm font-semibold hover:border-ink">
                    {t("makeDefault")}
                  </button>
                </form>
              )}
              <form action={deleteAddressAction} className="ml-auto">
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="grid size-9 place-items-center rounded-full text-muted hover:bg-error-soft hover:text-error" aria-label={t("deleteAddress")}>
                  <Trash2 className="size-4" />
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <AddressForm />
    </div>
  );
}
