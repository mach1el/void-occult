import type { AnnualAxisDomainId } from "../schema";
import type { AnnualAxesKnowledgeV042NamPhai } from "./schema";

export interface AnnualKnowledgeV042ValidationIssue {
  path: string;
  message: string;
}

const DOMAINS: AnnualAxisDomainId[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
];

/** The twelve classical natal palace names — every one must resolve
 * uniquely in the ownership catalog (prompt §1 "complete coverage"). */
const REQUIRED_PALACES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
] as const;

function issue(path: string, message: string): AnnualKnowledgeV042ValidationIssue {
  return { path, message };
}

function isUnitInterval(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
}

/**
 * Structural validation for the V0.4.2 strict physical domain ownership
 * pack. Fail closed — invalid packs must never produce numeric scores
 * (prompt §8: "If knowledge violates a cap: invalidKnowledge, score =
 * null. Do not silently truncate.").
 */
export function validateAnnualAxesKnowledgeV042NamPhai(
  knowledge: AnnualAxesKnowledgeV042NamPhai,
  resolvedSourceIds: Set<string>,
): { ok: true } | { ok: false; issues: AnnualKnowledgeV042ValidationIssue[] } {
  const issues: AnnualKnowledgeV042ValidationIssue[] = [];
  const maxDomains = knowledge.fanoutPolicy.maxNumericDomainsPerPalace;
  const maxSecondary = knowledge.fanoutPolicy.maxSecondaryOwnershipWeight;

  const seenPalaces = new Set<string>();
  for (const record of knowledge.ownership.records) {
    if (seenPalaces.has(record.palaceName)) {
      issues.push(issue(`ownership.records.${record.palaceName}`, "duplicate palace name"));
    }
    seenPalaces.add(record.palaceName);

    if (record.numericDomains.length > maxDomains) {
      issues.push(
        issue(
          `ownership.records.${record.palaceName}.numericDomains`,
          `exceeds maxNumericDomainsPerPalace (${maxDomains})`,
        ),
      );
    }

    const primaries = record.numericDomains.filter((d) => d.role === "primary");
    if (primaries.length > 1) {
      issues.push(
        issue(`ownership.records.${record.palaceName}`, "more than one primary domain"),
      );
    }

    const seenDomainsForPalace = new Set<AnnualAxisDomainId>();
    for (const entry of record.numericDomains) {
      if (seenDomainsForPalace.has(entry.domain)) {
        issues.push(
          issue(
            `ownership.records.${record.palaceName}.numericDomains.${entry.domain}`,
            "duplicate domain entry for this palace",
          ),
        );
      }
      seenDomainsForPalace.add(entry.domain);

      if (!isUnitInterval(entry.ownershipWeight)) {
        issues.push(
          issue(
            `ownership.records.${record.palaceName}.numericDomains.${entry.domain}.ownershipWeight`,
            "ownershipWeight must be in [0,1]",
          ),
        );
      } else if (entry.role === "secondary" && entry.ownershipWeight > maxSecondary + 1e-9) {
        issues.push(
          issue(
            `ownership.records.${record.palaceName}.numericDomains.${entry.domain}.ownershipWeight`,
            `secondary ownershipWeight exceeds maxSecondaryOwnershipWeight (${maxSecondary})`,
          ),
        );
      }

      if (!entry.rationale || entry.rationale.trim().length === 0) {
        issues.push(
          issue(
            `ownership.records.${record.palaceName}.numericDomains.${entry.domain}.rationale`,
            "rationale must be non-empty",
          ),
        );
      }

      for (const sid of entry.sourceIds) {
        if (!resolvedSourceIds.has(sid)) {
          issues.push(
            issue(
              `ownership.records.${record.palaceName}.numericDomains.${entry.domain}.sourceIds`,
              `unresolved source ${sid}`,
            ),
          );
        }
      }
    }

    for (const domain of record.contextOnlyDomains ?? []) {
      if (!DOMAINS.includes(domain)) {
        issues.push(
          issue(`ownership.records.${record.palaceName}.contextOnlyDomains`, `unknown domain ${domain}`),
        );
      }
    }
  }

  for (const palaceName of REQUIRED_PALACES) {
    if (!seenPalaces.has(palaceName)) {
      issues.push(issue("ownership.records", `missing required palace ${palaceName}`));
    }
  }
  if (seenPalaces.size !== REQUIRED_PALACES.length) {
    issues.push(
      issue(
        "ownership.records",
        `expected exactly ${REQUIRED_PALACES.length} unique palace records, got ${seenPalaces.size}`,
      ),
    );
  }

  const modifiers = knowledge.subjectModifiers.categoryModifiers;
  for (const [key, value] of Object.entries(modifiers)) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      issues.push(issue(`subjectModifiers.categoryModifiers.${key}`, "modifier must be a non-negative finite number"));
    }
  }

  if (knowledge.globalPolicy.defaultBehavior !== "context-only") {
    issues.push(
      issue(
        "globalPolicy.defaultBehavior",
        'V0.4.2 requires defaultBehavior = "context-only" (global channel default OFF)',
      ),
    );
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true };
}
