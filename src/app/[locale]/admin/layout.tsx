import type { ReactNode } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { AdminShell } from "@/features/admin/components/admin-shell";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Every admin page is authorized here (server-side) and again inside each action. */
export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireAdminPage();
  return (
    <AdminShell user={{ name: user.firstName, email: user.email, permissions: user.permissions }}>
      {children}
    </AdminShell>
  );
}
