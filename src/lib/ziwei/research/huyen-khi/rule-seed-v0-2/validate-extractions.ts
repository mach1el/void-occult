import { readFileSync } from "node:fs";
import path from "node:path";

import { loadHuyenKhiOntology } from "../ontology/load-ontology";
import { ONTOLOGY_SCHEMAS_DIR } from "../ontology/paths";
import {
  validateAgainstSchema,
  type JsonSchema,
} from "../ontology/schema-validator";
import type { ValidationIssue, ValidationResult } from "./types";

let locatorSchema: JsonSchema | null = null;
function getLocatorSchema(): JsonSchema {
  if (!locatorSchema) {
    locatorSchema = JSON.parse(
      readFileSync(
        path.join(ONTOLOGY_SCHEMAS_DIR, "locator.schema.v0.1.json"),
        "utf-8",
      ),
    ) as JsonSchema;
  }
  return locatorSchema;
}

function error(code: string, pathValue: string, message: string): ValidationIssue {
  return { code, path: pathValue, message, severity: "error" };
}

export function validateExtractions(data: any): ValidationResult {
  const issues: ValidationIssue[] = [];
  const extractions = data?.extractions?.extractions;

  if (!Array.isArray(extractions)) {
    return {
      valid: false,
      issues: [
        error("EXT_ARRAY", "extractions.extractions", "extractions must be an array"),
      ],
    };
  }

  const loaded = loadHuyenKhiOntology();
  if (!loaded.ok) {
    return {
      valid: false,
      issues: [
        error(
          "ONTOLOGY_INVALID",
          "ontology",
          "canonical ontology V0.1 failed to load; extraction validation fails closed",
        ),
      ],
    };
  }

  const knownSources = new Set(
    loaded.ontology.sourceRegistry.sources.map((source) => source.sourceId),
  );
  const knownClaims = new Set(
    loaded.ontology.claimRegistry.claims.map((claim) => claim.claimId),
  );
  const knownTopics = new Set(
    loaded.ontology.researchTopicCoverage.topics.map((topic) => topic.topicId),
  );
  const allowedSchools = new Set(["shared", "nam-phai", "trung-chau", "unresolved"]);
  const ids = new Set<string>();

  extractions.forEach((entry: any, index: number) => {
    const base = `extractions[${index}]`;
    if (typeof entry?.extractionId !== "string" || !entry.extractionId.startsWith("HK-EXT-")) {
      issues.push(
        error(
          "EXT_INVALID_ID",
          `${base}.extractionId`,
          "extractionId must start with HK-EXT-",
        ),
      );
    } else if (ids.has(entry.extractionId)) {
      issues.push(
        error(
          "EXT_DUPLICATE_ID",
          `${base}.extractionId`,
          `duplicate extractionId ${entry.extractionId}`,
        ),
      );
    } else {
      ids.add(entry.extractionId);
    }

    if (typeof entry?.topicId !== "string" || !knownTopics.has(entry.topicId)) {
      issues.push(
        error(
          "EXT_UNRESOLVED_TOPIC",
          `${base}.topicId`,
          `topic '${String(entry?.topicId)}' is not in ontology V0.1`,
        ),
      );
    }
    if (typeof entry?.sourceId !== "string" || !knownSources.has(entry.sourceId)) {
      issues.push(
        error(
          "EXT_UNRESOLVED_SOURCE",
          `${base}.sourceId`,
          `source '${String(entry?.sourceId)}' is not registered in ontology V0.1`,
        ),
      );
    }
    if (typeof entry?.schoolProfile !== "string" || !allowedSchools.has(entry.schoolProfile)) {
      issues.push(
        error(
          "EXT_INVALID_SCHOOL",
          `${base}.schoolProfile`,
          `unsupported school profile '${String(entry?.schoolProfile)}'`,
        ),
      );
    }

    for (const violation of validateAgainstSchema(
      entry?.locator,
      getLocatorSchema(),
      `${base}.locator`,
    )) {
      issues.push(error("EXT_LOCATOR_SCHEMA", violation.path, violation.message));
    }
    if (entry?.locator?.sourceId !== entry?.sourceId) {
      issues.push(
        error(
          "EXT_LOCATOR_SOURCE_MISMATCH",
          `${base}.locator.sourceId`,
          "locator.sourceId must equal extraction sourceId",
        ),
      );
    }

    if (typeof entry?.excerpt !== "string" || entry.excerpt.trim().length < 10) {
      issues.push(
        error("EXT_MISSING_EXCERPT", `${base}.excerpt`, "excerpt must be non-empty"),
      );
    }
    // Independent of length: a short ellipsis string is still a placeholder,
    // not a source-located excerpt (fail closed on both conditions).
    if (typeof entry?.excerpt === "string" && entry.excerpt.includes("...")) {
      issues.push(
        error(
          "EXT_PLACEHOLDER_EXCERPT",
          `${base}.excerpt`,
          "ellipsis placeholder is not a source-located excerpt",
        ),
      );
    }
    if (typeof entry?.paraphrase !== "string" || entry.paraphrase.trim().length < 20) {
      issues.push(
        error(
          "EXT_MISSING_PARAPHRASE",
          `${base}.paraphrase`,
          "candidate extraction requires a careful paraphrase",
        ),
      );
    }

    if (!Array.isArray(entry?.candidateClaimIds)) {
      issues.push(
        error(
          "EXT_CLAIM_ARRAY",
          `${base}.candidateClaimIds`,
          "candidateClaimIds must be an array",
        ),
      );
    } else {
      entry.candidateClaimIds.forEach((claimId: unknown, claimIndex: number) => {
        if (typeof claimId !== "string" || !knownClaims.has(claimId)) {
          issues.push(
            error(
              "EXT_UNRESOLVED_CLAIM",
              `${base}.candidateClaimIds[${claimIndex}]`,
              `claim '${String(claimId)}' is not registered in ontology V0.1`,
            ),
          );
        }
      });
    }

    const flags = entry?.verificationFlags;
    if (!Array.isArray(flags) || flags.length === 0) {
      issues.push(
        error(
          "EXT_MISSING_VERIFICATION_FLAGS",
          `${base}.verificationFlags`,
          "verificationFlags must be a non-empty array",
        ),
      );
    } else {
      const allowed = new Set([
        "candidate-located",
        "witness-verified",
        "source-reviewed",
      ]);
      flags.forEach((flag: unknown, flagIndex: number) => {
        if (typeof flag !== "string" || !allowed.has(flag)) {
          issues.push(
            error(
              "EXT_INVALID_VERIFICATION_FLAG",
              `${base}.verificationFlags[${flagIndex}]`,
              `unsupported verification flag '${String(flag)}'`,
            ),
          );
        }
      });
      if (
        flags.includes("witness-verified") &&
        entry?.locator?.verificationStatus !== "cross-checked-against-witness" &&
        entry?.locator?.verificationStatus !== "expert-verified"
      ) {
        issues.push(
          error(
            "EXT_FALSE_WITNESS_STATUS",
            `${base}.verificationFlags`,
            "witness-verified requires a cross-checked or expert-verified locator",
          ),
        );
      }
      if (
        flags.includes("source-reviewed") &&
        entry?.locator?.verificationStatus !== "expert-verified"
      ) {
        issues.push(
          error(
            "EXT_FALSE_REVIEW_STATUS",
            `${base}.verificationFlags`,
            "source-reviewed requires an expert-verified locator",
          ),
        );
      }
    }

    if (!Array.isArray(entry?.ambiguities) || !Array.isArray(entry?.limitations)) {
      issues.push(
        error(
          "EXT_MISSING_BOUNDARIES",
          base,
          "ambiguities and limitations must be explicit arrays",
        ),
      );
    }
  });

  return { valid: !issues.some((entry) => entry.severity === "error"), issues };
}
