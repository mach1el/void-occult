import { useEffect, useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  analyzeMonthlyFlowProduction,
  projectVisibleMonthSummary,
  resolveDefaultSelectedMonthKey,
  type MonthlyFlowProductionAnalysis,
} from "@/lib/ziwei/analysis/modules/monthly-flow/v0.1-production";
import { MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT } from "@/lib/ziwei/analysis/modules/monthly-flow/v0.1-production/display-projection";
import { MonthlyFlowTimelineChart } from "./MonthlyFlowTimelineChart";
import { MonthlyFlowSixAxisChart } from "./MonthlyFlowSixAxisChart";
import {
  DOMAIN_LABEL_VI,
  DOMAIN_ORDER,
  evidenceDisplayLabel,
  formatMonthViewLabel,
  PRODUCTION_DISCLAIMER_VI,
} from "./labels";
import "./monthly-flow.css";

export interface MonthlyFlowSectionProps {
  chart: ChartData;
  school: School;
  /** Optional precomputed analysis for tests. */
  analysis?: MonthlyFlowProductionAnalysis;
  /** Injected clock for deterministic current-month selection in tests. */
  now?: Date;
}

function monthStateLabel(status: "available" | "partial" | "unavailable"): string {
  if (status === "unavailable") return "Không khả dụng";
  if (status === "partial") return "Thiếu dữ liệu";
  return "Đã đánh giá";
}

/**
 * Production Monthly Flow V0.1 section — timeline + visible-domain detail.
 * Health is never rendered (presentation policy).
 */
