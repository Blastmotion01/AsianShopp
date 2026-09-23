"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { useStore } from "@/features/store/store-provider";
import { logoutAction } from "../actions";

/** Signs out, re-syncs the client store (cart becomes a fresh guest cart) and goes home. */
export function LogoutButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const { refresh } = useStore();
  const [pending, start] = React.useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await logoutAction();
          await refresh();
          router.push("/");
          router.refresh();
        })
      }
    >
      {children}
    </button>
  );
}
