/**
 * CLI: validate the Annual Axes V0.9 research pack (schemas + cross-references).
 * Exit 1 on any error. No network, no engine import — pure fs/JSON checks.
 *   npm run research:annual-axes-v09:validate
 */
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PACK_ROOT = join(process.cwd(), "research/annual-axes/v0.9-foundation");

function readJson(relPath: string): any {
  return JSON.parse(readFileSync(join(PACK_ROOT, relPath), "utf8"));
}

interface Issue {
  code: string;
  message: string;
}

function main(): void {
  const issues: Issue[] = [];
  const ajv = new Ajv({ allErrors: true });

  const sourceRegistry = readJson("sources/source-registry.v0.9.json");
  const claimRegistry = readJson("sources/claim-registry.v0.9.json");
  const schoolPolicyMatrix = readJson("policy/school-policy-matrix.v0.9.json");
  const auditContract = readJson("audit/audit-contract.v0.9.json");

  const schemaChecks: Array<[string, string, any]> = [
    ["sources/source-registry.v0.9.json", "schema/source-registry.schema.json", sourceRegistry],
    ["sources/claim-registry.v0.9.json", "schema/claim-registry.schema.json", claimRegistry],
    ["policy/school-policy-matrix.v0.9.json", "schema/policy-matrix.schema.json", schoolPolicyMatrix],
    ["audit/audit-contract.v0.9.json", "schema/audit-contract.schema.json", auditContract],
  ];

  for (const [dataPath, schemaPath, data] of schemaChecks) {
    const schema = readJson(schemaPath);
    const validate = ajv.compile(schema);
    if (!validate(data)) {
      for (const err of validate.errors ?? []) {
        issues.push({ code: "schema", message: `${dataPath}: ${err.instancePath} ${err.message}` });
      }
    }
  }

  const sourceIds = new Set(sourceRegistry.sources.map((s: any) => s.sourceId));
  const claims: any[] = claimRegistry.claims;
  const claimIds = new Set(claims.map((c) => c.claimId));

  if (claimIds.size !== claims.length) {
    issues.push({ code: "duplicate-claim-id", message: "claim-registry.v0.9.json has duplicate claimIds" });
  }

  for (const claim of claims) {
    for (const sourceId of claim.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        issues.push({ code: "unresolved-source", message: `${claim.claimId} references unknown source ${sourceId}` });
      }
    }
    if ((claim.status === "classical" || claim.status === "derived") && claim.locators.length === 0) {
      issues.push({ code: "missing-locator", message: `${claim.claimId} is ${claim.status} but has no locator` });
    }
    if (claim.status === "disputed" && claim.contradictingClaimIds.length === 0) {
      issues.push({ code: "unresolved-contradiction", message: `${claim.claimId} is disputed but has no contradiction link` });
    }
    if (claim.status === "unsupported") {
      const implication = String(claim.runtimeImplication).toLowerCase();
      if (!implication.includes("must not enable") && !implication.includes("no production")) {
        issues.push({ code: "unsupported-enables-production", message: `${claim.claimId} is unsupported but does not forbid production enablement` });
      }
    }
  }

  for (const topic of schoolPolicyMatrix.topics) {
    for (const entry of [topic.namPhai, topic.trungChau]) {
      for (const claimId of entry.claimIds) {
        if (!claimIds.has(claimId)) {
          issues.push({ code: "unresolved-claim", message: `policy topic "${topic.topic}" references unknown claim ${claimId}` });
        }
      }
      for (const sourceId of entry.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          issues.push({ code: "unresolved-source", message: `policy topic "${topic.topic}" references unknown source ${sourceId}` });
        }
      }
    }
  }

  process.stdout.write("Annual Axes V0.9 research pack validation\n");
  process.stdout.write(
    `${JSON.stringify({ sources: sourceRegistry.sources.length, claims: claims.length, issues: issues.length }, null, 2)}\n`,
  );

  if (issues.length > 0) {
    process.stdout.write(`\n${issues.length} issue(s):\n`);
    for (const issue of issues) process.stdout.write(`  [${issue.code}] ${issue.message}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write("\nOK — schemas valid, all references resolve, all status invariants hold.\n");
}

main();
