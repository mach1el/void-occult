/** Shared contracts for Zi Wei analysis modules. */

import {
  isAnnualAxesV05Enabled,
  isAnnualAxesV06Enabled,
  isPalaceOverviewV1Enabled,
} from "../feature-flags";
import { loadAnnualAxesKnowledgeV0 } from "../knowledge/annual-axes";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../knowledge/annual-axes/v0.4";
import { loadAnnualAxesKnowledgeV042NamPhai } from "../knowledge/annual-axes/v0.4.2";
import { loadAnnualAxesKnowledgeV05NamPhai } from "../knowledge/annual-axes/v0.5";
import { loadAnnualAxesKnowledgeV06NamPhai } from "../knowledge/annual-axes/v0.6";
import { loadPalaceOverviewKnowledgeV1 } from "../knowledge";
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
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid Trung Châu knowledge", annualKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const numericKnowledge = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledge.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid palace-overview numeric knowledge", numericKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  return { status: "available", module: "annual-axes", version: "0.2.0" };
}

function annualAxesStatusForNamPhaiV05(): ZiweiAnalysisStatus {
  const knowledge05 = loadAnnualAxesKnowledgeV05NamPhai();
  if (!knowledge05.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid V0.5 knowledge", knowledge05.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
  if (!knowledge04.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid V0.4 knowledge", knowledge04.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const knowledge042 = loadAnnualAxesKnowledgeV042NamPhai();
  if (!knowledge042.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid V0.4.2 knowledge", knowledge042.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const numericKnowledge = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledge.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid palace-overview numeric knowledge", numericKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  return { status: "available", module: "annual-axes", version: "0.5.0" };
}

function annualAxesStatusForNamPhaiV06(): ZiweiAnalysisStatus {
  const knowledge06 = loadAnnualAxesKnowledgeV06NamPhai();
  if (!knowledge06.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid V0.6 knowledge", knowledge06.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
  if (!knowledge04.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid V0.4 knowledge", knowledge04.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const knowledge042 = loadAnnualAxesKnowledgeV042NamPhai();
  if (!knowledge042.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid V0.4.2 knowledge", knowledge042.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const numericKnowledge = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledge.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid palace-overview numeric knowledge", numericKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  return { status: "available", module: "annual-axes", version: "0.6.0" };
}

function annualAxesStatusForNamPhaiV042Fallback(): ZiweiAnalysisStatus {
  const knowledge04 = loadAnnualAxesKnowledgeV04NamPhai();
  if (!knowledge04.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid V0.4 knowledge", knowledge04.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const knowledge042 = loadAnnualAxesKnowledgeV042NamPhai();
  if (!knowledge042.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid V0.4.2 knowledge", knowledge042.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  const numericKnowledge = loadPalaceOverviewKnowledgeV1();
  if (!numericKnowledge.ok) {
    if (import.meta.env.DEV) {
      console.warn("[annual-axes] invalid palace-overview numeric knowledge", numericKnowledge.issues);
    }
    return { status: "unavailable", module: "annual-axes", reason: "invalid-knowledge" };
  }

  return { status: "available", module: "annual-axes", version: "0.4.2" };
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
      if (import.meta.env.DEV) {
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

    // V0.6 remains opt-in until a candidate is holdout-approved.
    if (isAnnualAxesV06Enabled()) {
      return annualAxesStatusForNamPhaiV06();
    }

    if (isAnnualAxesV05Enabled()) {
      return annualAxesStatusForNamPhaiV05();
    }

    return annualAxesStatusForNamPhaiV042Fallback();
  }

  // major-fortune and monthly-flow intentionally remain "rebuilding" —
  // their scoring engines exist but no UI has been published yet.
  return { status: "unavailable", module, reason: "rebuilding" };
}

export const ANALYSIS_MODULES: ZiweiAnalysisModule[] = [
  "palace-overview",
  "annual-axes",
  "major-fortune",
  "monthly-flow",
];
