import type { ChartData, School } from "@/types/chart";
import {
  factsForPalace,
  normalizeNatalFacts,
  type NatalZiweiFact,
} from "../../facts";
import { makeDiagnostic, sortDiagnostics } from "./diagnostics";
import { oppositePalaceIndex, trinePalaceIndexes } from "./geometry";
import {
  emptyDimensionStates,
  type HuyenKhiPreviewDiagnostic,
  type HuyenKhiPreviewPalace,
  type HuyenKhiPreviewResult,
  type HuyenKhiPreviewStar,
  type HuyenKhiPreviewTransformation,
  type HuyenKhiPreviewVoidMarker,
} from "./types";

const VERSIONS = {
  contractVersion: "0.1.0",
  adapterVersion: "0.1.0",
  copyVersion: "0.1.0",
} as const;

/** Deterministic presentation order: canonical Vietnamese name, then fact id. */
function compareStars(a: HuyenKhiPreviewStar, b: HuyenKhiPreviewStar): number {
  const byName = a.canonicalStarName.localeCompare(b.canonicalStarName, "vi");
  return byName || a.factId.localeCompare(b.factId);
}

const TRANSFORMATION_ORDER: Record<string, number> = {
  "Lộc": 0,
  "Quyền": 1,
  "Khoa": 2,
  "Kỵ": 3,
};

/** Deterministic presentation order: Lộc/Quyền/Khoa/Kỵ, then target star, then fact id. */
function compareTransformations(
  a: HuyenKhiPreviewTransformation,
  b: HuyenKhiPreviewTransformation,
): number {
  const ra = TRANSFORMATION_ORDER[a.transformation] ?? 99;
  const rb = TRANSFORMATION_ORDER[b.transformation] ?? 99;
  if (ra !== rb) return ra - rb;
  const byTarget = a.targetStar.localeCompare(b.targetStar, "vi");
  return byTarget || a.factId.localeCompare(b.factId);
}

const VOID_MARKER_ORDER: Record<string, number> = {
  "Tuần": 0,
  "Triệt": 1,
};

/** Deterministic presentation order: Tuần/Triệt, then fact id. */
function compareVoidMarkers(a: HuyenKhiPreviewVoidMarker, b: HuyenKhiPreviewVoidMarker): number {
  const ra = VOID_MARKER_ORDER[a.voidType] ?? 99;
  const rb = VOID_MARKER_ORDER[b.voidType] ?? 99;
  if (ra !== rb) return ra - rb;
  return a.factId.localeCompare(b.factId);
}

function toStar(fact: NatalZiweiFact): HuyenKhiPreviewStar | null {
  if (fact.kind !== "star" || !fact.starName || !fact.canonicalStarName) return null;
  return {
    factId: fact.id,
    starName: fact.starName,
    canonicalStarName: fact.canonicalStarName,
    brightness: fact.brightness,
  };
}

function toTransformation(fact: NatalZiweiFact): HuyenKhiPreviewTransformation | null {
  if (fact.kind !== "transformation" || !fact.transformation || !fact.targetStar) {
    return null;
  }
  return {
    factId: fact.id,
    transformation: fact.transformation,
    targetStar: fact.targetStar,
  };
}

function toVoid(fact: NatalZiweiFact): HuyenKhiPreviewVoidMarker | null {
  if (fact.kind !== "void-marker" || !fact.voidType) return null;
  return {
    factId: fact.id,
    voidType: fact.voidType,
  };
}

function isValidPalaceIndex(index: unknown): index is number {
  return Number.isInteger(index) && (index as number) >= 0 && (index as number) < 12;
}

function unavailableResult(
  school: School,
  diagnostics: HuyenKhiPreviewDiagnostic[],
): HuyenKhiPreviewResult {
  return {
    module: "huyen-khi",
    mode: "research-preview",
    evaluatorStatus: "not-promoted",
    status: "unavailable",
    school,
    palaces: [],
    diagnostics: sortDiagnostics(diagnostics),
    versions: VERSIONS,
  };
}

/**
 * Build a natal-only Huyền Khí research preview.
 * No scores, no evaluator states, no temporal facts.
 */
