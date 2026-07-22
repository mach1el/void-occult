import Ajv from "ajv";
import * as fs from "fs";
import * as path from "path";
import { describe, it, expect } from "vitest";

const ajv = new Ajv({ allErrors: true });
const ROOT = path.join(__dirname, "..");

function readJson(relPath: string): any {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf-8"));
}

const sourceRegistry = readJson("sources/source-registry.v0.9.json");
const claimRegistry = readJson("sources/claim-registry.v0.9.json");
const schoolPolicyMatrix = readJson("policy/school-policy-matrix.v0.9.json");
const auditContract = readJson("audit/audit-contract.v0.9.json");

const sourceRegistrySchema = readJson("schema/source-registry.schema.json");
const claimRegistrySchema = readJson("schema/claim-registry.schema.json");
const policyMatrixSchema = readJson("schema/policy-matrix.schema.json");
const auditContractSchema = readJson("schema/audit-contract.schema.json");

describe("Annual Axes V0.9 research pack — schema conformance", () => {
  it("validates source-registry.v0.9.json against its schema", () => {
    const validate = ajv.compile(sourceRegistrySchema);
    const valid = validate(sourceRegistry);
    if (!valid) console.error(validate.errors);
    expect(valid).toBe(true);
  });

  it("validates claim-registry.v0.9.json against its schema", () => {
    const validate = ajv.compile(claimRegistrySchema);
    const valid = validate(claimRegistry);
    if (!valid) console.error(validate.errors);
    expect(valid).toBe(true);
  });

  it("validates school-policy-matrix.v0.9.json against its schema", () => {
    const validate = ajv.compile(policyMatrixSchema);
    const valid = validate(schoolPolicyMatrix);
    if (!valid) console.error(validate.errors);
    expect(valid).toBe(true);
  });

  it("validates audit-contract.v0.9.json against its schema", () => {
    const validate = ajv.compile(auditContractSchema);
    const valid = validate(auditContract);
    if (!valid) console.error(validate.errors);
    expect(valid).toBe(true);
  });
});

describe("Annual Axes V0.9 research pack — cross-reference integrity", () => {
  const sourceIds = new Set(sourceRegistry.sources.map((s: any) => s.sourceId));
  const claims: any[] = claimRegistry.claims;
  const claimIds = new Set(claims.map((c) => c.claimId));

  it("every claim's sourceIds resolve to a real source", () => {
    for (const claim of claims) {
      for (const sourceId of claim.sourceIds) {
        expect(sourceIds.has(sourceId), `${claim.claimId} references unknown source ${sourceId}`).toBe(true);
      }
    }
  });

  it("claim IDs are unique", () => {
    expect(claimIds.size).toBe(claims.length);
  });

  it("source IDs are unique", () => {
    const ids = sourceRegistry.sources.map((s: any) => s.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("classical claims require at least one locator", () => {
    for (const claim of claims) {
      if (claim.status === "classical") {
        expect(claim.locators.length, `${claim.claimId} is classical but has no locator`).toBeGreaterThan(0);
      }
    }
  });

  it("derived claims require at least one locator", () => {
    for (const claim of claims) {
      if (claim.status === "derived") {
        expect(claim.locators.length, `${claim.claimId} is derived but has no locator`).toBeGreaterThan(0);
      }
    }
  });

  it("classical claims require a compatible (classical-text/school-manual/published-reference) source", () => {
    const compatibleTypes = new Set(["classical-text", "school-manual", "published-reference"]);
    const sourceById = new Map(sourceRegistry.sources.map((s: any) => [s.sourceId, s]));
    for (const claim of claims) {
      if (claim.status !== "classical") continue;
      const hasCompatible = claim.sourceIds.some((id: string) => compatibleTypes.has(sourceById.get(id)?.sourceType));
      expect(hasCompatible, `${claim.claimId} is classical but has no compatible source`).toBe(true);
    }
  });

  it("no claim in this pack is classical (documents the zero-classical-source finding)", () => {
    // This pack has no classical/school-manual/published-reference sources
    // (see sources/source-review-log.md) — asserting this here means the
    // absence is enforced, not just narrated in prose.
    const classicalClaims = claims.filter((c) => c.status === "classical");
    expect(classicalClaims).toHaveLength(0);
  });

  it("engineering-hypothesis claims are never presented as classical doctrine", () => {
    for (const claim of claims) {
      if (claim.status === "engineering-hypothesis") {
        expect(claim.statement.toLowerCase()).not.toMatch(/\bis (a |an )?classical\b/);
      }
    }
  });

  it("disputed claims require at least one contradicting claim link, and it resolves", () => {
    for (const claim of claims) {
      if (claim.status !== "disputed") continue;
      expect(claim.contradictingClaimIds.length, `${claim.claimId} is disputed but has no contradiction link`).toBeGreaterThan(0);
      for (const otherId of claim.contradictingClaimIds) {
        expect(claimIds.has(otherId), `${claim.claimId} contradicts unknown claim ${otherId}`).toBe(true);
      }
    }
  });

  it("unsupported claims never authorize production rule enablement", () => {
    for (const claim of claims) {
      if (claim.status !== "unsupported") continue;
      const implication = claim.runtimeImplication.toLowerCase();
      expect(
        implication.includes("must not enable") || implication.includes("no production"),
        `${claim.claimId} is unsupported but its runtimeImplication does not forbid production enablement: "${claim.runtimeImplication}"`,
      ).toBe(true);
    }
  });

  it("school-policy-matrix entries only reference claim IDs that exist", () => {
    for (const topic of schoolPolicyMatrix.topics) {
      for (const entry of [topic.namPhai, topic.trungChau]) {
        for (const claimId of entry.claimIds) {
          expect(claimIds.has(claimId), `policy topic "${topic.topic}" references unknown claim ${claimId}`).toBe(true);
        }
        for (const sourceId of entry.sourceIds) {
          expect(sourceIds.has(sourceId), `policy topic "${topic.topic}" references unknown source ${sourceId}`).toBe(true);
        }
      }
    }
  });
});
