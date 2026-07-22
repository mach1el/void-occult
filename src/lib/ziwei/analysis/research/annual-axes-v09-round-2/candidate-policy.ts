/**
 * Clone V0.8 knowledge and inject authorized Lưu Thiên Mã rules (research-only).
 */

import {
  loadAnnualAxesKnowledgeV08NamPhai,
  type AnnualAxesKnowledgeV08NamPhai,
  type V08PointClass,
  type V08StarRule,
} from "../../knowledge/annual-axes/v0.8";
import type { AnnualAxesCandidateRound2, R2DomainBinding } from "./schema";
import { AUTHORIZED_STAR } from "./foundation-intake";

const EXCLUDED = new Set([
  "Lưu Đào Hoa",
  "Lưu Hồng Loan",
  "Lưu Hỷ Thần",
  "Lưu Kiếp Sát",
  "Lưu Long Đức",
  "Lưu Nguyệt Đức",
  "Lưu Phúc Đức",
  "Lưu Thiên Đức",
  "Lưu Thiên Hỷ",
  "Lưu Văn Khúc",
  "Lưu Văn Xương",
  "Lưu Đại Hao",
  "Lưu Tiểu Hao",
  "Lưu Phục Binh",
  "Lưu Tuần",
  "Lưu Triệt",
]);

/** Map engineering magnitudes onto existing V0.8 point classes (no custom scale). */
export function pointClassForMagnitude(magnitude: number): V08PointClass {
  if (magnitude <= 0.75) return "staticPositive"; // 1
  if (magnitude <= 1.25) return "staticPositive"; // 1
  return "otherAnnualPositive"; // 2
}

export function resolvedPointValue(magnitude: number): number {
  return pointClassForMagnitude(magnitude) === "otherAnnualPositive" ? 2 : 1;
}

function deepCloneKnowledge(knowledge: AnnualAxesKnowledgeV08NamPhai): AnnualAxesKnowledgeV08NamPhai {
  return JSON.parse(JSON.stringify(knowledge)) as AnnualAxesKnowledgeV08NamPhai;
}

function buildThienMaRule(
  domain: R2DomainBinding,
  candidate: AnnualAxesCandidateRound2,
): V08StarRule {
  const pointClass = pointClassForMagnitude(candidate.pointMagnitude);
  const dignity =
    candidate.dignityMode === "eligibility-only" ? ["M", "V"] : undefined;
  return {
    starName: AUTHORIZED_STAR,
    pointClass,
    ruleId: `r2-thien-ma-${domain}-${candidate.candidateId}`,
    polarity: "positive",
    allowedTemporalLayers: ["annual"],
    requiresDignity: dignity,
    provenance: {
      sourceIds: [...candidate.sourceIds],
      status: "engineering-hypothesis",
      confidence: "medium",
      rationale:
        "Round-2 engineering hypothesis: positive activation for movement/change (CLM-AAV09-019 qualitative; numeric magnitude not classical).",
      locator: "SRC-AA-V09-TAN-BIEN-1956§4.4",
    },
  };
}

/**
 * Build research knowledge for a candidate. Control returns production knowledge unchanged.
 */
export function buildCandidateKnowledge(
  candidate: AnnualAxesCandidateRound2,
): AnnualAxesKnowledgeV08NamPhai {
  const loaded = loadAnnualAxesKnowledgeV08NamPhai();
  if (!loaded.ok) {
    throw new Error(`Cannot load V0.8 knowledge: ${JSON.stringify(loaded.issues)}`);
  }
  if (candidate.candidateType === "control") {
    return loaded.knowledge;
  }

  for (const star of candidate.includedStarNames) {
    if (star !== AUTHORIZED_STAR) {
      throw new Error(`Unauthorized included star: ${star}`);
    }
  }
  for (const star of candidate.includedStarNames) {
    if (EXCLUDED.has(star)) throw new Error(`Excluded star cannot be included: ${star}`);
  }
  if (candidate.polarityMode === "positive-activation" && candidate.pointMagnitude < 0) {
    throw new Error("Negative fixed magnitude not authorized for Thiên Mã round-2");
  }

  const knowledge = deepCloneKnowledge(loaded.knowledge);
  for (const domain of candidate.domainBindings) {
    const rule = buildThienMaRule(domain, candidate);
    const axis = knowledge.starRegistry.axes[domain];
    // Replace any prior injected rule id for this candidate/domain.
    axis.positive = axis.positive.filter((r) => r.ruleId !== rule.ruleId);
    axis.positive.push(rule);
    axis.positive.sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  }

  return knowledge;
}
