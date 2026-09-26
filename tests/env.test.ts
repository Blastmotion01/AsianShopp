import { afterEach, describe, expect, it, vi } from "vitest";

const original = { ...process.env };

async function loadEnv(overrides: Record<string, string | undefined>) {
  vi.resetModules(); // env() caches its result per module instance
  process.env = { ...original, AUTH_SECRET: "x".repeat(40), ...overrides };
  const { env } = await import("@/lib/env");
  return env();
}

afterEach(() => {
  process.env = { ...original };
});

describe("env settings are tolerant to dashboard noise", () => {
  it.each([
    ["", "mock"],
    ["   ", "mock"],
    ['"mock"', "mock"],
    [" Mock ", "mock"],
    [undefined, "mock"],
  ])("PAYMENT_PROVIDER=%j → %s", async (value, expected) => {
    expect((await loadEnv({ PAYMENT_PROVIDER: value })).PAYMENT_PROVIDER).toBe(expected);
  });

  it("empty NOTIFIER falls back to console", async () => {
    expect((await loadEnv({ NOTIFIER: "" })).NOTIFIER).toBe("console");
  });

  it("finds the Blob token under any connection prefix", async () => {
    const token = "vercel_blob_rw_abc_123";
    expect((await loadEnv({ BLOB_READ_WRITE_TOKEN: undefined, STORAGE_READ_WRITE_TOKEN: token })).BLOB_READ_WRITE_TOKEN).toBe(token);
    expect((await loadEnv({ BLOB_READ_WRITE_TOKEN: ` "${token}" ` })).BLOB_READ_WRITE_TOKEN).toBe(token);
    expect((await loadEnv({ BLOB_READ_WRITE_TOKEN: undefined, OTHER_READ_WRITE_TOKEN: "not-a-blob-token" })).BLOB_READ_WRITE_TOKEN).toBeUndefined();
  });

  it("still requires a real AUTH_SECRET", async () => {
    await expect(loadEnv({ AUTH_SECRET: "short" })).rejects.toThrow(/AUTH_SECRET/);
  });
});
