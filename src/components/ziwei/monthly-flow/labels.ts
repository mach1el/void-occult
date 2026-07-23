import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";
import type {
  MonthlyFlowBand,
  MonthlyFlowEvidence,
} from "@/lib/ziwei/analysis/modules/monthly-flow/types";
import {
  MONTHLY_FLOW_VISIBLE_DOMAINS,
  type MonthlyFlowVisibleDomain,
} from "@/lib/ziwei/analysis/modules/monthly-flow/v0.1-production/display-projection";

/** Production UI domain order — excludes health (no prognosis surface). */
export const DOMAIN_ORDER: readonly MonthlyFlowVisibleDomain[] = MONTHLY_FLOW_VISIBLE_DOMAINS;

/** @deprecated Prefer DOMAIN_ORDER — kept alias for clarity in charts. */
export const VISIBLE_DOMAIN_ORDER = DOMAIN_ORDER;

export const DOMAIN_LABEL_VI: Record<MonthlyFlowVisibleDomain, string> = {
  family: "Gia đạo",
  wealth: "Tài lộc",
  career: "Công việc",
  social: "Giao hữu",
  romance: "Tình duyên",
};

/** Full label map including health — must not be used in production UI rendering. */
export const DOMAIN_LABEL_VI_ALL: Record<AnnualAxisDomain, string> = {
  health: "Sức khỏe",
  family: "Gia đạo",
  wealth: "Tài lộc",
  career: "Công việc",
  social: "Giao hữu",
  romance: "Tình duyên",
};

export const BAND_LABEL_VI: Record<MonthlyFlowBand, string> = {
  guarded: "Cần thận trọng",
  balanced: "Cân bằng",
  supportive: "Thuận lợi",
  strong: "Rất thuận",
};

const STRUCTURAL_MARKER_LABEL_VI: Record<string, string> = {
  "monthly-focus-palace": "Cung trọng tâm tháng",
  "monthly-opposite-palace": "Đối cung tháng",
  "monthly-trine-palace": "Tam hợp tháng",
};

export function formatMonthShortLabel(lunarMonth: number, isLeapMonth: boolean): string {
  return isLeapMonth ? `Th.${lunarMonth} nhuận` : `Th.${lunarMonth}`;
}

export function formatMonthViewLabel(lunarMonth: number, isLeapMonth: boolean): string {
  return isLeapMonth
    ? `Tháng ${lunarMonth} nhuận âm lịch`
    : `Tháng ${lunarMonth} âm lịch`;
}

/** Display-only evidence label — star/name only, no rule or source IDs. */
export function evidenceDisplayLabel(evidence: MonthlyFlowEvidence): string {
  const { physicalFactId, targetNatalPalaceName } = evidence;

  if (physicalFactId.startsWith("star:")) {
    const starName = physicalFactId.split(":").slice(2).join(":");
    return `${starName} · ${targetNatalPalaceName}`;
  }

  if (physicalFactId.startsWith("monthly-transformation:")) {
    const parts = physicalFactId.split(":");
    const mutagen = parts[2] ?? "";
    const starName = parts.slice(3).join(":");
    return `Tứ Hóa ${mutagen} → ${starName} · ${targetNatalPalaceName}`;
  }

  if (physicalFactId.startsWith("major-transformation-context:")) {
    const parts = physicalFactId.split(":");
    const mutagen = parts[2] ?? "";
    const starName = parts.slice(3).join(":");
    return `Tứ Hóa Đại vận ${mutagen} → ${starName} · ${targetNatalPalaceName}`;
  }

  if (physicalFactId.startsWith("major-active-palace:")) {
    return `Cung Đại vận hoạt động · ${targetNatalPalaceName}`;
  }

  if (physicalFactId.startsWith("annual-star:")) {
    const starName = physicalFactId.split(":").slice(2).join(":");
    return `${starName} · ${targetNatalPalaceName}`;
  }

  if (physicalFactId.startsWith("structural:")) {
    const markerId = physicalFactId.slice("structural:".length);
    return STRUCTURAL_MARKER_LABEL_VI[markerId] ?? `Cấu trúc · ${targetNatalPalaceName}`;
  }

  return targetNatalPalaceName || "Tín hiệu đã ghi nhận";
}

export const PRODUCTION_DISCLAIMER_VI =
  "Các chỉ số chỉ mô tả tín hiệu cấu trúc được ghi nhận trong mô hình, không phải dự báo chắc chắn và không dùng để chẩn đoán hoặc tiên lượng sức khỏe.";
