/**
 * Type surface for Annual Axes V0.4.2 (strict physical domain routing)
 * Nam Phái knowledge — the exact physical target palace's ownership
 * record decides domain eligibility. Star/Tứ Hóa knowledge (v0.4) still
 * decides polarity (support/pressure/activation), never eligibility.
 */

import type { AnnualAxisDomainId } from "../schema";

export type PhysicalOwnershipRole = "primary" | "secondary";

export interface PhysicalPalaceDomainOwnershipEntry {
  domain: AnnualAxisDomainId;
  ownershipWeight: number;
  role: PhysicalOwnershipRole;
  rationale: string;
  sourceIds: string[];
  knowledgeStatus: "approved" | "experimental";
}

export interface PhysicalPalaceDomainOwnershipRecord {
  palaceName: string;
  /** ≤ `fanoutPolicy.maxNumericDomainsPerPalace`, ≤1 with role "primary". */
  numericDomains: PhysicalPalaceDomainOwnershipEntry[];
  /** Context/explainability only — never numeric eligibility. */
  contextOnlyDomains?: AnnualAxisDomainId[];
}

export interface AnnualPhysicalDomainOwnershipCatalogV042 {
  schemaVersion: string;
  catalogId: string;
  status: string;
  requiresCalibration: boolean;
  records: PhysicalPalaceDomainOwnershipRecord[];
}

export interface AnnualEvidenceFanoutPolicyV042 {
  schemaVersion: string;
  policyId: string;
  maxNumericDomainsPerPalace: number;
  maxSecondaryOwnershipWeight: number;
  unmappedPalaceBehavior: "invalid-knowledge" | "context-only";
}

export interface AnnualGlobalEvidencePolicyV042 {
  schemaVersion: string;
  policyId: string;
  defaultBehavior: "context-only" | "eligible";
  enabledGlobalSubjects: string[];
}

/**
 * §2 — optional subject modifier. May only *scale* an already physically
 * eligible domain; never creates eligibility. `categoryModifiers` is a
 * coarse, category-level default (major star / minor star / mutagen);
 * a future per-subject override table can refine this without changing
 * the contract.
 */
export interface AnnualSubjectModifierPolicyV042 {
  schemaVersion: string;
  policyId: string;
  status: string;
  requiresCalibration: boolean;
  defaultModifier: number;
  categoryModifiers: {
    majorStar: number;
    minorStar: number;
    mutagen: number;
  };
}

export interface AnnualAxesKnowledgeV042NamPhai {
  ownership: AnnualPhysicalDomainOwnershipCatalogV042;
  fanoutPolicy: AnnualEvidenceFanoutPolicyV042;
  globalPolicy: AnnualGlobalEvidencePolicyV042;
  subjectModifiers: AnnualSubjectModifierPolicyV042;
}
