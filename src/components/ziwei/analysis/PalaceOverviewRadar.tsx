import { useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  analyzeAllPalaces,
  type PalaceOverviewResult,
} from "@/lib/ziwei/analysis/modules/palace-overview";
import {
  palaceDomainHint,
  renderExplanationKey,
} from "./explanation-renderer";
import "./palace-overview-radar.css";

const CX = 150;
const CY = 150;
const R = 112;

function polar(index: number, total: number, radius: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function polygonPoints(scores: number[]): string {
  return scores
    .map((score, i) => {
      const p = polar(i, scores.length, (Math.max(0, Math.min(100, score)) / 100) * R);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

export interface PalaceOverviewRadarProps {
  chart: ChartData;
  school: School;
}

export function PalaceOverviewRadar({ chart, school }: PalaceOverviewRadarProps) {
  const analysis = useMemo(
    () => analyzeAllPalaces(chart, { school }),
    [chart, school],
  );
  const results = analysis.results;
  const [selected, setSelected] = useState<PalaceOverviewResult | null>(null);
  const [hovered, setHovered] = useState<PalaceOverviewResult | null>(null);

  const ordered = useMemo(() => {
    if (!analysis.knowledgeValid || results.length === 0) return [];
    return chart.palaces.map(
      (p) => results.find((r) => r.palaceIndex === p.index)!,
    );
  }, [analysis.knowledgeValid, chart.palaces, results]);

  if (!analysis.knowledgeValid || ordered.length === 0) {
    return (
      <div className="palace-overview-radar" role="status">
        <p>Không tải được knowledge palace-overview.</p>
      </div>
    );
  }

  const active = selected ?? hovered;
  const scores = ordered.map((r) => r.score);

  return (
    <div className="palace-overview-radar" data-module="palace-overview">
      <div className="palace-overview-radar__head">
        <h3 className="palace-overview-radar__title">Khí vận 12 cung</h3>
        <span className="palace-overview-radar__badge">Experimental</span>
      </div>
      <p className="palace-overview-radar__disclaimer">
        Điểm thể hiện mô hình phân tích cấu trúc lá số, không phải kết luận định
        mệnh.
      </p>

      <div className="palace-overview-radar__body">
        <div className="palace-overview-radar__svg-wrap">
          <svg
            className="palace-overview-radar__svg"
            viewBox="0 0 300 300"
            role="img"
            aria-label="Radar khí vận 12 cung"
          >
            {[0.25, 0.5, 0.75, 1].map((scale) => (
              <polygon
                key={scale}
                points={Array.from({ length: 12 }, (_, i) => {
                  const p = polar(i, 12, R * scale);
                  return `${p.x},${p.y}`;
                }).join(" ")}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.18}
              />
            ))}
            {ordered.map((_, i) => {
              const p = polar(i, 12, R);
              return (
                <line
                  key={`axis-${i}`}
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  stroke="currentColor"
                  strokeOpacity={0.14}
                />
              );
            })}
            <polygon
              points={polygonPoints(scores)}
              fill="color-mix(in srgb, currentColor 18%, transparent)"
              stroke="currentColor"
              strokeWidth={1.4}
            />
            {ordered.map((result, i) => {
              const p = polar(i, 12, (result.score / 100) * R);
              const label = polar(i, 12, R + 16);
              const isActive = active?.palaceIndex === result.palaceIndex;
              return (
                <g
                  key={result.palaceIndex}
                  className={`palace-overview-radar__point${isActive ? " is-active" : ""}`}
                  onMouseEnter={() => setHovered(result)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() =>
                    setSelected((cur) =>
                      cur?.palaceIndex === result.palaceIndex ? null : result,
                    )
                  }
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 4.5 : 3.2}
                    fill="currentColor"
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fill="currentColor"
                  >
                    {result.palaceName.replace("Phúc Đức", "Phúc").slice(0, 4)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {active ? (
          <div className="palace-overview-radar__tooltip" role="status">
            <strong>
              {active.palaceName} · {active.palaceBranch}
            </strong>
            {palaceDomainHint(active.palaceName) ? (
              <div style={{ opacity: 0.8, fontSize: "0.8rem" }}>
                {palaceDomainHint(active.palaceName)}
              </div>
            ) : null}
            <dl>
              <dt>Score</dt>
              <dd>{active.score}</dd>
              <dt>Support</dt>
              <dd>{active.axes.support}</dd>
              <dt>Pressure</dt>
              <dd>{active.axes.pressure}</dd>
              <dt>Stability</dt>
              <dd>{active.axes.stability}</dd>
              <dt>Activation</dt>
              <dd>{active.axes.activation}</dd>
              <dt>Intensity</dt>
              <dd>{active.intensity}</dd>
              <dt>Chính tinh</dt>
              <dd>
                {active.majorStars.length
                  ? active.majorStars
                      .filter((s) => s.role === "focus" || active.isVoidMajor)
                      .map((s) => `${s.name}(${s.brightness})`)
                      .join(", ") || "—"
                  : "—"}
              </dd>
              <dt>VCD</dt>
              <dd>{active.isVoidMajor ? "Có" : "Không"}</dd>
            </dl>
          </div>
        ) : (
          <p className="palace-overview-radar__tooltip">
            Di chuột hoặc chọn một cung để xem trục và chính tinh.
          </p>
        )}
      </div>

      {selected ? (
        <PalaceOverviewDetail
          result={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function PalaceOverviewDetail({
  result,
  onClose,
}: {
  result: PalaceOverviewResult;
  onClose: () => void;
}) {
  const transforms = result.allEvidence.filter(
    (e) => e.category === "transformation",
  );
  const rules = result.allEvidence.filter(
    (e) => e.category === "structural-rule",
  );
  const voidBits = result.allEvidence.filter(
    (e) => e.category === "void-environment",
  );

  return (
    <div className="palace-overview-detail">
      <h4 className="palace-overview-detail__title">
        Chi tiết · {result.palaceName}
      </h4>
      <p className="palace-overview-detail__meta">
        Band {result.band} · completeness {result.evidenceCompleteness} ·{" "}
        {result.profileId} · {result.version} · {result.school}
      </p>

      <section className="palace-overview-detail__section">
        <h5>Chính tinh lõi</h5>
        <ul>
          {result.majorStars
            .filter((s) => s.role === "focus" || result.isVoidMajor)
            .map((s) => (
              <li key={`${s.name}-${s.role}`}>
                {s.name} · {s.brightness} · {s.role}
              </li>
            ))}
          {!result.majorStars.some(
            (s) => s.role === "focus" || result.isVoidMajor,
          ) && <li>—</li>}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>Tứ Hóa gốc</h5>
        <ul>
          {transforms.length === 0 ? (
            <li>—</li>
          ) : (
            transforms.map((e) => (
              <li key={e.id}>
                {e.label} — {renderExplanationKey(e.explanationKey, e.label)}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>Top support</h5>
        <ul>
          {result.topSupportDrivers.map((e) => (
            <li key={e.id}>
              {e.label} (+{e.axes.support.toFixed(1)}) —{" "}
              {renderExplanationKey(e.explanationKey, e.label)}
            </li>
          ))}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>Top pressure</h5>
        <ul>
          {result.topPressureDrivers.map((e) => (
            <li key={e.id}>
              {e.label} (+{e.axes.pressure.toFixed(1)}) —{" "}
              {renderExplanationKey(e.explanationKey, e.label)}
            </li>
          ))}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>Structural rules</h5>
        <ul>
          {rules.length === 0 ? (
            <li>—</li>
          ) : (
            rules.map((e) => (
              <li key={e.id}>
                {renderExplanationKey(e.explanationKey, e.label)}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>VCD / Tuần·Triệt</h5>
        <ul>
          {voidBits.length === 0 ? (
            <li>—</li>
          ) : (
            voidBits.map((e) => (
              <li key={e.id}>
                {renderExplanationKey(e.explanationKey, e.label)}
              </li>
            ))
          )}
        </ul>
      </section>

      {result.contextOnlyStars.length > 0 ? (
        <details className="palace-overview-detail__section palace-overview-detail__context-only">
          <summary>Known context stars (chưa chấm điểm)</summary>
          <ul>
            {result.contextOnlyStars.map((s, i) => (
              <li key={`${s.name}-${s.role}-${i}`}>
                {s.name} · {s.role}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <button type="button" className="palace-overview-detail__close" onClick={onClose}>
        Đóng
      </button>
    </div>
  );
}
