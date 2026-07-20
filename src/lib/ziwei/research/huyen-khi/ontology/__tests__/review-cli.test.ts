import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ONTOLOGY_DIR, ONTOLOGY_FILES } from "../paths";

/**
 * §3.4 — the review CLI must validate everything BEFORE writing and leave the
 * plan byte-for-byte untouched on any failure. These run the real CLI in a
 * subprocess and assert a non-zero exit with an unchanged plan file.
 */

const CLI = path.join(__dirname, "..", "cli", "review-fixture.ts");
const PLAN = path.join(ONTOLOGY_DIR, ONTOLOGY_FILES.fixturePlan);
const REPO_ROOT = path.join(__dirname, "..", "..", "..", "..", "..", "..", "..");

function runCli(args: string[]): { code: number } {
  try {
    execFileSync("npx", ["tsx", CLI, ...args], { cwd: REPO_ROOT, stdio: "pipe" });
    return { code: 0 };
  } catch (error) {
    return { code: (error as { status?: number }).status ?? 1 };
  }
}

function planBytes(): string {
  return readFileSync(PLAN, "utf-8");
}

const base = [
  "--fixture", "HK-FIX-001-MAJOR-MIEU-SUPPORT", // a shared fixture
  "--reviewer", "expert-a",
  "--role", "school-expert",
  "--decision", "reviewed",
  "--rationale", "reviewed against sourced material",
  "--at", "2026-02-02T00:00:00.000Z",
];

describe("Huyền Khí review CLI — validate-before-write (§3.4)", () => {
  it("rejects a school-incompatible review and writes nothing", () => {
    const before = planBytes();
    const { code } = runCli([...base, "--school", "trung-chau"]);
    expect(code).not.toBe(0);
    expect(planBytes()).toBe(before);
  }, 30000);

  it("rejects an unresolved --source and writes nothing", () => {
    const before = planBytes();
    const { code } = runCli([...base, "--school", "shared", "--source", "HK-SRC-DOES-NOT-EXIST"]);
    expect(code).not.toBe(0);
    expect(planBytes()).toBe(before);
  }, 30000);

  it("rejects a non-UTC timestamp and writes nothing", () => {
    const before = planBytes();
    const bad = base.map((a) => (a === "2026-02-02T00:00:00.000Z" ? "2026-02-02T00:00:00+07:00" : a));
    const { code } = runCli([...bad, "--school", "shared"]);
    expect(code).not.toBe(0);
    expect(planBytes()).toBe(before);
  }, 30000);
});