export function buildHuyenKhiPreview(
  chart: ChartData,
  options: { school: School },
): HuyenKhiPreviewResult {
  const { school } = options;
  const diagnostics: HuyenKhiPreviewDiagnostic[] = [];

  if (!chart.palaces || chart.palaces.length !== 12) {
    diagnostics.push(
      makeDiagnostic(
        "invalid-chart",
        `expected 12 palaces, got ${chart.palaces?.length ?? 0}`,
      ),
    );
    return unavailableResult(school, diagnostics);
  }

  const indexes = chart.palaces.map((p) => p.index).sort((a, b) => a - b);
  const uniqueIndexes = new Set(indexes);
  if (uniqueIndexes.size !== 12 || indexes.some((i, n) => i !== n)) {
    diagnostics.push(
      makeDiagnostic("invalid-chart", "palace indexes must be unique 0..11"),
    );
    return unavailableResult(school, diagnostics);
  }

  // Mệnh/Thân SSOT: the Calculation Core's own canonical indexes, never a
  // (possibly stale or malformed) per-palace flag. An invalid canonical
  // index fails closed rather than silently falling back to a flag.
  const canonicalMenhIndex = chart.menhIndex;
  const canonicalThanIndex = chart.thanIndex;

  if (!isValidPalaceIndex(canonicalMenhIndex)) {
    diagnostics.push(
      makeDiagnostic(
        "invalid-menh-index",
        `chart.menhIndex ${JSON.stringify(canonicalMenhIndex)} is not a valid palace index`,
      ),
    );
  }
  if (!isValidPalaceIndex(canonicalThanIndex)) {
    diagnostics.push(
      makeDiagnostic(
        "invalid-than-index",
        `chart.thanIndex ${JSON.stringify(canonicalThanIndex)} is not a valid palace index`,
      ),
    );
  }
  if (!isValidPalaceIndex(canonicalMenhIndex) || !isValidPalaceIndex(canonicalThanIndex)) {
    return unavailableResult(school, diagnostics);
  }

  const { facts, duplicateIds } = normalizeNatalFacts(chart, { school });

  for (const id of [...duplicateIds].sort()) {
    diagnostics.push(
      makeDiagnostic("duplicate-natal-fact-id", `duplicate natal fact id ${id}`, {
        factId: id,
      }),
    );
  }

  for (const fact of facts) {
    if (fact.layer !== "natal") {
      diagnostics.push(
        makeDiagnostic("unsupported-natal-fact", `non-natal fact ${fact.id}`, {
          factId: fact.id,
          palaceIndex: fact.palaceIndex,
        }),
      );
    }
    if (fact.school !== school) {
      diagnostics.push(
        makeDiagnostic(
          "school-mismatch",
          `fact school ${fact.school} != requested ${school}`,
          { factId: fact.id, palaceIndex: fact.palaceIndex },
        ),
      );
    }
  }

  // Flag mismatches (zero/multiple/wrong-palace flags) are diagnostics
  // only — they never change the canonical-index-derived output below.
  const menhFlaggedIndexes = chart.palaces.filter((p) => p.isMenh).map((p) => p.index);
  const menhFlagMismatch =
    menhFlaggedIndexes.length !== 1 || menhFlaggedIndexes[0] !== canonicalMenhIndex;
  if (menhFlagMismatch) {
    diagnostics.push(
      makeDiagnostic(
        "menh-index-flag-mismatch",
        `flagged Mệnh palace(s) [${menhFlaggedIndexes.join(",")}] do not match canonical index ${canonicalMenhIndex}`,
      ),
    );
  }

  const thanFlaggedIndexes = chart.palaces.filter((p) => p.isThan).map((p) => p.index);
  const thanFlagMismatch =
    thanFlaggedIndexes.length !== 1 || thanFlaggedIndexes[0] !== canonicalThanIndex;
  if (thanFlagMismatch) {
    diagnostics.push(
      makeDiagnostic(
        "than-index-flag-mismatch",
        `flagged Thân palace(s) [${thanFlaggedIndexes.join(",")}] do not match canonical index ${canonicalThanIndex}`,
      ),
    );
  }

  const byIndex = new Map(chart.palaces.map((p) => [p.index, p]));
  const majorsByPalace = new Map<number, HuyenKhiPreviewStar[]>();

  for (let i = 0; i < 12; i += 1) {
    const palaceFacts = factsForPalace(facts, i);
    const majors: HuyenKhiPreviewStar[] = [];
    for (const fact of palaceFacts) {
      if (fact.kind === "star" && fact.starClass === "major") {
        const star = toStar(fact);
        if (star) majors.push(star);
      }
    }
    majors.sort(compareStars);
    majorsByPalace.set(i, majors);
  }

  const palaces: HuyenKhiPreviewPalace[] = [];

  for (let i = 0; i < 12; i += 1) {
    const palace = byIndex.get(i);
    if (!palace) {
      diagnostics.push(
        makeDiagnostic("missing-palace", `missing palace at index ${i}`, {
          palaceIndex: i,
        }),
      );
      continue;
    }

    const palaceFacts = factsForPalace(facts, i);
    const majorStars: HuyenKhiPreviewStar[] = [];
    const minorStars: HuyenKhiPreviewStar[] = [];
    const natalTransformations: HuyenKhiPreviewTransformation[] = [];
    const voidMarkers: HuyenKhiPreviewVoidMarker[] = [];
    let changShengStage: string | null = null;

    for (const fact of palaceFacts) {
      if (fact.kind === "star") {
        const star = toStar(fact);
        if (!star) continue;
        if (fact.starClass === "major") majorStars.push(star);
        else minorStars.push(star);
      } else if (fact.kind === "transformation") {
        const tf = toTransformation(fact);
        if (tf) natalTransformations.push(tf);
      } else if (fact.kind === "void-marker") {
        const v = toVoid(fact);
        if (v) voidMarkers.push(v);
      } else if (fact.kind === "chang-sheng" && fact.changShengStage) {
        changShengStage = fact.changShengStage;
      }
    }

    majorStars.sort(compareStars);
    minorStars.sort(compareStars);
    natalTransformations.sort(compareTransformations);
    voidMarkers.sort(compareVoidMarkers);

    const opp = oppositePalaceIndex(i);
    // Populated only for Vô Chính Diệu palaces — a factual display
    // reference to the opposite palace's resident majors, never a
    // computed influence. See HuyenKhiPreviewPalace.borrowedMajorStars.
    const isVoChinhDieu = majorStars.length === 0;
    const borrowedMajorStars = isVoChinhDieu ? [...(majorsByPalace.get(opp) ?? [])] : [];

    palaces.push({
      palaceIndex: i,
      palaceName: palace.name,
      branch: palace.branch,
      stem: palace.stem ?? null,
      isMenh: palace.index === canonicalMenhIndex,
      isThan: palace.index === canonicalThanIndex,
      changShengStage: changShengStage ?? palace.changSheng?.trim() ?? null,
      isVoChinhDieu,
      oppositePalaceIndex: opp,
      trinePalaceIndexes: trinePalaceIndexes(i),
      majorStars,
      minorStars,
      natalTransformations,
      voidMarkers,
      borrowedMajorStars,
      dimensionStates: emptyDimensionStates(),
      dimensionStateReason: "symbolic-evaluator-not-promoted",
    });
  }

  palaces.sort((a, b) => a.palaceIndex - b.palaceIndex);

  const blocking = new Set([
    "invalid-chart",
    "invalid-menh-index",
    "invalid-than-index",
    "missing-palace",
  ]);
  const hasBlocking = diagnostics.some((d) => blocking.has(d.code));
  const hasSoft = diagnostics.some((d) => !blocking.has(d.code));

  let status: HuyenKhiPreviewResult["status"] = "available";
  if (palaces.length !== 12 || hasBlocking) status = "unavailable";
  else if (hasSoft) status = "partial";

  if (status === "unavailable" && palaces.length !== 12) {
    return unavailableResult(school, diagnostics);
  }

  return {
    module: "huyen-khi",
    mode: "research-preview",
    evaluatorStatus: "not-promoted",
    status,
    school,
    palaces: status === "unavailable" ? [] : palaces,
    diagnostics: sortDiagnostics(diagnostics),
    versions: VERSIONS,
  };
}
