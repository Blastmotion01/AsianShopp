"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useStore } from "@/features/store/store-provider";
import { cn } from "@/lib/utils";
import { createReviewAction } from "../actions";

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const t = useTranslations("product");
  const te = useTranslations("errors");
  const tv = useTranslations("validation");
  const { user, ready } = useStore();
  const [state, action, pending] = React.useActionState(createReviewAction, {});
  const [rating, setRating] = React.useState(0);

  if (!ready) return null;
  if (!user) {
    return (
      <Link href={`/login?next=/products/${slug}`} className="inline-flex font-semibold text-coral-700 underline-offset-4 hover:underline">
        {t("loginToReview")}
      </Link>
    );
  }
  if (state.ok) return <p className="rounded-xl bg-success-soft p-4 font-semibold text-success">{t("reviewThanks")}</p>;

  return (
    <form action={action} className="space-y-3 rounded-xl border-2 border-line bg-white p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-1 text-sm font-bold">{t("yourRating")}</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={t("ratingStars", { value: i })}
              onClick={() => setRating(i)}
              className="rounded-md p-0.5 transition-transform hover:scale-110"
            >
              <Star className={cn("size-7", i <= rating ? "fill-coral-500 text-coral-500" : "text-ink/25")} />
            </button>
          ))}
        </div>
        {state.fieldErrors?.rating && <p className="text-sm text-error">{tv("required")}</p>}
      </fieldset>
      <label htmlFor="review-body" className="sr-only">
        {t("writeReview")}
      </label>
      <Textarea id="review-body" name="body" placeholder={t("reviewPlaceholder")} maxLength={1000} required aria-invalid={!!state.fieldErrors?.body} />
      {state.error && state.error !== "validation" && <p className="text-sm font-medium text-error">{te(state.error)}</p>}
      <Button type="submit" loading={pending} disabled={rating === 0}>
        {t("submitReview")}
      </Button>
    </form>
  );
}
