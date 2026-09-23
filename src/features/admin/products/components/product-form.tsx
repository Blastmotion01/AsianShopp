"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Star, ArrowLeft, Save } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/utils";
import { saveProductAction, uploadProductImageAction } from "../actions";
import type { ProductInput } from "../schema";
import type { ProductFormState } from "../form-state";

type Locale3 = "uk" | "ru" | "en";
type VariantState = ProductFormState["variants"][number];

export function ProductForm({
  initial,
  categories,
  countries,
  brands,
}: {
  initial: ProductFormState;
  categories: { id: string; label: string }[];
  countries: { id: string; label: string }[];
  brands: string[];
}) {
  const t = useTranslations("admin.form");
  const tp = useTranslations("admin.products");
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const router = useRouter();
  const [s, setS] = React.useState<ProductFormState>(initial);
  const [lang, setLang] = React.useState<Locale3>("uk");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, start] = React.useTransition();
  const [uploading, setUploading] = React.useState(false);

  const err = (key: string) => {
    const c = errors[key];
    return c ? (tv.has(c) ? tv(c) : te.has(c) ? te(c) : tv("invalid")) : undefined;
  };
  const patch = (p: Partial<ProductFormState>) => setS((prev) => ({ ...prev, ...p }));
  const setTr = (field: keyof ProductFormState["translations"]["uk"], value: string) =>
    setS((prev) => ({ ...prev, translations: { ...prev.translations, [lang]: { ...prev.translations[lang], [field]: value } } }));
  const setVariant = (i: number, p: Partial<VariantState>) => setS((prev) => ({ ...prev, variants: prev.variants.map((v, j) => (j === i ? { ...v, ...p } : v)) }));

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files).slice(0, 12 - s.images.length)) {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadProductImageAction(fd);
      if (res.ok) setS((prev) => ({ ...prev, images: [...prev.images, { url: res.data.url, alt: prev.translations.uk.name }] }));
      else toast.error(te.has(res.error) ? te(res.error) : te("generic"));
    }
    setUploading(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const payload: ProductInput = { ...s, countryId: s.countryId || "", nutrition: s.nutrition };
      const res = await saveProductAction(payload);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? (res.meta?.field ? { [String(res.meta.field)]: res.error } : {}));
        toast.error(te.has(res.error) ? te(res.error) : te("generic"));
        const firstLangErr = Object.keys(res.fieldErrors ?? {}).find((k) => k.startsWith("translations."));
        if (firstLangErr) setLang(firstLangErr.split(".")[1] as Locale3);
        return;
      }
      setErrors({});
      toast.success(tp("saved"));
      if (!s.id) router.replace(`/admin/products/${res.data.id}`);
      router.refresh();
    });
  }

  const tr = s.translations[lang];

  return (
    <form onSubmit={submit} noValidate className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" /> {tp("title")}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* CONTENT */}
          <Card title={t("content", { locale: lang.toUpperCase() })}>
            <div className="mb-4 flex gap-2" role="tablist">
              {(["uk", "ru", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={lang === l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "rounded-full border-2 px-4 py-1.5 text-sm font-bold",
                    lang === l ? "border-ink bg-ink text-white" : "border-line bg-white",
                    Object.keys(errors).some((k) => k.startsWith(`translations.${l}`)) && lang !== l && "border-error text-error",
                  )}
                >
                  {l.toUpperCase()}
                  {l === "uk" && " *"}
                </button>
              ))}
            </div>
            <div className="grid gap-4">
              <Field label={t("name")} htmlFor="f-name" error={err(`translations.${lang}.name`)}>
                <Input id="f-name" value={tr.name} onChange={(e) => setTr("name", e.target.value)} maxLength={160} aria-invalid={!!err(`translations.${lang}.name`)} />
              </Field>
              <Field label={t("shortDescription")} htmlFor="f-short" error={err(`translations.${lang}.shortDescription`)}>
                <Input id="f-short" value={tr.shortDescription} onChange={(e) => setTr("shortDescription", e.target.value)} maxLength={300} />
              </Field>
              <Field label={t("description")} htmlFor="f-desc">
                <Textarea id="f-desc" rows={5} value={tr.description} onChange={(e) => setTr("description", e.target.value)} maxLength={5000} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("ingredients")} htmlFor="f-ingr">
                  <Textarea id="f-ingr" rows={3} value={tr.ingredients} onChange={(e) => setTr("ingredients", e.target.value)} maxLength={2000} />
                </Field>
                <Field label={t("allergens")} htmlFor="f-all">
                  <Textarea id="f-all" rows={3} value={tr.allergens} onChange={(e) => setTr("allergens", e.target.value)} maxLength={500} />
                </Field>
              </div>
              <div className="grid gap-4 border-t-2 border-line pt-4 md:grid-cols-2">
                <Field label={t("seoTitle", { locale: lang.toUpperCase() })} htmlFor="f-seot">
                  <Input id="f-seot" value={s.seoTitle[lang]} onChange={(e) => patch({ seoTitle: { ...s.seoTitle, [lang]: e.target.value } })} maxLength={160} />
                </Field>
                <Field label={t("seoDescription", { locale: lang.toUpperCase() })} htmlFor="f-seod">
                  <Input id="f-seod" value={s.seoDescription[lang]} onChange={(e) => patch({ seoDescription: { ...s.seoDescription, [lang]: e.target.value } })} maxLength={300} />
                </Field>
              </div>
            </div>
          </Card>

          {/* VARIANTS */}
          <Card title={t("variants")} hint={t("variantsHint")}>
            {err("variants") && <p className="mb-3 text-sm text-error">{err("variants")}</p>}
            <div className="space-y-3">
              {s.variants.map((v, i) => (
                <fieldset key={v.id ?? `new-${i}`} className="grid gap-3 rounded-lg border-2 border-line p-3 md:grid-cols-4">
                  <legend className="px-1 text-xs font-bold text-muted">#{i + 1}</legend>
                  <Field label={t("sku")} htmlFor={`v-sku-${i}`} error={err(`variants.${i}.sku`)}>
                    <Input id={`v-sku-${i}`} value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })} className="h-10 font-mono text-sm" />
                  </Field>
                  <Field label={t("variantName")} htmlFor={`v-uk-${i}`} error={err(`variants.${i}.nameUk`)}>
                    <Input id={`v-uk-${i}`} value={v.nameUk} onChange={(e) => setVariant(i, { nameUk: e.target.value })} className="h-10" />
                  </Field>
                  <Field label={t("variantNameRu")} htmlFor={`v-ru-${i}`}>
                    <Input id={`v-ru-${i}`} value={v.nameRu} onChange={(e) => setVariant(i, { nameRu: e.target.value })} className="h-10" />
                  </Field>
                  <Field label={t("variantNameEn")} htmlFor={`v-en-${i}`}>
                    <Input id={`v-en-${i}`} value={v.nameEn} onChange={(e) => setVariant(i, { nameEn: e.target.value })} className="h-10" />
                  </Field>
                  <Field label={t("price")} htmlFor={`v-price-${i}`} error={err(`variants.${i}.price`)}>
                    <Input id={`v-price-${i}`} inputMode="decimal" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} className="h-10" />
                  </Field>
                  <Field label={t("oldPrice")} htmlFor={`v-old-${i}`} error={err(`variants.${i}.compareAtPrice`)}>
                    <Input id={`v-old-${i}`} inputMode="decimal" value={v.compareAtPrice} onChange={(e) => setVariant(i, { compareAtPrice: e.target.value })} className="h-10" />
                  </Field>
                  <Field label={t("weight")} htmlFor={`v-w-${i}`} error={err(`variants.${i}.weightGrams`)}>
                    <Input id={`v-w-${i}`} inputMode="numeric" value={v.weightGrams} onChange={(e) => setVariant(i, { weightGrams: e.target.value })} className="h-10" />
                  </Field>
                  <div className="flex items-end gap-2">
                    <Field label={t("stock")} htmlFor={`v-st-${i}`} error={err(`variants.${i}.stock`)} className="flex-1">
                      <Input id={`v-st-${i}`} inputMode="numeric" value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} className="h-10" />
                    </Field>
                    {s.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => patch({ variants: s.variants.filter((_, j) => j !== i) })}
                        className="mb-0.5 grid size-10 place-items-center rounded-full text-muted hover:bg-error-soft hover:text-error"
                        aria-label={t("removeVariant")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </fieldset>
              ))}
            </div>
            <Button
              type="button"
              variant="soft"
              size="sm"
              className="mt-3"
              onClick={() => patch({ variants: [...s.variants, { sku: "", nameUk: "", nameRu: "", nameEn: "", price: "", compareAtPrice: "", weightGrams: "", stock: "0" }] })}
            >
              <Plus aria-hidden="true" /> {t("addVariant")}
            </Button>
          </Card>

          {/* NUTRITION */}
          <Card title={t("nutrition")}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              {(["energyKcal", "fat", "carbs", "sugar", "protein", "salt"] as const).map((k) => (
                <Field key={k} label={t(k)} htmlFor={`n-${k}`} error={err(`nutrition.${k}`)}>
                  <Input id={`n-${k}`} inputMode="decimal" value={s.nutrition[k]} onChange={(e) => patch({ nutrition: { ...s.nutrition, [k]: e.target.value } })} className="h-10" />
                </Field>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* CLASSIFICATION */}
          <Card title={t("classification")}>
            <div className="grid gap-4">
              <Field label={t("category")} htmlFor="f-cat" error={err("categoryId")}>
                <Select id="f-cat" value={s.categoryId} onChange={(e) => patch({ categoryId: e.target.value })} aria-invalid={!!err("categoryId")}>
                  <option value="">{t("none")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("country")} htmlFor="f-country">
                <Select id="f-country" value={s.countryId} onChange={(e) => patch({ countryId: e.target.value })}>
                  <option value="">{t("none")}</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("brand")} htmlFor="f-brand" hint={t("brandHint")}>
                <Input id="f-brand" list="brand-list" value={s.brandName} onChange={(e) => patch({ brandName: e.target.value })} maxLength={80} />
                <datalist id="brand-list">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
              <Field label={t("slug")} htmlFor="f-slug" hint={t("slugHint")} error={err("slug")}>
                <Input id="f-slug" value={s.slug} onChange={(e) => patch({ slug: e.target.value.toLowerCase() })} className="font-mono text-sm" maxLength={90} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("spiceLevel")} htmlFor="f-spice">
                  <Select id="f-spice" value={String(s.spiceLevel)} onChange={(e) => patch({ spiceLevel: Number(e.target.value) })}>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} {n > 0 ? "🌶️".repeat(Math.min(n, 3)) : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("volume")} htmlFor="f-vol" error={err("volumeMl")}>
                  <Input id="f-vol" inputMode="numeric" value={s.volumeMl} onChange={(e) => patch({ volumeMl: e.target.value })} />
                </Field>
              </div>
              <Field label={t("tags")} htmlFor="f-tags" hint={t("tagsHint")}>
                <Input id="f-tags" value={s.tags} onChange={(e) => patch({ tags: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card title={t("flags")}>
            <div className="grid gap-2.5">
              {(["isActive", "isNew", "isPopular", "isFeatured", "isLimited"] as const).map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-3 font-semibold">
                  <Checkbox checked={s[k]} onChange={(e) => patch({ [k]: e.target.checked })} />
                  {t(k)}
                </label>
              ))}
            </div>
          </Card>

          {/* IMAGES */}
          <Card title={t("images")} hint={t("imageHint")}>
            {s.images.length === 0 && <p className="mb-3 text-sm text-muted">{t("noImages")}</p>}
            <ul className="grid grid-cols-3 gap-2">
              {s.images.map((img, i) => (
                <li key={img.url} className={cn("group relative aspect-square overflow-hidden rounded-lg border-2", i === 0 ? "border-ink" : "border-line")}>
                  <ProductImage src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
                  <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => patch({ images: [img, ...s.images.filter((_, j) => j !== i)] })}
                        className="grid size-8 place-items-center rounded-full bg-white shadow"
                        aria-label={t("makeMain")}
                        title={t("makeMain")}
                      >
                        <Star className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => patch({ images: s.images.filter((_, j) => j !== i) })}
                      className="ml-auto grid size-8 place-items-center rounded-full bg-white text-error shadow"
                      aria-label={t("removeImage")}
                      title={t("removeImage")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coral-500">
              <Upload className="size-4" aria-hidden="true" /> {uploading ? t("uploading") : t("upload")}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" disabled={uploading || s.images.length >= 12} onChange={(e) => onUpload(e.target.files)} />
            </label>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-white/95 px-4 py-3 backdrop-blur lg:left-[250px]">
        <div className="flex items-center justify-end gap-3">
          {Object.keys(errors).length > 0 && <span className="text-sm font-semibold text-error">{te("validation")}</span>}
          <Button type="submit" variant="accent" loading={pending}>
            <Save aria-hidden="true" /> {pending ? tc("saving") : tc("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border-2 border-line bg-white p-5">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
