/**
 * Neutral Calculation Core fact adapter — CONTRACT ONLY (§10, §11).
 *
 * This file declares the shape a FUTURE symbolic evaluator would consume. It
 * carries physical chart facts and nothing else: no prior analysis result, no
 * score, no evidence, no prose.
 *
 * ── Allowed neutral import exception (§11, §15) ────────────────────────────
 * The only cross-package import permitted here is neutral, score-free canonical
 * identity from the Calculation Core facts layer:
 *   `src/lib/ziwei/analysis/facts/types.ts`
 * That module declares physical vocabulary (`ZiweiSchool`, `ZiweiBrightness`,
 * `ZiweiTransformation`, `ZiweiVoidType`, `ZiweiStarClass`) with NO scoring
 * fields and NO imports of any analysis result. Importing effect/score fields
 * from `analysis/knowledge/palace-overview`, `analysis/modules/annual-axes`,
 * `analysis/modules/major-fortune` or `analysis/modules/monthly-flow` is
 * forbidden and asserted by `__tests__/namespace-boundary.test.ts`.
 *
 * No evaluator is implemented in V0.1.
 */

import type {
  ZiweiBrightness,
  ZiweiSchool,
  ZiweiStarClass,
  ZiweiTransformation,
  ZiweiVoidType,
} from "@/lib/ziwei/analysis/facts/types";

export type { ZiweiSchool };

/** A physical star placement fact — identity + brightness, never an effect. */
export interface HuyenKhiPhysicalStarFact {
  readonly canonicalId: string;
  readonly displayName: string;
  readonly starClass: ZiweiStarClass;
  readonly brightness: ZiweiBrightness | null;
}

export interface HuyenKhiTransformationFact {
  readonly transformation: ZiweiTransformation;
  readonly targetCanonicalId: string;
  /** "natal" only in V0.1 — dynamic activation deferred. */
  readonly layer: "natal";
}

export interface HuyenKhiPalaceRelationFacts {
  readonly oppositeBranch: string;
  readonly trineBranches: readonly string[];
}

/**
 * Physical facts of a single palace. Read ONLY from Calculation Core; never
 * from any analysis score/evidence/prose result.
 */
export interface HuyenKhiPalaceFacts {
  readonly palaceIndex: number;
  readonly natalPalaceName: string;
  readonly branch: string;
  readonly stem: string | null;

  readonly majorStars: readonly HuyenKhiPhysicalStarFact[];
  readonly minorStars: readonly HuyenKhiPhysicalStarFact[];

  readonly isVoChinhDieu: boolean;
  readonly hasTuan: boolean;
  readonly hasTriet: boolean;

  readonly natalTransformations: readonly HuyenKhiTransformationFact[];
  readonly relations: HuyenKhiPalaceRelationFacts;

  readonly school: ZiweiSchool;
  readonly calculationVersions: Readonly<Record<string, string | null>>;
}

export type { ZiweiVoidType };
