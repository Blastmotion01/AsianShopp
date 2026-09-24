"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CameraOff, Flashlight } from "lucide-react";
import { cn } from "@/lib/utils";

type Controls = { stop: () => void; switchTorch?: (on: boolean) => Promise<void> };

/**
 * Live camera barcode scanner (EAN-13/8, UPC-A/E, Code 128/39, ITF, QR).
 * Uses ZXing (works on iPhone Safari too, which lacks the native BarcodeDetector).
 * The library is loaded lazily so it never weighs down other pages.
 * Calls `onDetected` once per distinct code (with a short cooldown against double reads).
 */
export function BarcodeScanner({ onDetected, paused = false, className }: { onDetected: (code: string) => void; paused?: boolean; className?: string }) {
  const t = useTranslations("admin.scan");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const controlsRef = React.useRef<Controls | null>(null);
  const lastRef = React.useRef<{ code: string; at: number } | null>(null);
  const onDetectedRef = React.useRef(onDetected);
  const pausedRef = React.useRef(paused);
  const [error, setError] = React.useState<string | null>(null);
  const [torch, setTorch] = React.useState<boolean | null>(null); // null = unsupported

  React.useEffect(() => {
    onDetectedRef.current = onDetected;
    pausedRef.current = paused;
  }, [onDetected, paused]);

  React.useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError("insecure");
        return;
      }
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
          BarcodeFormat.QR_CODE,
        ]);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        if (cancelled || !videoRef.current) return;
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          videoRef.current,
          (result) => {
            if (!result || pausedRef.current) return;
            const code = result.getText().trim();
            const now = Date.now();
            if (lastRef.current && lastRef.current.code === code && now - lastRef.current.at < 2500) return;
            lastRef.current = { code, at: now };
            navigator.vibrate?.(80);
            onDetectedRef.current(code);
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls as Controls;
        setTorch(typeof (controls as Controls).switchTorch === "function" ? false : null);
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        setError(name === "NotAllowedError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "nocamera" : "failed");
      }
    }

    void start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  async function toggleTorch() {
    const c = controlsRef.current;
    if (!c?.switchTorch || torch === null) return;
    try {
      await c.switchTorch(!torch);
      setTorch(!torch);
    } catch {
      setTorch(null);
    }
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border-2 border-ink bg-ink", className)}>
      {error ? (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 p-6 text-center text-cream-100">
          <CameraOff className="size-10" aria-hidden="true" />
          <p className="font-semibold">{t(`error_${error}` as "error_failed")}</p>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline aria-label={t("cameraLabel")} />
          {/* aiming frame */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className={cn("h-[38%] w-[78%] rounded-xl border-4 transition-colors", paused ? "border-cream-100/40" : "border-coral-500")} />
          </div>
          {torch !== null && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-pressed={torch}
              aria-label={t("torch")}
              className={cn("absolute right-3 bottom-3 grid size-11 place-items-center rounded-full border-2 border-ink", torch ? "bg-cream-200" : "bg-white/90")}
            >
              <Flashlight className="size-5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
