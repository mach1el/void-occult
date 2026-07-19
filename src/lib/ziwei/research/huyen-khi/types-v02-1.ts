/**
 * V0.2.1 — two explicitly separate corpora. Never merge their targets
 * into one training table (enforced by `output-scope-isolation.test.ts`).
 */
export type HuyenKhiOutputScope = "menh-and-total" | "full-palace";

export type HuyenKhiCorpusTier =
  | "calendar-panel" // Tier 1 — menh-and-total scope, never counts toward the 60 full-palace target
  | "recovered-full-palace" // Tier 2 — V0.1 twelve-palace values + recovered date
  | "human-gold-full-palace"; // Tier 3 — rendered detail + real human double-entry

export type RelationName = "toa-thu" | "xung-chieu" | "tam-hop-1" | "tam-hop-2" | "nhi-hop-1" | "nhi-hop-2";

export type Brightness = "M" | "V" | "Đ" | "B" | "H" | null;

export interface ParsedStarFact {
  rawLabel: string;
  canonicalName: string | null;
  brightness: Brightness;
  relation: RelationName;
  isTransformation: boolean;
  isVoidMarker: boolean;
  parseStatus: "canonical" | "known-context-only" | "unknown";
}

/** Does not flatten the four relation groups. */
export interface ParsedMenhGeometry {
  toaThu: ParsedStarFact[];
  xungChieu: ParsedStarFact[];
  tamHop: [ParsedStarFact[], ParsedStarFact[]];
  nhiHop: [ParsedStarFact[], ParsedStarFact[]];
}

export interface HuyenKhiCalendarHourRow {
  hourBranch: string;
  menhHuyenKhi: number;
  wholeChartTotal: number;
  cuc: string;
  thanCu: string;
  menhPalaceStemBranch: string;
  toaThu: string[];
  xungChieu: string[];
  tamHop1: string[];
  tamHop2: string[];
  nhiHop1: string[];
  nhiHop2: string[];
}

export interface HuyenKhiCalendarMenhPanel {
  solarDate: string;
  calendarPageUrl: string;
  sex: "male" | "female";
  lunarDate: { yearStemBranch: string | null; month: number; day: number; isLeapMonth: boolean | null };
  capturedAt: string;
  captureMethod: "approved-limited-fetch" | "manual-browser-capture";
  hours: HuyenKhiCalendarHourRow[];
}

export interface HuyenKhiCalendarMenhRecord {
  recordId: string;
  outputScope: "menh-and-total";
  metricNamespace: "huyen-khi";
  source: {
    calendarPageUrl: string;
    absoluteSolarDate: string;
    captureMethod: "approved-limited-fetch" | "manual-browser-capture";
    capturedAt: string;
  };
  identity: {
    sex: "male" | "female";
    hourBranch: string;
    sourceLunarDate: { yearStemBranch: string | null; absoluteYear: number | null; month: number; day: number; isLeapMonth: boolean | null };
  };
  displayed: { menhHuyenKhi: number; wholeChartTotal: number };
  menhContext: {
    thanCu: string;
    menhPalaceStemBranch: string;
    cuc: string;
    toaThu: string[];
    xungChieu: string[];
    tamHopGroups: [string[], string[]];
    nhiHopGroups: [string[], string[]];
  };
}

export interface LunarDateValue {
  year: number | null;
  month: number;
  day: number;
  isLeapMonth: boolean | null;
}

export type LunarDateAdjudicationOutcome =
  | "all-agree"
  | "source-and-majority-agree"
  | "core-and-majority-agree"
  | "public-sources-disagree"
  | "unresolved";

export type LunarDateFactor =
  | "timezone"
  | "new-moon-boundary"
  | "leap-month-policy"
  | "ephemeris-version"
  | "source-data-error"
  | "unknown";

export interface LunarDateAdjudication {
  solarDate: string;
  sourceCalendar: LunarDateValue;
  calculationCore: LunarDateValue;
  independentReferences: Array<{ sourceId: string; value: LunarDateValue; methodology?: string }>;
  outcome: LunarDateAdjudicationOutcome;
  possibleFactors: LunarDateFactor[];
}

export interface SetAgreement {
  onlyInSource: string[];
  onlyInCore: string[];
  inBoth: string[];
}

export interface SourceCoreAgreementReport {
  recordId: string;
  identityAgreement: { solarDate: boolean; lunarDate: boolean | null; sex: boolean; hourBranch: boolean };
  structuralAgreement: {
    menhBranch: boolean;
    menhStem: boolean;
    cuc: boolean;
    thanCu: boolean;
    majorStars: SetAgreement;
  };
  disagreements: Array<{
    field: string;
    sourceValue: unknown;
    coreValue: unknown;
    status: "source-parse-risk" | "calculation-policy-difference" | "possible-core-defect" | "unresolved";
  }>;
}

export interface HuyenKhiCalendarPanelReport {
  solarDate: string;
  sex: "male" | "female";
  complete: boolean;
  invariantFacts: string[];
  changedFacts: string[];
  missingHours: string[];
  duplicateHours: string[];
}
