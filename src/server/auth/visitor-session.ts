import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "nexus_visitor";

export interface VisitorSession {
  ownerSessionId: string;
  isNew: boolean;
}

function isLoopbackHost(host: string | null): boolean {
  const raw = host?.trim().toLowerCase() ?? "";
  const normalized = raw.startsWith("[") ? raw.slice(1, raw.indexOf("]")) : raw.split(":")[0];
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

export function sessionCookieIsSecure(nodeEnvironment: string | undefined, host: string | null, forwardedProtocol: string | null): boolean {
  const protocol = forwardedProtocol?.split(",")[0]?.trim().toLowerCase();
  if (protocol === "https") return true;
  return nodeEnvironment === "production" && !isLoopbackHost(host);
}

export async function getVisitorSession(): Promise<VisitorSession> {
  const [store, requestHeaders] = await Promise.all([cookies(), headers()]);
  let secret = store.get(COOKIE_NAME)?.value;
  const isNew = !secret || !/^[A-Za-z0-9_-]{43}$/.test(secret);
  if (isNew) {
    secret = randomBytes(32).toString("base64url");
    store.set(COOKIE_NAME, secret, {
      httpOnly: true,
      sameSite: "lax",
      secure: sessionCookieIsSecure(process.env.NODE_ENV, requestHeaders.get("host"), requestHeaders.get("x-forwarded-proto")),
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      priority: "high",
    });
  }
  return { ownerSessionId: createHash("sha256").update(secret!).digest("hex"), isNew };
}
