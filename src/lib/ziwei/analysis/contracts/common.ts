/** Shared contracts for Zi Wei analysis modules. */

import {
  isMajorFortuneV03OrdinalEnabled,
  isPalaceOverviewV1Enabled,
} from "../feature-flags";
import { loadAnnualAxesKnowledgeV0 } from "../knowledge/annual-axes";
import { loadAnnualAxesKnowledgeV08NamPhai } from "../knowledge/annual-axes/v0.8";
import { loadPalaceOverviewKnowledgeV1 } from "../knowledge";
import { loadMajorFortuneOrdinalKnowledge } from "../knowledge/major-fortune-scoring/v0.3-ordinal";
import type { ZiweiSchool } from "../facts";

export type ZiweiAnalysisModule =
  | "palace-overview"
  | "annual-axes"
  | "major-fortune"
  | "monthly-flow";

export type ZiweiAnalysisStatus =
  | {
      status: "unavailable";
      module: ZiweiAnalysisModule;
      reason: "rebuilding" | "invalid-knowledge";
    }
  | {
      status: "available";
      module: ZiweiAnalysisModule;
      version: string;
    };

export interface GetAnalysisStatusOptions {
  school?: ZiweiSchool;
}

function annualAxesStatusForTrungChau(): ZiweiAnalysisStatus {
  const annualKnowledge = loadAnnualAxesKnowledgeV0();
  if (!annualKnowledge.ok) {
    if (import.meta.env?.DEV) {
      console.warn("[annual-axes] invalid Trung Châu knowledge", annualKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const numericKnowledge = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledge.ok) {
    if (import.meta.env?.DEV) {
      console.warn("[annual-axes] invalid palace-overview numeric knowledge", numericKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  return { status: "available", module: "annual-axes", version: "0.2.0" };
}

function annualAxesStatusForNamPhaiV08(): ZiweiAnalysisStatus {
  const knowledge08 = loadAnnualAxesKnowledgeV08NamPhai();
  if (!knowledge08.ok) {
    if (import.meta.env?.DEV) {
      console.warn("[annual-axes] invalid V0.8 knowledge", knowledge08.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  return { status: "available", module: "annual-axes", version: "0.8.0" };
}

export function getAnalysisStatus(
  module: ZiweiAnalysisModule,
  options?: GetAnalysisStatusOptions,
): ZiweiAnalysisStatus {
  if (module === "palace-overview") {
    if (!isPalaceOverviewV1Enabled()) {
      return { status: "unavailable", module, reason: "rebuilding" };
    }
    const loaded = loadPalaceOverviewKnowledgeV1();
    if (!loaded.ok) {
      if (import.meta.env?.DEV) {
        console.warn("[palace-overview] invalid knowledge", loaded.issues);
      }
      return { status: "unavailable", module, reason: "invalid-knowledge" };
    }
    return { status: "available", module, version: loaded.knowledge.profile.version };
  }

  if (module === "annual-axes") {
    const school = options?.school ?? "nam-phai";
    if (school === "trung-chau") {
      return annualAxesStatusForTrungChau();
    }
    return annualAxesStatusForNamPhaiV08();
  }

  if (module === "major-fortune") {
    if (!isMajorFortuneV03OrdinalEnabled()) {
      return { status: "unavailable", module, reason: "rebuilding" };
    }
    const loaded = loadMajorFortuneOrdinalKnowledge();
    if (!loaded.ok) {
      if (import.meta.env?.DEV) {
        console.warn("[major-fortune] invalid V0.3 knowledge", loaded.issues);
      }
      return { status: "unavailable", module, reason: "invalid-knowledge" };
    }
    return { status: "available", module, version: "0.3.1" };
  }

  // monthly-flow intentionally remains "rebuilding".
  return { status: "unavailable", module, reason: "rebuilding" };
}

export const ANALYSIS_MODULES: ZiweiAnalysisModule[] = [
  "palace-overview",
  "annual-axes",
  "major-fortune",
  "monthly-flow",
];
