/**
 * Stateless signed admin session (HMAC-SHA256 via Web Crypto).
 * Safe to import from proxy.ts and from server code.
 */
export const SESSION_COOKIE = "a3_admin";
const MAX_AGE_SEC = 60 * 60 * 8;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const secret = process.env.SESSION_SECRET!;
  const payload = b64url(enc.encode(JSON.stringify({ r: "admin", exp: Math.floor(now / 1000) + MAX_AGE_SEC })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token || !adminConfigured()) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(process.env.SESSION_SECRET!), fromB64url(sig) as BufferSource, enc.encode(payload));
    if (!ok) return false;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return data.r === "admin" && typeof data.exp === "number" && data.exp * 1000 > now;
  } catch {
    return false;
  }
}

/** Constant-time string comparison via HMAC digests. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const k = await key("compare");
  const [x, y] = await Promise.all([
    crypto.subtle.sign("HMAC", k, enc.encode(a)),
    crypto.subtle.sign("HMAC", k, enc.encode(b)),
  ]);
  const xa = new Uint8Array(x), ya = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < xa.length; i++) diff |= xa[i] ^ ya[i];
  return diff === 0;
}

export const SESSION_MAX_AGE = MAX_AGE_SEC;
