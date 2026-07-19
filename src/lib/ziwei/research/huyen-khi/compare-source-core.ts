import { loadPalaceOverviewKnowledgeV1 } from "../../analysis/knowledge";
import { buildHuyenKhiChartFactSnapshotsForConfirmedDate } from "./build-chart-fact-snapshot";
import { parseMenhGeometry } from "./parse-menh-geometry";
import type { HuyenKhiCalendarHourRow, SetAgreement, SourceCoreAgreementReport } from "./types-v02-1";

const BRANCH_SPELLING_ALIASES: Record<string, string> = { tí: "tý", tị: "tỵ" };

function normalize(s: string): string {
  const lower = s.trim().toLowerCase();
  return BRANCH_SPELLING_ALIASES[lower] ?? lower;
}

function splitStemBranch(stemBranch: string): { stem: string; branch: string } | null {
  const parts = stemBranch.trim().split(/\s+/);
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { stem: parts[0], branch: parts[1] };
}

function setAgreement(sourceNames: string[], coreNames: string[]): SetAgreement {
  const source = new Set(sourceNames.map(normalize));
  const core = new Set(coreNames.map(normalize));
  return {
    onlyInSource: [...source].filter((n) => !core.has(n)),
    onlyInCore: [...core].filter((n) => !source.has(n)),
    inBoth: [...source].filter((n) => core.has(n)),
  };
}

/**
 * §"Source/Core agreement" — for a captured calendar record with a
 * *confirmed* solar date (V0.1-recovery match or a manifest date, never
 * an ambiguous lunar-year guess), builds the Calculation Core's own
 * Mệnh-palace facts and diffs them against the parsed calendar-page
 * geometry. Every disagreement is recorded with a `status`; this
 * function never decides unilaterally which side is at fault — that
 * judgment is left to `possible-core-defect` vs `calculation-policy-
 * difference` vs `unresolved` labels for a human to review, except the
 * cheap, unambiguous case of a spelling/casing-only difference
 * (`source-parse-risk`), which normalization already resolves.
 */
export function compareSourceAndCore(
  recordId: string,
  confirmedSolarDate: string,
  hourBranch: string,
  sex: "male" | "female",
  row: HuyenKhiCalendarHourRow,
  school: "nam-phai" | "trung-chau" = "nam-phai",
): SourceCoreAgreementReport {
  const snapshots = buildHuyenKhiChartFactSnapshotsForConfirmedDate(confirmedSolarDate, { hourBranch, gender: sex });
  const snapshot = school === "nam-phai" ? snapshots.namPhai : snapshots.trungChau;
  const menhPalace = snapshot.palaces[snapshot.menhPalaceIndex];
  const thanPalace = snapshot.palaces[snapshot.thanPalaceIndex];

  if (!menhPalace || !thanPalace) {
    throw new Error(`compareSourceAndCore: snapshot missing Mệnh/Thân palace for ${recordId}`);
  }

  const sourceMenh = splitStemBranch(row.menhPalaceStemBranch);
  const geometry = parseMenhGeometry(row);
  const numeric = loadPalaceOverviewKnowledgeV1();
  const majorCatalog = numeric.ok ? new Set(numeric.knowledge.majorStars.stars.map((s) => normalize(s.name))) : new Set<string>();
  // "Tọa thủ" on the source lists every star sitting in the palace, major
  // and minor together — restrict to the same major-star catalog the
  // Calculation Core snapshot uses so this compares major-vs-major, not
  // major-vs-(major+minor).
  const sourceMajorStarNames = geometry.toaThu
    .filter((f) => f.parseStatus === "canonical" && !f.isTransformation && !f.isVoidMarker && f.canonicalName != null)
    .map((f) => f.canonicalName as string)
    .filter((name) => majorCatalog.has(normalize(name)));
  const coreMajorStarNames = menhPalace.majorStars.map((s) => s.canonicalName);

  const majorStars = setAgreement(sourceMajorStarNames, coreMajorStarNames);

  const menhBranchAgrees = sourceMenh != null && normalize(sourceMenh.branch) === normalize(menhPalace.branch);
  const menhStemAgrees =
    sourceMenh != null && menhPalace.stem != null && normalize(sourceMenh.stem) === normalize(menhPalace.stem);
  const cucAgrees = normalize(row.cuc).includes(normalize(snapshot.cuc)) || normalize(snapshot.cuc).includes(normalize(row.cuc));
  const thanCuAgrees = normalize(row.thanCu) === normalize(thanPalace.natalPalaceName);

  const disagreements: SourceCoreAgreementReport["disagreements"] = [];
  if (sourceMenh == null) {
    disagreements.push({
      field: "menhPalaceStemBranch",
      sourceValue: row.menhPalaceStemBranch,
      coreValue: `${menhPalace.stem ?? ""} ${menhPalace.branch}`,
      status: "source-parse-risk",
    });
  } else {
    if (!menhBranchAgrees) {
      disagreements.push({
        field: "menhBranch",
        sourceValue: sourceMenh.branch,
        coreValue: menhPalace.branch,
        status: "unresolved",
      });
    }
    if (!menhStemAgrees) {
      disagreements.push({
        field: "menhStem",
        sourceValue: sourceMenh.stem,
        coreValue: menhPalace.stem,
        status: "unresolved",
      });
    }
  }
  if (!cucAgrees) {
    disagreements.push({ field: "cuc", sourceValue: row.cuc, coreValue: snapshot.cuc, status: "calculation-policy-difference" });
  }
  if (!thanCuAgrees) {
    disagreements.push({ field: "thanCu", sourceValue: row.thanCu, coreValue: thanPalace.natalPalaceName, status: "unresolved" });
  }
  if (majorStars.onlyInSource.length > 0 || majorStars.onlyInCore.length > 0) {
    disagreements.push({
      field: "majorStars",
      sourceValue: sourceMajorStarNames,
      coreValue: coreMajorStarNames,
      status: "possible-core-defect",
    });
  }

  return {
    recordId,
    identityAgreement: { solarDate: true, lunarDate: null, sex: true, hourBranch: hourBranch === row.hourBranch },
    structuralAgreement: {
      menhBranch: menhBranchAgrees,
      menhStem: menhStemAgrees,
      cuc: cucAgrees,
      thanCu: thanCuAgrees,
      majorStars,
    },
    disagreements,
  };
}
