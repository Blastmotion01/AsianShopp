import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken, sign, unsign } from "@/lib/auth/tokens";
import { hasPermission } from "@/lib/auth/permissions";
import { loginSchema, registerSchema, safeNext } from "@/features/auth/schemas";

describe("authentication primitives", () => {
  it("hashes passwords with bcrypt and verifies them", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("stores only token hashes", () => {
    expect(hashToken("abc")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("signs guest ids and rejects tampering", () => {
    const secret = "x".repeat(40);
    const signed = sign("guest123", secret);
    expect(unsign(signed, secret)).toBe("guest123");
    expect(unsign(signed.replace("guest123", "guest124"), secret)).toBeNull();
    expect(unsign(signed, "y".repeat(40))).toBeNull();
  });

  it("validates registration input", () => {
    const ok = registerSchema.safeParse({ firstName: "Ann", email: "ANN@Example.com ", password: "12345678", confirmPassword: "12345678" });
    expect(ok.success && ok.data.email).toBe("ann@example.com");
    const mismatch = registerSchema.safeParse({ firstName: "Ann", email: "a@b.co", password: "12345678", confirmPassword: "12345679" });
    expect(mismatch.success).toBe(false);
    const short = registerSchema.safeParse({ firstName: "Ann", email: "a@b.co", password: "123", confirmPassword: "123" });
    expect(short.success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("only allows same-site relative redirects after login", () => {
    expect(safeNext("/checkout")).toBe("/checkout");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
  });
});

describe("authorization", () => {
  it("ADMIN wildcard grants everything, customers get nothing", () => {
    expect(hasPermission(["*"], "products:write")).toBe(true);
    expect(hasPermission([], "admin:access")).toBe(false);
  });

  it("scoped staff roles only get their permissions", () => {
    const warehouse = ["admin:access", "inventory:write", "orders:read"];
    expect(hasPermission(warehouse, "inventory:write")).toBe(true);
    expect(hasPermission(warehouse, "products:write")).toBe(false);
    expect(hasPermission(warehouse, "cms:write")).toBe(false);
  });
});
