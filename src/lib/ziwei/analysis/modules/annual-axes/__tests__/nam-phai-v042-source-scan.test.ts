import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * V0.4.2 corrective prompt §21 source scan — the retired broad-eligibility
 * mechanisms must not be reachable from production evidence collection.
 */
const COLLECT_EVIDENCE_PATH = path.resolve(
  __dirname,
  "../nam-phai-v04/collect-evidence.ts",
);

describe("Annual Axes V0.4.2 · source scan (corrective prompt §21)", () => {
  const source = readFileSync(COLLECT_EVIDENCE_PATH, "utf-8");

  it("does not import the retired affinity module for eligibility", () => {
    expect(source).not.toMatch(/from ["']\.\/affinity["']/);
    expect(source).not.toMatch(/resolveDomainAffinity/);
  });

  it("does not call domainFrameCoverage() for numeric admission", () => {
    expect(source).not.toMatch(/domainFrameCoverage\s*\(/);
  });

  it("does not grant annual-origin facts geometry 1 without physical ownership", () => {
    expect(source).not.toMatch(/origin\.startsWith\(["']annual["']\)/);
  });

  it("does not check or push the retired head-domain-frame-intersection trigger (a code comment may still explain its retirement)", () => {
    expect(source).not.toMatch(/isTriggerEnabled\([^)]*head-domain-frame-intersection/);
    expect(source).not.toMatch(/triggerIds\.push\(["']head-domain-frame-intersection["']\)/);
  });
});
