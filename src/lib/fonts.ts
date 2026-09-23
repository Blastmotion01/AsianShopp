import { Manrope, Unbounded } from "next/font/google";

export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
