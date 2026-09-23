import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { Flag } from "@/components/brand/flag";
import { siteConfig } from "@/config/site";

export async function Footer({ countries }: { countries: { code: string; name: string; flag: string }[] }) {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink text-cream-100">
      {/* marquee strip */}
      <div className="overflow-hidden border-y-2 border-ink bg-pink-300 py-3 text-ink" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-10 font-display text-lg font-extrabold whitespace-nowrap uppercase">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-10">
              {["Seoul", "🍜 Ramyun", "Tokyo", "🍵 Matcha", "Shanghai", "🌶️ Latiao", "New York", "🥤 Soda", "🎁 Mystery Box"].map((w) => (
                <span key={w}>{w} ✦</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo onDark />
          <p className="mt-4 max-w-xs text-cream-100/75">{t("tagline")}</p>
          <p className="mt-6 text-sm font-semibold text-cream-100/60">{t("follow")}</p>
          <div className="mt-2 flex gap-2">
            {[
              { href: siteConfig.instagram, label: "Instagram", short: "IG" },
              { href: siteConfig.tiktok, label: "TikTok", short: "TT" },
              { href: siteConfig.telegram, label: "Telegram", short: "TG" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid size-10 place-items-center rounded-full bg-cream-100/10 text-xs font-bold transition-colors hover:bg-coral-500 hover:text-ink"
              >
                {s.short}
              </a>
            ))}
          </div>
        </div>

        <FooterCol title={t("shop")}>
          <FooterLink href="/products">{nav("catalog")}</FooterLink>
          <FooterLink href="/products?new=1">{nav("new")}</FooterLink>
          <FooterLink href="/snack-match">{nav("snackMatch")}</FooterLink>
          <FooterLink href="/mystery-box">{nav("mysteryBox")}</FooterLink>
        </FooterCol>

        <FooterCol title={nav("countries")}>
          {countries.map((c) => (
            <FooterLink key={c.code} href={`/products?country=${c.code}`}>
              <Flag code={c.code} className="mr-1.5" />
              {c.name}
            </FooterLink>
          ))}
        </FooterCol>

        <FooterCol title={t("help")}>
          <li className="text-cream-100/75">{t("delivery")}</li>
          <li className="text-cream-100/75">{t("pickup")}</li>
          <li className="text-cream-100/75">{t("payment")}</li>
          <li>
            <a href={`mailto:${siteConfig.email}`} className="text-cream-100/75 hover:text-white">
              {siteConfig.email}
            </a>
          </li>
        </FooterCol>
      </div>

      <div className="border-t border-cream-100/10">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-cream-100/60 md:flex-row md:justify-between">
          <p>{t("rights", { year })}</p>
          <p>{t("madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-sm font-bold tracking-wider text-pink-300 uppercase">{title}</h2>
      <ul className="grid gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-cream-100/75 transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  );
}
