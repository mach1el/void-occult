import { useEffect, useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";
import {
  analyzeAnnualAxes,
  type AnnualAxesResult,
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
  /** Precomputed analyzer result — passed in from the parent so the
   * potentially expensive `analyzeAnnualAxes` call can be memoized at
   * the ChartPage level (see mission spec). When omitted, this component
   * computes it locally as a fallback. */
  result?: AnnualAxesResult;
}

/**
 * Public Annual Axes section. Layout mirrors PalaceOverviewRadar:
 * header, then radar | tooltip, then an optional detail block. Emits no
 * prediction prose.
 */
export function AnnualAxesSection({ chart, school, result }: AnnualAxesSectionProps) {
  const computed = useMemo(() => {
    if (result) return result;
    return analyzeAnnualAxes(chart, { school });
  }, [chart, school, result]);

  const [selectedDomain, setSelectedDomain] = useState<AnnualAxisDomain | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<AnnualAxisDomain | null>(null);

  // Reset selection when the chart/school changes so a stale domain
  // detail from a different chart cannot linger on-screen.
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

  return (
    <section className="annual-axes-section" data-module="annual-axes" aria-label="Sáu trục khí vận năm">
      <header className="annual-axes-section__head">
        <h3 className="annual-axes-section__title">Sáu trục khí vận năm</h3>
        <span className="annual-axes-section__badge">Experimental</span>
        <span className="annual-axes-section__year">Năm {computed.annualYear}</span>
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
              Điểm {activeAxis.score.toFixed(1)} · {ANNUAL_AXIS_BAND_LABEL_VI[activeAxis.band]}
              {typeof activeAxis.annualDelta === "number" ? (
                <>
                  <br />
                  Delta năm {activeAxis.annualDelta >= 0 ? "+" : ""}
                  {activeAxis.annualDelta.toFixed(1)} (trung tính 50)
                </>
              ) : null}
              <br />
              Cường độ {activeAxis.intensity} · Xung đột {activeAxis.conflict}
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
