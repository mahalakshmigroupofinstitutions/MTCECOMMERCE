import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET env var is required");
  return s;
}

export function sign(value: string) {
  const sig = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

export function unsign(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expected = createHmac("sha256", secret()).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}
