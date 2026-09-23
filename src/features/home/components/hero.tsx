"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product/product-image";
import { Flag } from "@/components/brand/flag";

type FloatingProduct = { slug: string; name: string; image: string | null; price: string; countryCode: string | null };

export type HeroProps = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  stickers: { new: string; import: string; spicy: string };
  products: FloatingProduct[];
};

/**
 * Hero: bold typography on the left, a CSS-3D gift box on the right with product
 * cards floating out of it. Pointer parallax on desktop; static for reduced motion.
 * Pure CSS/transform 3D — no WebGL — so it's cheap on phones.
 */
export function Hero(props: HeroProps) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 18 });
  const sy = useSpring(my, { stiffness: 80, damping: 18 });
  const rotY = useTransform(sx, [-1, 1], [-30, -46]);
  const rotX = useTransform(sy, [-1, 1], [-16, -28]);
  const shiftX = useTransform(sx, [-1, 1], [-14, 14]);
  const shiftY = useTransform(sy, [-1, 1], [-10, 10]);

  function onPointerMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }

  const cards = props.products.slice(0, 3);
  const cardPos = [
    "left-[-4%] top-[6%] -rotate-[10deg] md:left-[2%]",
    "right-[-2%] top-[0%] rotate-[8deg] md:right-[4%]",
    "right-[6%] bottom-[2%] rotate-[-5deg] md:right-[10%]",
  ];

  return (
    <section className="relative overflow-hidden" onPointerMove={onPointerMove} aria-labelledby="hero-title">
      {/* background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-pink-200/70 blur-3xl" />
        <div className="absolute top-20 right-[-10rem] size-[30rem] rounded-full bg-cream-200 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 size-[22rem] rounded-full bg-coral-100 blur-3xl" />
      </div>

      <div className="container-page grid items-center gap-10 pt-8 pb-16 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24">
        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-sm font-bold shadow-pop-sm"
          >
            <Sparkles className="size-4 text-coral-600" aria-hidden="true" /> {props.eyebrow}
          </motion.p>

          <h1 id="hero-title" className="mt-6 font-display text-[clamp(2.9rem,9vw,6.4rem)] leading-[0.95] font-extrabold tracking-[-0.045em]">
            <motion.span className="block" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}>
              {props.title}
            </motion.span>
            <motion.span
              className="relative inline-block"
              initial={{ opacity: 0, y: 30, rotate: -4 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ duration: 0.7, delay: 0.15, type: "spring", stiffness: 120 }}
            >
              <span className="relative z-10 text-coral-500 [text-shadow:0_5px_0_var(--color-ink)]">{props.highlight}</span>
              <svg aria-hidden="true" viewBox="0 0 300 30" className="absolute -bottom-2 left-0 z-0 h-5 w-full text-pink-300" preserveAspectRatio="none">
                <path d="M4 20 C 60 4, 120 30, 180 14 S 280 8, 296 18" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" />
              </svg>
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-7 max-w-xl text-lg text-ink-soft md:text-xl"
          >
            {props.subtitle}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href={props.ctaHref}>
                {props.ctaLabel} <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={props.secondaryHref}>{props.secondaryLabel}</Link>
            </Button>
          </motion.div>
        </div>

        {/* 3D scene */}
        <div className="relative mx-auto aspect-square w-full max-w-[560px]" aria-hidden="true">
          <motion.div className="cube-scene absolute inset-0 grid place-items-center [--s:min(40vw,240px)]" style={{ x: shiftX, y: shiftY }}>
            <motion.div className="cube size-[var(--s)]" style={reduce ? undefined : { rotateX: rotX, rotateY: rotY }}>
              <GiftBox />
            </motion.div>
          </motion.div>

          {cards.map((c, i) => (
            <div
              key={c.slug}
              className={`absolute w-[38%] max-w-[190px] animate-float ${cardPos[i]}`}
              style={{ animationDelay: `${i * -2}s`, ["--r" as string]: "0deg" }}
            >
              <Link
                href={`/products/${c.slug}`}
                tabIndex={-1}
                className="block rounded-2xl border-2 border-ink bg-white p-2 shadow-pop transition-transform hover:scale-105"
              >
                <span className="relative block aspect-square overflow-hidden rounded-xl bg-cream-100">
                  {c.image && <ProductImage src={c.image} alt="" fill sizes="190px" className="object-cover" priority={i === 0} />}
                </span>
                <span className="mt-1.5 flex items-center justify-between gap-1 px-1 text-xs font-bold">
                  <span className="truncate">
                    <Flag code={c.countryCode} className="mr-1" />
                    {c.name}
                  </span>
                  <span className="shrink-0 text-coral-700">{c.price}</span>
                </span>
              </Link>
            </div>
          ))}

          <span className="sticker absolute top-[42%] left-[-2%] -rotate-6 bg-pink-300">{props.stickers.new}</span>
          <span className="sticker absolute top-[2%] left-[40%] rotate-3 bg-cream-200">{props.stickers.import}</span>
          <span className="sticker absolute bottom-[10%] left-[8%] rotate-6 bg-coral-500">🌶️ {props.stickers.spicy}</span>

          {/* glossy bubbles */}
          <span className="absolute top-[26%] right-[30%] size-8 animate-float-slow rounded-full bg-gradient-to-br from-white to-pink-300 shadow-soft" />
          <span className="absolute bottom-[30%] left-[30%] size-5 animate-float rounded-full bg-gradient-to-br from-white to-coral-300" />
          <span className="absolute top-[70%] right-[2%] size-12 animate-float-slow rounded-full bg-gradient-to-br from-white to-cream-300 shadow-soft" />
        </div>
      </div>
    </section>
  );
}

/** CSS 3D box: 6 faces with brand colours, lid slightly lifted. */
function GiftBox() {
  const half = "calc(var(--s) / 2)";
  const face = "cube-face border-2 border-ink";
  return (
    <div className="relative size-full" style={{ transformStyle: "preserve-3d" }}>
      <div className={`${face} bg-coral-500`} style={{ transform: `translateZ(${half})` }}>
        <Ribbon vertical />
        <span className="absolute inset-x-0 bottom-[18%] text-center font-display text-[clamp(1rem,3.4vw,1.6rem)] font-extrabold text-ink">?!</span>
      </div>
      <div className={`${face} bg-coral-600`} style={{ transform: `rotateY(180deg) translateZ(${half})` }} />
      <div className={`${face} bg-coral-400`} style={{ transform: `rotateY(90deg) translateZ(${half})` }}>
        <Ribbon vertical />
      </div>
      <div className={`${face} bg-coral-400`} style={{ transform: `rotateY(-90deg) translateZ(${half})` }} />
      <div className={`${face} bg-coral-600`} style={{ transform: `rotateX(-90deg) translateZ(${half})` }} />
      {/* lid, lifted */}
      <div className={`${face} bg-pink-300`} style={{ transform: `rotateX(90deg) translateZ(calc(${half} + 26px)) rotateZ(8deg)` }}>
        <Ribbon vertical />
        <Ribbon />
        <span className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-cream-200" />
      </div>
    </div>
  );
}

function Ribbon({ vertical }: { vertical?: boolean }) {
  return vertical ? (
    <span className="absolute inset-y-0 left-1/2 w-[16%] -translate-x-1/2 border-x-2 border-ink bg-cream-200" />
  ) : (
    <span className="absolute inset-x-0 top-1/2 h-[16%] -translate-y-1/2 border-y-2 border-ink bg-cream-200" />
  );
}
