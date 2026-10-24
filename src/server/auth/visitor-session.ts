import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "nexus_visitor";

export interface VisitorSession {
  ownerSessionId: string;
  isNew: boolean;
}

export async function getVisitorSession(): Promise<VisitorSession> {
  const store = await cookies();
  let secret = store.get(COOKIE_NAME)?.value;
  const isNew = !secret || !/^[A-Za-z0-9_-]{43}$/.test(secret);
  if (isNew) {
    secret = randomBytes(32).toString("base64url");
    store.set(COOKIE_NAME, secret, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      priority: "high",
    });
  }
  return { ownerSessionId: createHash("sha256").update(secret!).digest("hex"), isNew };
}
