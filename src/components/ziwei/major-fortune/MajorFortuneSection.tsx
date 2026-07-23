import { useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  analyzeMajorFortuneOrdinalV03,
  type MajorFortuneOrdinalV03Analysis,
  type MajorFortuneProductionResult,
} from "@/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter";
import "./major-fortune-v03.css";

export type { MajorFortuneProductionResult };

export interface MajorFortuneSectionProps {
  chart: ChartData;
  school: School;
  /** Optional precomputed analysis for tests. */
  analysis?: MajorFortuneOrdinalV03Analysis;
}

function moduleStateLabelVi(analysis: MajorFortuneOrdinalV03Analysis): string {
  if (analysis.adapterStatus === "unavailable" || !analysis.result) return "Không khả dụng";
  if (analysis.result.status === "partial" || analysis.adapterStatus === "partial") {
    return "Thiếu dữ liệu";
  }
  return "Đã đánh giá";
}

/**
 * Production Major Fortune V0.3 section.
 * Mounted when getAnalysisStatus("major-fortune") is available.
 */
export function MajorFortuneSection({
  chart,
  school,
  analysis: analysisProp,
}: MajorFortuneSectionProps) {
  const analysis = useMemo(() => {
    if (analysisProp) return analysisProp;
    return analyzeMajorFortuneOrdinalV03(chart, { school });
  }, [chart, school, analysisProp]);

  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const scoreText =
    analysis.result?.score == null ? "—" : analysis.result.score.toFixed(1);
  const bandText = analysis.display.bandLabelVi ?? "—";
  const coverage =
    analysis.display.scoringCoveragePercent == null
      ? "—"
      : `${analysis.display.scoringCoveragePercent}%`;
  const cycle = analysis.cycle;

  return (
    <section
      className="mf-v03"
      data-module="major-fortune"
      data-version="0.3.1"
      data-status={analysis.adapterStatus}
      aria-label="Đại Vận V0.3"
    >
      <header className="mf-v03__head">
        <h3 className="mf-v03__title">{analysis.display.title}</h3>
        <span className="mf-v03__badge">{analysis.display.experimentalBadge}</span>
        <p className="mf-v03__subtitle">{analysis.display.subtitle}</p>
      </header>

      <p className="mf-v03__disclaimer">{analysis.display.disclaimer}</p>

      {analysis.display.namPhaiPartialTuHoaNote ? (
        <p className="mf-v03__partial-note" role="status">
          {analysis.display.namPhaiPartialTuHoaNote}
        </p>
      ) : null}

      {!analysis.result || analysis.adapterStatus === "unavailable" ? (
        <p className="mf-v03__unavailable" role="status">
          {analysis.adapterDiagnostics.missingActiveMajorFortunePalace.length > 0
            ? "Không có cung Đại Vận đang hoạt động — không tạo điểm thay thế."
            : "Không thể đánh giá Đại Vận với dữ liệu hiện tại."}
        </p>
      ) : (
        <>
          <div className="mf-v03__summary" aria-label="Tóm tắt điểm">
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">Điểm</span>
              <span className="mf-v03__stat-value">{scoreText}</span>
            </div>
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">Mức</span>
              <span className="mf-v03__stat-value">{bandText}</span>
            </div>
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">Độ phủ tính điểm</span>
              <span className="mf-v03__stat-value">{coverage}</span>
            </div>
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">Trạng thái</span>
              <span className="mf-v03__stat-value">{moduleStateLabelVi(analysis)}</span>
            </div>
            <div className="mf-v03__stat">
              <span className="mf-v03__stat-label">Phái</span>
              <span className="mf-v03__stat-value">
                {school === "nam-phai" ? "Nam Phái" : "Trung Châu"}
              </span>
            </div>
            {cycle ? (
              <div className="mf-v03__stat mf-v03__stat--wide">
                <span className="mf-v03__stat-label">Đại vận</span>
                <span className="mf-v03__stat-value">
                  {cycle.startAge}–{cycle.endAge} · {cycle.activePalaceName} (
                  {cycle.activePalaceBranch})
                </span>
              </div>
            ) : null}
            {analysis.display.scoredPillarFractionLabel ? (
              <div className="mf-v03__stat mf-v03__stat--wide">
                <span className="mf-v03__stat-label">Trụ đã tính</span>
                <span className="mf-v03__stat-value">
                  {analysis.display.scoredPillarFractionLabel}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mf-v03__pillars" role="list">
            {analysis.display.pillarSummaries.map((pillar) => (
              <article
                key={pillar.pillarId}
                className="mf-v03__pillar"
                data-pillar={pillar.pillarId}
                data-state={pillar.state}
                role="listitem"
              >
                <h4 className="mf-v03__pillar-title">{pillar.labelVi}</h4>
                <p className="mf-v03__pillar-level">
                  {pillar.level == null
                    ? "—"
                    : pillar.level > 0
                      ? `+${pillar.level}`
                      : String(pillar.level)}{" "}
                  <span className="mf-v03__pillar-level-label">{pillar.levelLabelVi}</span>
                </p>
                <p className="mf-v03__pillar-meta">
                  Δ {pillar.delta.toFixed(1)} · {pillar.stateLabelVi}
                </p>
                {pillar.evidenceLabels.length > 0 ? (
                  <ul className="mf-v03__pillar-evidence">
                    {pillar.evidenceLabels.slice(0, 3).map((label) => (
                      <li key={label}>{label}</li>
                    ))}
                  </ul>
                ) : null}
                {pillar.reasonLabels.length > 0 ? (
                  <p className="mf-v03__pillar-reason">{pillar.reasonLabels[0]}</p>
                ) : null}
              </article>
            ))}
          </div>

          <details
            className="mf-v03__details"
            open={evidenceOpen}
            onToggle={(e) => setEvidenceOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary>Chi tiết bằng chứng</summary>
            <ul className="mf-v03__evidence-list">
              {analysis.display.pillarSummaries.flatMap((p) =>
                p.evidenceLabels.map((label) => (
                  <li key={`${p.pillarId}:${label}`}>
                    <strong>{p.labelVi}:</strong> {label}
                  </li>
                )),
              )}
              {analysis.display.pillarSummaries.every((p) => p.evidenceLabels.length === 0) ? (
                <li>Không có bằng chứng được chấp nhận.</li>
              ) : null}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}

/** @deprecated Prefer MajorFortuneSection */
export const MajorFortuneV03OrdinalSection = MajorFortuneSection;
export type MajorFortuneV03OrdinalSectionProps = MajorFortuneSectionProps;
