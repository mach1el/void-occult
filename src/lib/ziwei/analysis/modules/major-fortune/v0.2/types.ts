import type { ZiweiSchool } from "../../../facts";
import type {
  MajorFortuneV02BandId,
  MajorFortuneV02PillarId,
} from "../../../knowledge/major-fortune-scoring/v0.2";

export type MajorFortuneV02ScoreState =
  | "no-signal"
  | "balanced-signal"
  | "scored"
  | "partial-data"
  | "unavailable";

export type MajorFortuneV02ReasonCode =
  | "invalid-knowledge"
  | "no-active-major-fortune"
  | "invalid-resolved-context"
  | "research-blocked-rule"
  | "blocked-by-calculation-core"
  | "blocked-by-annual-independence"
  | "mutex-violation"
  | "missing-fact"
  | "school-capability-mismatch"
  | "partial-pillar-data";

export interface MajorFortuneV02Contribution {
  ruleId: string;
  pillarId: MajorFortuneV02PillarId;
  rawDelta: number;
  factIds: string[];
  sourceIds: string[];
  claimIds: string[];
  knowledgeStatus: string;
  physicalFactId: string;
}

export interface MajorFortuneV02PillarResult {
  cap: number;
  rawDelta: number;
  cappedDelta: number;
  status: "available" | "partial" | "unavailable";
  contributions: MajorFortuneV02Contribution[];
  reasonCodes: MajorFortuneV02ReasonCode[];
  matchedStructuralRuleIds: string[];
}

export interface MajorFortuneV02Diagnostics {
  invalidKnowledge: string[];
  noActiveMajorFortune: string[];
  invalidResolvedContext: string[];
  forbiddenAnnualFacts: string[];
  forbiddenSchoolTransformations: string[];
  mutexViolations: string[];
  researchBlockedMatches: string[];
  missingFacts: string[];
  unsupportedSchoolCapability: string[];
  missingProvenance: string[];
  calculationCoreBlockers: string[];
}

export interface MajorFortuneV02Result {
  module: "major-fortune";
  school: ZiweiSchool;
  status: "available" | "partial" | "unavailable";
  cycle: {
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
  } | null;
  score: number | null;
  band: MajorFortuneV02BandId | null;
  scoreState: MajorFortuneV02ScoreState;
  pillars: Record<MajorFortuneV02PillarId, MajorFortuneV02PillarResult>;
  natalResilience: {
    state: string | null;
    numericEffect: null;
    factIds: string[];
    supportingFacts: string[];
    blockingFacts: string[];
  };
  versions: {
    contractVersion: string;
    engineVersion: string;
    knowledgeVersion: string;
    formulaVersion: string;
    calculationPolicyProfileVersion: string | null;
  };
  diagnostics: MajorFortuneV02Diagnostics;
  trace: {
    preClampScore: number | null;
    pillarRaws: Record<MajorFortuneV02PillarId, number>;
    pillarCapped: Record<MajorFortuneV02PillarId, number>;
  };
}

export function emptyMajorFortuneV02Diagnostics(): MajorFortuneV02Diagnostics {
  return {
    invalidKnowledge: [],
    noActiveMajorFortune: [],
    invalidResolvedContext: [],
    forbiddenAnnualFacts: [],
    forbiddenSchoolTransformations: [],
    mutexViolations: [],
    researchBlockedMatches: [],
    missingFacts: [],
    unsupportedSchoolCapability: [],
    missingProvenance: [],
    calculationCoreBlockers: [],
  };
}
