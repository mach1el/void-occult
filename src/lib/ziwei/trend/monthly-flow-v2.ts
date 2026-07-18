/**
 * Experimental monthly scorer — profile nam-phai-monthly-v2.
 * Legacy `monthly-flow.ts` remains default; this path is opt-in only.
 */

import type {
  ChartData,
  ChartEngine,
  ChartPalace,
  MutagenRecord,
} from "@/types/chart";
import { isAnnualStar } from "../star-classification";
import { palaceHasSalvation } from "./combo-eval";
import {
  applyAxisEffects,
  evaluateFramePatterns,
  patternConfidenceAdjust,
  resolveMajorMutagens,
  type FrameRow,
  type MonthRole,
  type TransformHit,
} from "./monthly-patterns";
import {
  loadFramePatternRules,
  loadNamPhaiMonthlyV2Profile,
  type NamPhaiMonthlyV2Profile,
  type ScoreAxis,
} from "./profile/nam-phai-monthly-v2";
import { softSaturate } from "./soft-saturation";
import { computeStarEnergy, routeStarEnergy } from "./star-energy";
import type {
  MonthlyFocusEntry,
  ScoreLayer,
  ScoreLine,
  TrendAxes,
  TrendPoint,
  VoidMajorPalaceInfo,
} from "./types";
import { roundTo1Decimal } from "./ui-breakdown";
import { isMutagenStar, voidBranches } from "./util";
import { TAM_HOP, XUNG_CHIEU } from "./zones";

type MutagenKind = "Lộc" | "Quyền" | "Khoa" | "Kỵ";

const MONTHLY_MUTAGEN_POINTS: Record<MutagenKind, number> = {
  Lộc: 10,
  Quyền: 8,
  Khoa: 6,
  Kỵ: 15,
};

const NGUYET_LOC_TON_POINTS = 10;
const NGUYET_KINH_DA_POINTS = 8;
const KY_TRUNG_KY_BONUS = 25;
const LOC_TRUNG_LOC_BONUS = 25;
const XUNG_THAI_TUE_BONUS = 15;
const KHOA_CHE_NGUYET_KY_FACTOR = 0.4;
const NGUYET_KY_SOURCE = "Lưu nguyệt Hóa Kỵ";

interface LocKyHit {
  layer: "Lưu nguyệt" | "Lưu niên" | "Gốc";
  kind: "Lộc" | "Kỵ";
  palaceIndex: number;
}

interface AxisBuckets {
  benefit: number;
  risk: number;
  activation: number;
  conflict: number;
  stability: number;
}

interface Subtotals {
  major: { benefit: number; risk: number };
  mutagen: { benefit: number; risk: number };
  minor: { benefit: number; risk: number };
  voidChangSheng: { benefit: number; risk: number };
  interactions: { benefit: number; risk: number };
  context: { benefit: number; risk: number };
}

function emptySub(): { benefit: number; risk: number } {
  return { benefit: 0, risk: 0 };
}

function mutagenScoreLayer(
  label: "Lưu nguyệt" | "Lưu niên" | "Gốc" | "Đại vận",
): ScoreLayer {
  if (label === "Lưu nguyệt") return "monthly";
  if (label === "Lưu niên") return "annual";
  if (label === "Đại vận") return "majorFortune";
  return "natal";
}

function mutagenKindOf(mutagen: string): MutagenKind | null {
  if (mutagen.includes("Kỵ")) return "Kỵ";
  if (mutagen.includes("Lộc")) return "Lộc";
  if (mutagen.includes("Quyền")) return "Quyền";
  if (mutagen.includes("Khoa")) return "Khoa";
  return null;
}

function scale(points: number, factor: number): number {
  return roundTo1Decimal(points * factor);
}

function monthSanFangSiZheng(
  chart: ChartData,
  focus: ChartPalace,
  profile: NamPhaiMonthlyV2Profile,
): FrameRow[] {
  const hop = new Set(TAM_HOP[focus.branch] ?? [focus.branch]);
  const xung = XUNG_CHIEU[focus.branch];
  const g = profile.geometry;
  const rows: FrameRow[] = [];
  for (const palace of chart.palaces) {
    if (palace.index === focus.index) {
      rows.push({ palace, role: "focus", weight: g.focus });
    } else if (xung && palace.branch === xung) {
      rows.push({ palace, role: "xung", weight: g.xung });
    } else if (hop.has(palace.branch)) {
      rows.push({ palace, role: "tam-hop", weight: g.tamHop });
    }
  }
  return rows;
}

