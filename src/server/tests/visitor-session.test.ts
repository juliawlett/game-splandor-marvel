import { describe, expect, it } from "vitest";
import { sessionCookieIsSecure } from "@/server/auth/visitor-session";

describe("cookie de sessão anônima", () => {
  it("permite HTTP somente no loopback local, inclusive em next start", () => {
    expect(sessionCookieIsSecure("production", "localhost:3010", null)).toBe(false);
    expect(sessionCookieIsSecure("production", "127.0.0.1:3000", "http")).toBe(false);
    expect(sessionCookieIsSecure("production", "[::1]:3000", null)).toBe(false);
  });

  it("mantém Secure para HTTPS e hosts remotos de produção", () => {
    expect(sessionCookieIsSecure("production", "jogo.exemplo.com", "https")).toBe(true);
    expect(sessionCookieIsSecure("production", "jogo.exemplo.com", "http")).toBe(true);
  });
});
