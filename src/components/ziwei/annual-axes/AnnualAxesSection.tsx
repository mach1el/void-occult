import { useEffect, useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";
import {
  analyzeAnnualAxes,
  type AnnualAxesResult,
} from "@/lib/ziwei/analysis/modules/annual-axes";
import { AnnualAxesRadar } from "./AnnualAxesRadar";
import { AnnualAxisDetail } from "./AnnualAxisDetail";
import { ANNUAL_AXIS_DOMAIN_ORDER } from "./labels";
import "./annual-axes.css";

export interface AnnualAxesSectionProps {
  chart: ChartData;
  school: School;
  result?: AnnualAxesResult;
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

  function toggleDomain(domain: string) {
    setSelectedDomain((cur) => (cur === domain ? null : (domain as AnnualAxisDomain)));
  }

  return (
    <section className="annual-axes-section" data-module="annual-axes" aria-label="Sáu trục khí vận năm">
      <header className="annual-axes-section__head">
        <h3 className="annual-axes-section__title">Sáu trục khí vận năm</h3>
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
        <p className="annual-axes-section__hint">
          Chọn một trục trên biểu đồ để xem chi tiết.
        </p>
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
