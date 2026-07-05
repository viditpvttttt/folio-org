// HMAC-signed OAuth state so the callback can trust user_id + provider.
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const TTL_MS = 10 * 60 * 1000;

function secret(): string {
  const s = process.env.OAUTH_STATE_SECRET;
  if (!s) throw new Error("OAUTH_STATE_SECRET is not configured");
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signState(payload: { userId: string; provider: string }): string {
  const body = {
    u: payload.userId,
    p: payload.provider,
    n: b64url(randomBytes(12)),
    t: Date.now(),
  };
  const raw = b64url(Buffer.from(JSON.stringify(body)));
  const sig = b64url(createHmac("sha256", secret()).update(raw).digest());
  return `${raw}.${sig}`;
}

export function verifyState(state: string): { userId: string; provider: string } | null {
  const [raw, sig] = state.split(".");
  if (!raw || !sig) return null;
  const expected = b64url(createHmac("sha256", secret()).update(raw).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (!body?.u || !body?.p || !body?.t) return null;
    if (Date.now() - body.t > TTL_MS) return null;
    return { userId: body.u as string, provider: body.p as string };
  } catch {
    return null;
  }
}
