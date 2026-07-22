/**
 * Stable canonical JSON + SHA-256 hashing for Round-2 freeze.
 */

import { createHash } from "node:crypto";

export function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = canonicalize(obj[key]);
  }
  return out;
}

export function stableStringify(value: unknown): string {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function sha256Of(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function sha256Text(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
