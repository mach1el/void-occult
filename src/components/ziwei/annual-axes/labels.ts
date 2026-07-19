import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";
import type {
  AnnualAxisBand,
} from "@/lib/ziwei/analysis/modules/annual-axes";

/** Domain order that the radar/cards use — matches the contract order.
 * Tests import this constant so it must be a stable, exported value. */
export const ANNUAL_AXIS_DOMAIN_ORDER: readonly AnnualAxisDomain[] = [
  "health",
  "family",
  "wealth",
  "career",
  "social",
  "romance",
] as const;

/** Vietnamese labels for the six annual axes — mirrors
 * `annual-axis-definitions.v0.json#domains[].labelVi` but is used by the
 * UI at render time so the labels stay stable if the JSON is ever
 * reshuffled. */
export const ANNUAL_AXIS_LABEL_VI: Record<AnnualAxisDomain, string> = {
  health: "Sức khỏe",
  family: "Gia đạo",
  wealth: "Tài lộc",
  career: "Công việc",
  social: "Giao hữu",
  romance: "Tình duyên",
};

export const ANNUAL_AXIS_BAND_LABEL_VI: Record<AnnualAxisBand, string> = {
  guarded: "Cẩn trọng",
  balanced: "Cân bằng",
  supportive: "Thuận lợi",
  strong: "Mạnh",
};

export const ANNUAL_FOCUS_MODE_LABEL_VI: Record<
  "annual-major-fortune" | "annual-menh" | "small-limit",
  string
> = {
  "annual-major-fortune": "Lưu Tiểu Hạn",
  "annual-menh": "Cung Mệnh lưu niên",
  "small-limit": "Tiểu Hạn Tam Hợp",
};
