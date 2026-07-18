/**
 * Loader SSOT cho profile experimental nam-phai-monthly-v2.
 * Validate một lần; không nhân bản hằng số ra ngoài file JSON.
 */

import type { ScoringProfileId } from "../types";
import framePatternRules from "../../knowledge/experimental/nam-phai-monthly-v2/frame-pattern-rules.json";
import scoringProfile from "../../knowledge/experimental/nam-phai-monthly-v2/scoring-profile-v2.json";

export type { ScoringProfileId };

export type ScoreAxis =
  | "benefit"
  | "risk"
  | "activation"
  | "conflict"
  | "stability";

export interface AxisEffect {
  axis: ScoreAxis;
  delta: number;
}

export interface PatternOperationEffect {
  operation: string;
  fromRole?: string;
  factor?: number;
  benefitFactor?: number;
  riskFactor?: number;
}

export type PatternEffect = AxisEffect | PatternOperationEffect;

export interface PatternWhen {
  brightCountAtLeast?: number;
  allowedBrightness?: string[];
  hasAnyTransform?: string[];
  afflictedMajorCountAtLeast?: number;
  afflictions?: string[];
  focusHasNoMajorStar?: boolean;
  oppositeHasMajorStar?: boolean;
  hasTransformsAcrossLayers?: string[];
  monthlyFocusEqualsActiveMajorFortunePalace?: boolean;
}

export interface PatternRule {
  id: string;
  name: string;
  scope: string;
  requiresAllStars?: string[];
  requiresAtLeastStars?: { count: number; from: string[] };
  when?: PatternWhen;
  effects: PatternEffect[];
  conditionalEffects?: Array<{
    when: PatternWhen;
    effects: PatternEffect[];
  }>;
  notes?: string;
}

export interface NamPhaiMonthlyV2Profile {
  profileId: string;
  version: string;
  status: string;
  geometry: { focus: number; xung: number; tamHop: number };
  categoryMultipliers: {
    majorStar: number;
    minorStar: number;
    mutagen: number;
    void: number;
    changSheng: number;
    guardrail: number;
  };
  minorStarCaps: {
    perPalaceBenefit: number;
    perPalaceRisk: number;
    frameBenefitShareOfCore: number;
    frameRiskShareOfCore: number;
    sameGroupMaxCount: number;
  };
  majorStarDominance: {
    focusAnchorActivation: number;
    xungAnchorActivation: number;
    tamHopAnchorActivation: number;
    focusMajorPairActivation: number;
  };
  majorFortuneContext: {
    sameFocusPalace: {
      activationDelta: number;
      benefitFactor: number;
      riskFactor: number;
    };
    focusInsideMajorFortuneFrame: {
      activationDelta: number;
      benefitFactor: number;
      riskFactor: number;
    };
    majorMutagenRoleWeight: {
      focus: number;
      xung: number;
      tamHop: number;
    };
  };
  layerWeights: {
    natal: number;
    majorFortune: number;
    annual: number;
    monthly: number;
  };
  normalization: {
    method: string;
    scale: {
      benefit: number;
      risk: number;
      activation: number;
      conflict: number;
    };
    keepRaw: boolean;
    neverAddNormalizationScoreLine: boolean;
  };
  confidence: {
    base: number;
    approvedRuleBonus: number;
    experimentalRulePenalty: number;
    max: number;
    min: number;
  };
}

let cachedProfile: NamPhaiMonthlyV2Profile | null = null;
let cachedRules: PatternRule[] | null = null;

function assertProfile(raw: typeof scoringProfile): NamPhaiMonthlyV2Profile {
  if (raw.profileId !== "nam-phai-monthly-v2-experimental") {
    throw new Error(`Unexpected profileId: ${raw.profileId}`);
  }
  if (raw.normalization.method !== "softSaturation") {
    throw new Error(`Unexpected normalization method: ${raw.normalization.method}`);
  }
  if (!raw.normalization.neverAddNormalizationScoreLine) {
    throw new Error("Profile must forbid fake normalization ScoreLine");
  }
  return raw as unknown as NamPhaiMonthlyV2Profile;
}

export function loadNamPhaiMonthlyV2Profile(): NamPhaiMonthlyV2Profile {
  if (!cachedProfile) cachedProfile = assertProfile(scoringProfile);
  return cachedProfile;
}

export function loadFramePatternRules(): PatternRule[] {
  if (!cachedRules) {
    if (!Array.isArray(framePatternRules.rules)) {
      throw new Error("frame-pattern-rules.json missing rules[]");
    }
    cachedRules = framePatternRules.rules as PatternRule[];
  }
  return cachedRules;
}

export function isExperimentalMonthlyProfile(
  id: ScoringProfileId | undefined,
): boolean {
  return id === "nam-phai-monthly-v2-experimental";
}