function roleLabel(role: MonthRole, palace: ChartPalace): string {
  if (role === "focus") return `cung hạn ${palace.name}`;
  if (role === "xung") return `xung chiếu ${palace.name}`;
  return `tam hợp ${palace.name}`;
}

function palaceMeta(role: MonthRole, palace: ChartPalace) {
  return {
    palaceRole: role,
    palaceName: palace.name,
    palaceBranch: palace.branch,
  } as const;
}

function monthlyMutagenRecords(
  chart: ChartData,
  engine: ChartEngine,
  stem: string | undefined,
): MutagenRecord[] {
  if (!stem) return [];
  return engine.tuHoaTargets(stem).map(({ mutagen, starName }) => {
    const palace =
      chart.palaces.find((p) =>
        (p.stars ?? []).some((star) => star.name === starName),
      ) ?? null;
    return { mutagen, starName, palace };
  });
}

function layerWeight(
  profile: NamPhaiMonthlyV2Profile,
  layer: ScoreLayer | undefined,
): number {
  if (layer === "monthly") return profile.layerWeights.monthly;
  if (layer === "annual") return profile.layerWeights.annual;
  if (layer === "majorFortune") return profile.layerWeights.majorFortune;
  return profile.layerWeights.natal;
}

function categoryMult(
  profile: NamPhaiMonthlyV2Profile,
  category: ScoreLine["category"],
): number {
  const m = profile.categoryMultipliers;
  if (category === "major-star") return m.majorStar;
  if (category === "minor-star") return m.minorStar;
  if (category === "mutagen") return m.mutagen;
  if (category === "void") return m.void;
  if (category === "chang-sheng") return m.changSheng;
  if (category === "guardrail") return m.guardrail;
  return 1;
}

function finalizeAxes(
  raw: AxisBuckets,
  profile: NamPhaiMonthlyV2Profile,
  confidence: number,
): TrendAxes {
  const scaleCfg = profile.normalization.scale;
  return {
    raw: { ...raw },
    normalized: {
      benefit: softSaturate(raw.benefit, scaleCfg.benefit),
      risk: softSaturate(raw.risk, scaleCfg.risk),
      activation: softSaturate(raw.activation, scaleCfg.activation),
      conflict: softSaturate(raw.conflict, scaleCfg.conflict),
      stability: Math.round(raw.stability),
      confidence: Math.max(
        profile.confidence.min,
        Math.min(profile.confidence.max, roundTo1Decimal(confidence)),
      ),
    },
  };
}

