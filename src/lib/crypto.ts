import "server-only";
import crypto from "crypto";

/**
 * OAuth refresh tokens are long-lived credentials to someone's inbox —
 * worth encrypting at rest even though Firestore access is server-only.
 * Generate a key with: openssl rand -hex 32
 */
const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is missing or too short. Generate one with `openssl rand -hex 32` and set it in your env."
    );
  }
  // Accept either a hex string or any 32+ char secret; hash to a stable 32-byte key.
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Pack iv + tag + ciphertext as base64, separated by ":"
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptSecret(packed: string): string {
  const [ivB64, tagB64, dataB64] = packed.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted token payload.");
  }
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Signs a small JSON payload (used for the Gmail OAuth `state` param,
 * which carries the InboxOS uid through Google's redirect) so the
 * callback route can trust it without a separate CSRF cookie.
 */
export function signState(payload: Record<string, unknown>): string {
  const json = JSON.stringify({ ...payload, ts: Date.now() });
  const body = Buffer.from(json, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState<T = Record<string, unknown>>(token: string, maxAgeMs = 10 * 60 * 1000): T {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Malformed state parameter.");
  const expected = crypto.createHmac("sha256", getKey()).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error("Invalid state signature — possible CSRF attempt.");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (Date.now() - payload.ts > maxAgeMs) {
    throw new Error("State parameter expired — please try connecting again.");
  }
  return payload as T;
}