export function MonthlyFlowSection({
  chart,
  school,
  analysis: analysisProp,
  now = new Date(),
}: MonthlyFlowSectionProps) {
  const analysis = useMemo(
    () => analysisProp ?? analyzeMonthlyFlowProduction(chart, { school }),
    [analysisProp, chart, school],
  );

  const currentMonthKey = useMemo(() => {
    if (now.getFullYear() !== analysis.annualYear) return null;
    return resolveDefaultSelectedMonthKey({
      annualYear: analysis.annualYear,
      school,
      monthSummaries: analysis.monthSummaries,
      now,
    });
  }, [analysis.annualYear, analysis.monthSummaries, now, school]);

  const defaultMonthKey = useMemo(
    () =>
      resolveDefaultSelectedMonthKey({
        annualYear: analysis.annualYear,
        school,
        monthSummaries: analysis.monthSummaries,
        now,
      }),
    [analysis.annualYear, analysis.monthSummaries, now, school],
  );

  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(defaultMonthKey);

  useEffect(() => {
    setSelectedMonthKey(defaultMonthKey);
  }, [defaultMonthKey, chart, school]);

  const selectedMonth =
    analysis.monthSummaries.find((m) => m.monthKey === selectedMonthKey) ??
    analysis.monthSummaries.find((m) => m.monthKey === currentMonthKey) ??
    analysis.monthSummaries[0] ??
    null;

  const selectedVisible = selectedMonth
    ? projectVisibleMonthSummary(selectedMonth)
    : null;

  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const viewingOther =
    selectedMonthKey != null &&
    currentMonthKey != null &&
    selectedMonthKey !== currentMonthKey;

  const schoolLabel = school === "nam-phai" ? "Nam Phái" : "Trung Châu";
  const compositeText =
    selectedVisible?.visibleCompositeScore == null
      ? "—"
      : selectedVisible.visibleCompositeScore.toFixed(1);
  const coverageText = selectedVisible
    ? `${selectedVisible.visibleAxisCount}/${MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT} trục`
    : "—";

  return (
    <section
      className="mf-flow"
      data-module="monthly-flow"
      data-version="0.1.2"
      data-status={analysis.status}
      aria-label="Lưu Nguyệt V0.1"
    >
      <header className="mf-flow__head">
        <div className="mf-flow__head-main">
          <h3 className="mf-flow__title">Lưu Nguyệt</h3>
          <span className="mf-flow__badge">V0.1</span>
          <span className="mf-flow__school-chip">{schoolLabel}</span>
          <span className="mf-flow__year">Năm {analysis.annualYear}</span>
        </div>
        {viewingOther && selectedMonth ? (
          <div className="mf-flow__viewing" role="status">
            <span>
              Đang xem: {formatMonthViewLabel(selectedMonth.lunarMonth, selectedMonth.isLeapMonth)}
            </span>
            <button
              type="button"
              className="mf-flow__back-current"
              onClick={() => {
                if (currentMonthKey) setSelectedMonthKey(currentMonthKey);
              }}
            >
              Về tháng hiện tại
            </button>
          </div>
        ) : null}
      </header>

      {analysis.monthSummaries.length === 0 ? (
        <p className="mf-flow__unavailable" role="status">
          Không có tháng Lưu Nguyệt hợp lệ để đánh giá.
        </p>
      ) : (
        <>
          <MonthlyFlowTimelineChart
            summaries={analysis.monthSummaries}
            selectedMonthKey={selectedMonthKey}
            currentMonthKey={currentMonthKey}
            onSelectMonthKey={setSelectedMonthKey}
          />

          {selectedMonth && selectedVisible ? (
            <>
              <div className="mf-flow__selection" aria-label="Tóm tắt tháng">
                <div className="mf-flow__score-block">
                  <span className="mf-flow__score-label">Điểm tổng hợp 5 trục hiển thị</span>
                  <span className="mf-flow__score-value">{compositeText}</span>
                </div>
                <div className="mf-flow__meta-row">
                  <span className="mf-flow__meta-item">
                    {formatMonthViewLabel(selectedMonth.lunarMonth, selectedMonth.isLeapMonth)}
                  </span>
                  <span className="mf-flow__meta-item">Độ phủ {coverageText}</span>
                  <span className="mf-flow__meta-item">
                    {monthStateLabel(selectedVisible.status)}
                  </span>
                  {selectedVisible.visibleStrongestDomain ? (
                    <span className="mf-flow__meta-item">
                      Mạnh: {DOMAIN_LABEL_VI[selectedVisible.visibleStrongestDomain]}
                    </span>
                  ) : null}
                  {selectedVisible.visibleWeakestDomain ? (
                    <span className="mf-flow__meta-item">
                      Thấp: {DOMAIN_LABEL_VI[selectedVisible.visibleWeakestDomain]}
                    </span>
                  ) : null}
                </div>
              </div>

              <MonthlyFlowSixAxisChart selectedMonth={selectedMonth} />

              <details
                className="mf-flow__details"
                open={evidenceOpen}
                onToggle={(e) => setEvidenceOpen((e.target as HTMLDetailsElement).open)}
                data-testid="mf-flow-evidence-details"
              >
                <summary>Bằng chứng được ghi nhận</summary>
                <div className="mf-flow__evidence-grid">
                  {DOMAIN_ORDER.map((domain) => {
                    const axis = selectedMonth.result.axes[domain];
                    if (axis.status !== "available") {
                      return (
                        <section key={domain} className="mf-flow__evidence-domain">
                          <h5>{DOMAIN_LABEL_VI[domain]}</h5>
                          <p>Không khả dụng</p>
                        </section>
                      );
                    }

                    const supportLabels = axis.topSupportDrivers.map((d) =>
                      evidenceDisplayLabel(d),
                    );
                    const pressureLabels = axis.topPressureDrivers.map((d) =>
                      evidenceDisplayLabel(d),
                    );

                    return (
                      <section key={domain} className="mf-flow__evidence-domain">
                        <h5>{DOMAIN_LABEL_VI[domain]}</h5>
                        <p>
                          <strong>Tín hiệu hỗ trợ:</strong>{" "}
                          {supportLabels.length > 0 ? supportLabels.join(" · ") : "—"}
                        </p>
                        <p>
                          <strong>Tín hiệu áp lực:</strong>{" "}
                          {pressureLabels.length > 0 ? pressureLabels.join(" · ") : "—"}
                        </p>
                        <p>
                          <strong>Mức kích hoạt:</strong>{" "}
                          {axis.normalizedAxes.activation.toFixed(2)}
                        </p>
                        <p>
                          <strong>Bằng chứng được ghi nhận:</strong> {axis.evidence.length}
                        </p>
                      </section>
                    );
                  })}
                </div>
              </details>
            </>
          ) : null}
        </>
      )}

      <p className="mf-flow__disclaimer">{PRODUCTION_DISCLAIMER_VI}</p>
    </section>
  );
}