function capMinorSubtotals(
  sub: Subtotals,
  profile: NamPhaiMonthlyV2Profile,
  catLines: ScoreLine[],
  hungLines: ScoreLine[],
): void {
  const caps = profile.minorStarCaps;
  const coreBenefit = sub.major.benefit + sub.mutagen.benefit;
  const coreRisk = sub.major.risk + sub.mutagen.risk;

  const minorByPalace = new Map<
    string,
    { benefit: number; risk: number; catIdx: number[]; hungIdx: number[] }
  >();
  catLines.forEach((line, idx) => {
    if (line.category !== "minor-star") return;
    const key = line.palaceBranch ?? line.source;
    const bucket = minorByPalace.get(key) ?? {
      benefit: 0,
      risk: 0,
      catIdx: [],
      hungIdx: [],
    };
    bucket.benefit += line.points;
    bucket.catIdx.push(idx);
    minorByPalace.set(key, bucket);
  });
  hungLines.forEach((line, idx) => {
    if (line.category !== "minor-star") return;
    const key = line.palaceBranch ?? line.source;
    const bucket = minorByPalace.get(key) ?? {
      benefit: 0,
      risk: 0,
      catIdx: [],
      hungIdx: [],
    };
    bucket.risk += line.points;
    bucket.hungIdx.push(idx);
    minorByPalace.set(key, bucket);
  });

  for (const bucket of minorByPalace.values()) {
    if (bucket.benefit > caps.perPalaceBenefit && bucket.benefit > 0) {
      const f = caps.perPalaceBenefit / bucket.benefit;
      for (const i of bucket.catIdx) {
        const line = catLines[i]!;
        line.points = scale(line.points, f);
        line.reason += ` · minor-cap palace ×${roundTo1Decimal(f)}`;
      }
    }
    if (bucket.risk > caps.perPalaceRisk && bucket.risk > 0) {
      const f = caps.perPalaceRisk / bucket.risk;
      for (const i of bucket.hungIdx) {
        const line = hungLines[i]!;
        line.points = scale(line.points, f);
        line.reason += ` · minor-cap palace ×${roundTo1Decimal(f)}`;
      }
    }
  }

  sub.minor.benefit = catLines
    .filter((l) => l.category === "minor-star")
    .reduce((s, l) => s + l.points, 0);
  sub.minor.risk = hungLines
    .filter((l) => l.category === "minor-star")
    .reduce((s, l) => s + l.points, 0);

  const maxBenefitShare = coreBenefit * caps.frameBenefitShareOfCore;
  const maxRiskShare = coreRisk * caps.frameRiskShareOfCore;
  if (coreBenefit > 0 && sub.minor.benefit > maxBenefitShare) {
    const f = maxBenefitShare / sub.minor.benefit;
    for (const line of catLines) {
      if (line.category !== "minor-star") continue;
      line.points = scale(line.points, f);
      line.reason += ` · minor-cap frame ×${roundTo1Decimal(f)}`;
    }
    sub.minor.benefit = maxBenefitShare;
  }
  if (coreRisk > 0 && sub.minor.risk > maxRiskShare) {
    const f = maxRiskShare / sub.minor.risk;
    for (const line of hungLines) {
      if (line.category !== "minor-star") continue;
      line.points = scale(line.points, f);
      line.reason += ` · minor-cap frame ×${roundTo1Decimal(f)}`;
    }
    sub.minor.risk = maxRiskShare;
  }
}

export function scoreLuuNguyetFrameV2(
  chart: ChartData,
  engine: ChartEngine,
  monthEntry: MonthlyFocusEntry,
  options?: { mode?: "monthly" | "majorFortune" },
): Pick<
  TrendPoint,
  "cat" | "hung" | "breakdown" | "majorStarContext" | "axes"
