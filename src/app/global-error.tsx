"use client";

/** Last-resort boundary (root layout failed). Kept dependency-free on purpose. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="uk">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FAF6F1", color: "#2A1F24", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28 }}>Щось пішло не так · Something went wrong</h1>
          <button onClick={reset} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 999, border: "2px solid #2A1F24", background: "#F0573A", fontWeight: 700, cursor: "pointer" }}>
            Спробувати ще раз · Try again
          </button>
        </div>
      </body>
    </html>
  );
}
