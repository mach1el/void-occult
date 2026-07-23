import type { MonthlyFlowMonthSummary } from "@/lib/ziwei/analysis/modules/monthly-flow/v0.1-production";
import type { MonthlyFlowAxisResult } from "@/lib/ziwei/analysis/modules/monthly-flow/types";
import {
  BAND_LABEL_VI,
  DOMAIN_LABEL_VI,
  DOMAIN_ORDER,
  evidenceDisplayLabel,
} from "./labels";

export interface MonthlyFlowSixAxisChartProps {
  selectedMonth: MonthlyFlowMonthSummary;
}

function axisStateLabel(axis: MonthlyFlowAxisResult): string {
  if (axis.status === "unavailable") return "Không khả dụng";
  return "Đã ghi nhận";
}

function driverLabels(
  axis: MonthlyFlowAxisResult & { status: "available" },
  kind: "support" | "pressure",
): string {
  const drivers =
    kind === "support" ? axis.topSupportDrivers : axis.topPressureDrivers;
  if (drivers.length === 0) return "—";
  return drivers.map((d) => evidenceDisplayLabel(d)).join(" · ");
}

/**
 * Visible-domain horizontal bars for the selected lunar month.
 * Excludes health. Values come from monthly-flow axis scores only.
 */
export function MonthlyFlowSixAxisChart({ selectedMonth }: MonthlyFlowSixAxisChartProps) {
  const axes = selectedMonth.result.axes;

  return (
    <div
      className="mf-flow-six-axis"
      role="list"
      aria-label={`Năm trục hiển thị tháng ${selectedMonth.lunarMonth}`}
      data-testid="mf-flow-six-axis"
    >
      {DOMAIN_ORDER.map((domain) => {
        const axis = axes[domain];
        const score =
          axis.status === "available" && axis.score != null
            ? axis.score
            : null;
        const pct = score == null ? 0 : Math.max(0, Math.min(100, score));

        return (
          <article
            key={domain}
            className="mf-flow-six-axis__row"
            data-domain={domain}
            data-status={axis.status}
            role="listitem"
          >
            <div className="mf-flow-six-axis__head">
              <h4 className="mf-flow-six-axis__label">{DOMAIN_LABEL_VI[domain]}</h4>
              <span className="mf-flow-six-axis__score">
                {score == null ? "—" : score.toFixed(1)}
              </span>
            </div>

            <div
              className="mf-flow-six-axis__track"
              aria-hidden="true"
              data-testid={`mf-flow-axis-track-${domain}`}
            >
              <div
                className={[
                  "mf-flow-six-axis__fill",
                  axis.status === "unavailable" ? "is-unavailable" : "",
                  axis.status === "available" && selectedMonth.status === "partial"
                    ? "is-partial"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mf-flow-six-axis__meta">
              <span className="mf-flow-six-axis__band">
                {axis.status === "available" && axis.band
                  ? BAND_LABEL_VI[axis.band]
                  : "—"}
              </span>
              <span className="mf-flow-six-axis__state">{axisStateLabel(axis)}</span>
              {axis.status === "available" ? (
                <span className="mf-flow-six-axis__evidence-count">
                  {axis.evidence.length} bằng chứng
                </span>
              ) : null}
            </div>

            {axis.status === "available" ? (
              <div className="mf-flow-six-axis__drivers">
                <p className="mf-flow-six-axis__driver">
                  <span className="mf-flow-six-axis__driver-kind">Tín hiệu hỗ trợ:</span>{" "}
                  {driverLabels(axis, "support")}
                </p>
                <p className="mf-flow-six-axis__driver">
                  <span className="mf-flow-six-axis__driver-kind">Tín hiệu áp lực:</span>{" "}
                  {driverLabels(axis, "pressure")}
                </p>
                <p className="mf-flow-six-axis__driver">
                  <span className="mf-flow-six-axis__driver-kind">Mức kích hoạt:</span>{" "}
                  {axis.normalizedAxes.activation.toFixed(2)}
                </p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
