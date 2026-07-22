import { useEffect, useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";
import {
  analyzeAnnualAxes,
  type AnnualAxesResult,
  type AnnualAxisResult,
} from "@/lib/ziwei/analysis/modules/annual-axes";
import { AnnualAxesRadar } from "./AnnualAxesRadar";
import { AnnualAxisDetail } from "./AnnualAxisDetail";
import {
  ANNUAL_AXIS_DOMAIN_ORDER,
  ANNUAL_AXIS_BAND_LABEL_VI,
  ANNUAL_AXIS_LABEL_VI,
} from "./labels";
import "./annual-axes.css";

export interface AnnualAxesSectionProps {
  chart: ChartData;
  school: School;
  result?: AnnualAxesResult;
}

function engineBadgeLabel(result: AnnualAxesResult): string {
  if (result.school === "trung-chau") {
    return "Trung Châu";
  }
  if (result.versions.engineVersion === "0.8.0") {
    return "Nam Phái V0.8";
  }
  if (result.versions.engineVersion === "0.7.0") {
    return "Nam Phái V0.7";
  }
  if (result.versions.engineVersion === "0.5.0") {
    return "Nam Phái V0.5";
  }
  return "Nam Phái";
}

function scoreStateDescription(axis: Extract<AnnualAxisResult, { status: "available" }>): string | null {
  const trace = axis.scoreTrace;
  if (trace?.formulaVersion !== "v0.8-annual-palace-weighted-score") return null;
  switch (trace.scoreState) {
    case "no-signal":
      return "Chưa có tín hiệu lưu niên nổi bật trong các cung được ánh xạ.";
    case "balanced-signal":
      return "Cát tinh và hung tinh đang cân bằng theo ánh xạ V0.8.";
    case "partial-data":
      return "Thiếu một phần dữ liệu cung lưu niên; điểm được tính từ dữ liệu hiện có.";
    case "scored":
      return null;
  }
}

export function AnnualAxesSection({ chart, school, result }: AnnualAxesSectionProps) {
  const computed = useMemo(() => {
    if (result) return result;
    return analyzeAnnualAxes(chart, { school });
  }, [chart, school, result]);

  const [selectedDomain, setSelectedDomain] = useState<AnnualAxisDomain | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<AnnualAxisDomain | null>(null);

  useEffect(() => {
    setSelectedDomain(null);
    setHoveredDomain(null);
  }, [chart, school]);

  const activeDomain: AnnualAxisDomain | null = (() => {
    const candidate = selectedDomain ?? hoveredDomain;
    return candidate && ANNUAL_AXIS_DOMAIN_ORDER.includes(candidate) ? candidate : null;
  })();
  const activeAxis = activeDomain ? computed.axes[activeDomain] : null;

  function toggleDomain(domain: string) {
    setSelectedDomain((cur) => (cur === domain ? null : (domain as AnnualAxisDomain)));
  }

  const badgeLabel = engineBadgeLabel(computed);
  const v08Trace =
    activeAxis?.status === "available" &&
    activeAxis.scoreTrace?.formulaVersion === "v0.8-annual-palace-weighted-score"
      ? activeAxis.scoreTrace
      : null;

  return (
    <section className="annual-axes-section" data-module="annual-axes" aria-label="Sáu trục khí vận năm">
      <header className="annual-axes-section__head">
        <h3 className="annual-axes-section__title">Sáu trục khí vận năm</h3>
        <span className="annual-axes-section__badge">{badgeLabel}</span>
        <span className="annual-axes-section__year">Năm {computed.annualYear}</span>
        <span className="annual-axes-section__engine">
          Engine {computed.versions.engineVersion}
        </span>
      </header>

      <div className="annual-axes-section__body">
        <AnnualAxesRadar
          result={computed}
          selectedDomain={selectedDomain}
          activeDomain={activeDomain}
          onSelect={toggleDomain}
          onHover={(domain) => setHoveredDomain(domain as AnnualAxisDomain | null)}
        />

        {activeDomain && activeAxis && activeAxis.status === "available" ? (
          <div className="annual-axes-section__tooltip" role="status">
            <strong className="annual-axes-section__tooltip-title">
              {ANNUAL_AXIS_LABEL_VI[activeDomain]}
            </strong>
            <p className="annual-axes-section__tooltip-summary">
              Điểm {activeAxis.score.toFixed(1)}
              {v08Trace ? (
                <>
                  {scoreStateDescription(activeAxis) ? (
                    <>
                      <br />
                      {scoreStateDescription(activeAxis)}
                    </>
                  ) : (
                    <>
                      <br />
                      {ANNUAL_AXIS_BAND_LABEL_VI[activeAxis.band]}
                    </>
                  )}
                  <br />
                  Cung trọng tâm {v08Trace.primary.palaceName}
                  <br />
                  Cung phối hợp{" "}
                  {v08Trace.cooperating.map((c) => c.palaceName).join(", ") || "—"}
                  <br />
                  Lưu Thái Tuế nổi bật: {v08Trace.isThaiTueHighlighted ? "Có" : "Không"}
                </>
              ) : (
                <>
                  {" "}
                  · {ANNUAL_AXIS_BAND_LABEL_VI[activeAxis.band]}
                  <br />
                  Cường độ {activeAxis.intensity} · Xung đột {activeAxis.conflict}
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="annual-axes-section__tooltip">
            Di chuột hoặc chọn một trục để xem chi tiết (dùng Tab + Enter trên
            bàn phím).
          </p>
        )}
      </div>

      {selectedDomain && computed.axes[selectedDomain] ? (
        <AnnualAxisDetail
          domain={selectedDomain}
          axis={computed.axes[selectedDomain]}
          onClose={() => setSelectedDomain(null)}
        />
      ) : null}
    </section>
  );
}