> {
  const mode = options?.mode ?? "monthly";
  const profile = loadNamPhaiMonthlyV2Profile();
  const rules = loadFramePatternRules();
  const focus = monthEntry.focusPalace;
  const cat: ScoreLine[] = [];
  const hung: ScoreLine[] = [];
  const voids = voidBranches(chart);
  const frame = monthSanFangSiZheng(chart, focus, profile);
  const frameByIndex = new Map(frame.map((row) => [row.palace.index, row]));
  const hits: LocKyHit[] = [];
  const transformHits: TransformHit[] = [];
  const borrowedKeys = new Set<string>();

  const axes: AxisBuckets = {
    benefit: 0,
    risk: 0,
    activation: 0,
    conflict: 0,
    stability: 0,
  };
  const sub: Subtotals = {
    major: emptySub(),
    mutagen: emptySub(),
    minor: emptySub(),
    voidChangSheng: emptySub(),
    interactions: emptySub(),
    context: emptySub(),
  };

  const linkedBenefitLines: ScoreLine[] = [];
  const linkedRiskLines: ScoreLine[] = [];

  const voidMajorPalaces: VoidMajorPalaceInfo[] = frame
    .filter(
      (row) =>
        !(row.palace.stars ?? []).some((star) => star.layer === "major"),
    )
    .map((row) => ({
      palaceRole: row.role,
      palaceName: row.palace.name,
      palaceBranch: row.palace.branch,
    }));

  const majorFortunePalace = chart.majorFortunePalace ?? null;
  // Chỉ tháng mới xét "tháng trùng cung ĐV" — chấm ĐV thuần không kích hoạt rule tháng.
  const monthlyFocusEqualsActiveMajorFortunePalace = Boolean(
    mode === "monthly" &&
      majorFortunePalace &&
      majorFortunePalace.index === focus.index,
  );
  const majorFrame =
    majorFortunePalace != null
      ? monthSanFangSiZheng(chart, majorFortunePalace, profile)
      : [];
  const focusInsideMajorFortuneFrame = Boolean(
    majorFortunePalace &&
      majorFrame.some((row) => row.palace.index === focus.index),
  );

  const focusHasMajor = (focus.stars ?? []).some(
    (s) => s.layer === "major" && !isAnnualStar(s) && !isMutagenStar(s),
  );
  const xungRow = frame.find((r) => r.role === "xung");
  const oppositeHasMajor = Boolean(
    xungRow &&
      (xungRow.palace.stars ?? []).some(
        (s) => s.layer === "major" && !isAnnualStar(s) && !isMutagenStar(s),
      ),
  );
  const shouldBorrow = !focusHasMajor && oppositeHasMajor;
  const borrowFactor = 0.65;

  for (const { palace, role, weight: wCung } of frame) {
    const where = roleLabel(role, palace);
    const place = palaceMeta(role, palace);
    const isBorrowedXung = shouldBorrow && role === "xung";

    for (const star of palace.stars ?? []) {
      if (isAnnualStar(star)) continue;
      if (isMutagenStar(star)) continue;
      const energy = computeStarEnergy(star);
      if (!energy) continue;
      const routed = routeStarEnergy(energy);
      if (!routed) continue;

      const isMajor = energy.row.tier === 1;
      let weight = wCung;
      if (isBorrowedXung && isMajor) {
        const key = `borrow:${star.name}:${palace.index}`;
        if (borrowedKeys.has(key)) continue;
        borrowedKeys.add(key);
        weight = borrowFactor;
      }

      const lw = layerWeight(profile, "natal");
      const cm = categoryMult(
        profile,
        isMajor ? "major-star" : "minor-star",
      );
      const points = scale(routed.points * lw * cm, weight);
      if (points === 0) continue;

      const brightLabel = energy.bright ?? energy.anchor;
      const line: ScoreLine = {
        source: isBorrowedXung && isMajor ? `Mượn·${star.name}` : star.name,
        points,
        reason:
          isBorrowedXung && isMajor
            ? `${brightLabel} · mượn đối cung ×${borrowFactor} tại ${where}`
            : `${brightLabel} · base tại ${where}`,
        category: isMajor ? "major-star" : "minor-star",
        ...place,
        starTier: energy.row.tier,
        brightness: energy.bright ?? undefined,
        layer: "natal",
      };

      if (routed.layer === "cat") {
        cat.push(line);
        if (isMajor) sub.major.benefit += points;
        else sub.minor.benefit += points;
        if (role === "focus" || monthlyFocusEqualsActiveMajorFortunePalace) {
          linkedBenefitLines.push(line);
        }
      } else {
        hung.push(line);
        if (isMajor) sub.major.risk += points;
        else sub.minor.risk += points;
        if (role === "focus" || monthlyFocusEqualsActiveMajorFortunePalace) {
          linkedRiskLines.push(line);
        }
      }
    }

    if (voids.has(palace.branch)) {
      const types = (chart.voidMarkers ?? [])
        .filter((m) => m.branches.includes(palace.branch))
        .map((m) => m.type);
      for (const type of [...new Set(types)]) {
        const points = scale(
          6 * layerWeight(profile, "natal") * categoryMult(profile, "void"),
          wCung,
        );
        hung.push({
          source: type,
          points,
          reason: `${type} án ngữ ${where} (${palace.branch})`,
          category: "void",
          ...place,
          layer: "natal",
        });
        sub.voidChangSheng.risk += points;
      }
    }

    const cs = palace.changSheng;
    if (cs) {
      let layer: "cat" | "hung" = "cat";
      let pts = 0;
      if (["Tràng Sinh", "Đế Vượng"].includes(cs)) pts = 6;
      else if (["Lâm Quan", "Quan Đới"].includes(cs)) pts = 4;
      else if (["Thai", "Dưỡng"].includes(cs)) pts = 2;
      else if (["Bệnh", "Tử", "Mộ", "Tuyệt"].includes(cs)) {
        layer = "hung";
        pts = 6;
      } else if (["Suy", "Mộc Dục"].includes(cs)) {
        layer = "hung";
        pts = 4;
      }
      if (pts > 0) {
        const points = scale(
          pts *
            layerWeight(profile, "natal") *
            categoryMult(profile, "chang-sheng"),
          wCung,
        );
        const line: ScoreLine = {
          source: `Trường Sinh·${cs}`,
          points,
          reason: `${cs} tại ${where}`,
          category: "chang-sheng",
          ...place,
          layer: "natal",
        };
        if (layer === "cat") {
          cat.push(line);
          sub.voidChangSheng.benefit += points;
        } else {
          hung.push(line);
          sub.voidChangSheng.risk += points;
        }
      }
    }
  }

  const dom = profile.majorStarDominance;
  for (const row of frame) {
    const majors = (row.palace.stars ?? []).filter(
      (s) => s.layer === "major" && !isAnnualStar(s) && !isMutagenStar(s),
    );
    if (!majors.length) continue;
    if (row.role === "focus") {
      axes.activation += dom.focusAnchorActivation;
      if (majors.length >= 2) axes.activation += dom.focusMajorPairActivation;
    } else if (row.role === "xung") {
      axes.activation += dom.xungAnchorActivation;
    } else {
      axes.activation += dom.tamHopAnchorActivation;
    }
  }

  const majorMutagens = resolveMajorMutagens(
    majorFortunePalace,
    chart.majorMutagens,
    (starName) =>
      chart.palaces.find((p) =>
        (p.stars ?? []).some((s) => s.name === starName),
      ) ?? null,
    (stem) => engine.tuHoaTargets(stem),
  );

  const mutagenSources: Array<{
    layer: "Lưu nguyệt" | "Lưu niên" | "Gốc" | "Đại vận";
    records: MutagenRecord[];
  }> = [
    {
      layer: "Lưu nguyệt",
      records:
        mode === "monthly"
          ? monthlyMutagenRecords(chart, engine, monthEntry.calendarStem)
          : [],
    },
    { layer: "Lưu niên", records: chart.annualMutagens ?? [] },
    { layer: "Gốc", records: chart.natalMutagens ?? [] },
    { layer: "Đại vận", records: majorMutagens },
  ];

  for (const { layer, records } of mutagenSources) {
    for (const record of records) {
      const palace = record.palace;
      if (!palace) continue;
      const hit = frameByIndex.get(palace.index);
      if (!hit) continue;

      const kind = mutagenKindOf(record.mutagen);
      if (!kind) continue;

      const scoreLayer = mutagenScoreLayer(layer);
      let roleW = hit.weight;
      if (layer === "Đại vận") {
        const mw = profile.majorFortuneContext.majorMutagenRoleWeight;
        roleW =
          hit.role === "focus"
            ? mw.focus
            : hit.role === "xung"
              ? mw.xung
              : mw.tamHop;
      }

      const points = scale(
        MONTHLY_MUTAGEN_POINTS[kind] *
          layerWeight(profile, scoreLayer) *
          categoryMult(profile, "mutagen"),
        roleW,
      );
      const where = roleLabel(hit.role, palace);
      const line: ScoreLine = {
        source: `${layer} Hóa ${kind}`,
        points,
        reason: `${layer} Hóa ${kind}→${record.starName} tại ${where}`,
        category: "mutagen",
        ...palaceMeta(hit.role, palace),
        layer: scoreLayer,
        transform: kind,
        targetStar: record.starName,
      };

      transformHits.push({
        starName: record.starName,
        kind,
        layer:
          scoreLayer === "majorFortune"
            ? "majorFortune"
            : scoreLayer === "monthly"
              ? "monthly"
              : scoreLayer === "annual"
                ? "annual"
                : "natal",
        palaceIndex: palace.index,
      });

      if (kind === "Kỵ") {
        hung.push(line);
        sub.mutagen.risk += points;
        if (hit.role === "focus") linkedRiskLines.push(line);
      } else {
        cat.push(line);
        sub.mutagen.benefit += points;
        if (hit.role === "focus") linkedBenefitLines.push(line);
      }

      if ((kind === "Lộc" || kind === "Kỵ") && layer !== "Đại vận") {
        hits.push({
          layer: layer as LocKyHit["layer"],
          kind,
          palaceIndex: palace.index,
        });
      }
    }
  }

  if (mode === "monthly" && monthEntry.calendarStem) {
    const locIndex = engine.locTonIndex(monthEntry.calendarStem);
    const kinhIndex = (locIndex + 1 + 12) % 12;
    const daIndex = (locIndex - 1 + 12) % 12;

    const locHit = frameByIndex.get(locIndex);
    if (locHit) {
      const points = scale(
        NGUYET_LOC_TON_POINTS *
          layerWeight(profile, "monthly") *
          categoryMult(profile, "minor-star"),
        locHit.weight,
      );
      cat.push({
        source: "Nguyệt Lộc Tồn",
        points,
        reason: `Nguyệt Lộc Tồn tại ${roleLabel(locHit.role, locHit.palace)}`,
        category: "minor-star",
        ...palaceMeta(locHit.role, locHit.palace),
        layer: "monthly",
      });
      sub.minor.benefit += points;
      hits.push({
        layer: "Lưu nguyệt",
        kind: "Lộc",
        palaceIndex: locHit.palace.index,
      });
    }
    const kinhHit = frameByIndex.get(kinhIndex);
    if (kinhHit) {
      const points = scale(
        NGUYET_KINH_DA_POINTS *
          layerWeight(profile, "monthly") *
          categoryMult(profile, "minor-star"),
        kinhHit.weight,
      );
      hung.push({
        source: "Nguyệt Kình Dương",
        points,
        reason: `Nguyệt Kình Dương tại ${roleLabel(kinhHit.role, kinhHit.palace)}`,
        category: "minor-star",
        ...palaceMeta(kinhHit.role, kinhHit.palace),
        layer: "monthly",
      });
      sub.minor.risk += points;
    }
    const daHit = frameByIndex.get(daIndex);
    if (daHit) {
      const points = scale(
        NGUYET_KINH_DA_POINTS *
          layerWeight(profile, "monthly") *
          categoryMult(profile, "minor-star"),
        daHit.weight,
      );
      hung.push({
        source: "Nguyệt Đà La",
        points,
        reason: `Nguyệt Đà La tại ${roleLabel(daHit.role, daHit.palace)}`,
        category: "minor-star",
        ...palaceMeta(daHit.role, daHit.palace),
        layer: "monthly",
      });
      sub.minor.risk += points;
    }
  }

  for (const { palace } of frame) {
    for (const star of palace.stars ?? []) {
      if (star.name === "Lưu Lộc Tồn" && isAnnualStar(star)) {
        hits.push({
          layer: "Lưu niên",
          kind: "Lộc",
          palaceIndex: palace.index,
        });
      } else if (star.name === "Lộc Tồn" && !isAnnualStar(star)) {
        hits.push({ layer: "Gốc", kind: "Lộc", palaceIndex: palace.index });
      }
    }
  }

  const hasKhoaChe = frame.some((row) => palaceHasSalvation(row.palace, true));
  if (hasKhoaChe) {
    for (const line of hung) {
      if (line.source === NGUYET_KY_SOURCE) {
        const reduced = roundTo1Decimal(
          line.points * KHOA_CHE_NGUYET_KY_FACTOR,
        );
        line.reason += ` · Khoa Chế Nguyệt Kỵ ×${KHOA_CHE_NGUYET_KY_FACTOR} (${line.points}→${reduced})`;
        const delta = line.points - reduced;
        line.points = reduced;
        sub.mutagen.risk -= delta;
      }
    }
  }

  const nguyetKy = hits.filter(
    (h) => h.layer === "Lưu nguyệt" && h.kind === "Kỵ",
  );
  const otherKy = hits.filter(
    (h) => h.layer !== "Lưu nguyệt" && h.kind === "Kỵ",
  );
  const kyTrungKy = nguyetKy.some((n) =>
    otherKy.some((o) => o.palaceIndex === n.palaceIndex),
  );
  const nguyetLoc = hits.filter(
    (h) => h.layer === "Lưu nguyệt" && h.kind === "Lộc",
  );
  const otherLoc = hits.filter(
    (h) => h.layer !== "Lưu nguyệt" && h.kind === "Lộc",
  );
  const locTrungLoc = nguyetLoc.some((n) =>
    otherLoc.some((o) => o.palaceIndex === n.palaceIndex),
  );

  const guardrailMeta = {
    category: "guardrail" as const,
    layer: "technical" as const,
  };

  if (kyTrungKy) {
    hung.push({
      source: "Kỵ Trùng Kỵ",
      points: KY_TRUNG_KY_BONUS,
      reason:
        "Nguyệt Hóa Kỵ ngộ Lưu Kỵ năm/Kỵ gốc cùng cung — báo động đỏ (không nhân cột)",
      ...guardrailMeta,
    });
    sub.interactions.risk += KY_TRUNG_KY_BONUS;
  }
  if (locTrungLoc) {
    cat.push({
      source: "Lộc Trùng Lộc",
      points: LOC_TRUNG_LOC_BONUS,
      reason:
        "Nguyệt Lộc ngộ Lưu Lộc năm/Lộc gốc cùng cung — cơ hội (không nhân cột)",
      ...guardrailMeta,
    });
    sub.interactions.benefit += LOC_TRUNG_LOC_BONUS;
  }
  if (
    mode === "monthly" &&
    monthEntry.calendarBranch &&
    chart.annualBranch &&
    XUNG_CHIEU[monthEntry.calendarBranch] === chart.annualBranch
  ) {
    hung.push({
      source: "Xung Thái Tuế",
      points: XUNG_THAI_TUE_BONUS,
      reason: `Chi tháng ${monthEntry.calendarBranch} xung chi năm ${chart.annualBranch} — tháng động`,
      ...guardrailMeta,
    });
    sub.interactions.risk += XUNG_THAI_TUE_BONUS;
  }

  capMinorSubtotals(sub, profile, cat, hung);

  const patternHits = evaluateFramePatterns(rules, {
    frame,
    focus,
    transformHits,
    monthlyFocusEqualsActiveMajorFortunePalace,
  });

  const addAxis = (
    axis: ScoreAxis,
    delta: number,
    source: string,
    reason: string,
  ) => {
    axes[axis] += delta;
    if (axis === "benefit") {
      cat.push({
        source,
        points: delta,
        reason,
        category: "other",
        layer: "technical",
      });
      sub.interactions.benefit += delta;
    } else if (axis === "risk") {
      hung.push({
        source,
        points: delta,
        reason,
        category: "other",
        layer: "technical",
      });
      sub.interactions.risk += delta;
    }
  };

  const ops = applyAxisEffects(patternHits, addAxis);

  if (shouldBorrow && !ops.borrowOppositeMajors) {
    axes.activation += 5;
    axes.stability -= 8;
  }

  const ctx = profile.majorFortuneContext;
  const monthReactivatesHit = patternHits.some(
    (h) => h.ruleId === "MONTH_REACTIVATES_MAJOR_FORTUNE_PALACE",
  );
  // Pattern MONTH_REACTIVATES đã gồm activation + linked factors — không cộng
  // lại cùng số từ profile.sameFocusPalace.
  if (monthlyFocusEqualsActiveMajorFortunePalace && !monthReactivatesHit) {
    axes.activation += ctx.sameFocusPalace.activationDelta;
    const bFactor = ctx.sameFocusPalace.benefitFactor;
    const rFactor = ctx.sameFocusPalace.riskFactor;
    const linkedB = linkedBenefitLines.reduce((s, l) => s + l.points, 0);
    const linkedR = linkedRiskLines.reduce((s, l) => s + l.points, 0);
    const bDelta = roundTo1Decimal(linkedB * (bFactor - 1));
    const rDelta = roundTo1Decimal(linkedR * (rFactor - 1));
    if (bDelta !== 0) {
      cat.push({
        source: "ĐV·cùng cung",
        points: bDelta,
        reason: `Cộng hưởng ĐV cùng cung hạn ×${bFactor} (linked)`,
        category: "other",
        layer: "technical",
      });
      sub.context.benefit += bDelta;
    }
    if (rDelta !== 0) {
      hung.push({
        source: "ĐV·cùng cung",
        points: rDelta,
        reason: `Cộng hưởng ĐV cùng cung hạn ×${rFactor} (linked)`,
        category: "other",
        layer: "technical",
      });
      sub.context.risk += rDelta;
    }
  } else if (monthlyFocusEqualsActiveMajorFortunePalace && monthReactivatesHit) {
    const linkedB = linkedBenefitLines.reduce((s, l) => s + l.points, 0);
    const linkedR = linkedRiskLines.reduce((s, l) => s + l.points, 0);
    const bDelta = roundTo1Decimal(linkedB * (ops.linkedBenefitFactor - 1));
    const rDelta = roundTo1Decimal(linkedR * (ops.linkedRiskFactor - 1));
    if (bDelta !== 0) {
      cat.push({
        source: "MONTH_REACTIVATES_MAJOR_FORTUNE_PALACE",
        points: bDelta,
        reason: `Linked benefit ×${ops.linkedBenefitFactor}`,
        category: "other",
        layer: "technical",
      });
      sub.context.benefit += bDelta;
    }
    if (rDelta !== 0) {
      hung.push({
        source: "MONTH_REACTIVATES_MAJOR_FORTUNE_PALACE",
        points: rDelta,
        reason: `Linked risk ×${ops.linkedRiskFactor}`,
        category: "other",
        layer: "technical",
      });
      sub.context.risk += rDelta;
    }
  } else if (focusInsideMajorFortuneFrame) {
    axes.activation += ctx.focusInsideMajorFortuneFrame.activationDelta;
    const bFactor = ctx.focusInsideMajorFortuneFrame.benefitFactor;
    const rFactor = ctx.focusInsideMajorFortuneFrame.riskFactor;
    const linkedB = linkedBenefitLines.reduce((s, l) => s + l.points, 0);
    const linkedR = linkedRiskLines.reduce((s, l) => s + l.points, 0);
    const bDelta = roundTo1Decimal(linkedB * (bFactor - 1));
    const rDelta = roundTo1Decimal(linkedR * (rFactor - 1));
    if (bDelta !== 0) {
      cat.push({
        source: "ĐV·trong khung",
        points: bDelta,
        reason: `Cộng hưởng ĐV trong TP4C ×${bFactor} (linked)`,
        category: "other",
        layer: "technical",
      });
      sub.context.benefit += bDelta;
    }
    if (rDelta !== 0) {
      hung.push({
        source: "ĐV·trong khung",
        points: rDelta,
        reason: `Cộng hưởng ĐV trong TP4C ×${rFactor} (linked)`,
        category: "other",
        layer: "technical",
      });
      sub.context.risk += rDelta;
    }
  }

  axes.benefit = roundTo1Decimal(
    cat.reduce((s, l) => s + Math.max(0, l.points), 0),
  );
  axes.risk = roundTo1Decimal(
    hung.reduce((s, l) => s + Math.max(0, l.points), 0),
  );

  const confidence =
    profile.confidence.base + patternConfidenceAdjust(patternHits, profile);
  const trendAxes = finalizeAxes(axes, profile, confidence);

  return {
    cat: trendAxes.normalized.benefit,
    hung: trendAxes.normalized.risk,
    axes: trendAxes,
    breakdown: { cat, hung },
    majorStarContext: { voidMajorPalaces },
  };
}

/** Đại vận experimental — multi-axis trên cung ĐV, không điểm tháng. */
export function scoreFortuneFrameV2(
  chart: ChartData,
  engine: ChartEngine,
  focus: ChartPalace,
): Pick<TrendPoint, "cat" | "hung" | "breakdown" | "axes"> {
  const synthetic: MonthlyFocusEntry = {
    month: 0,
    focusPalace: focus,
    calendarStem: "",
    calendarBranch: "",
  };
  const scored = scoreLuuNguyetFrameV2(chart, engine, synthetic, {
    mode: "majorFortune",
  });
  return {
    cat: scored.cat,
    hung: scored.hung,
    axes: scored.axes,
    breakdown: scored.breakdown,
  };
}
