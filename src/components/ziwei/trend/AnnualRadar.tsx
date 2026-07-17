import { useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  ANNUAL_AXIS_ORDER,
  formatUIBreakdown,
  getAnnualAxisStrengths,
  isBaseContributionLine,
  type AnnualAxisStrength,
  type ScoreLine,
} from "@/lib/ziwei/trend";
import "./annual-radar.css";

interface AnnualRadarProps {
  chart: ChartData;
  school: School;
  compact?: boolean;
}

function formatSigned(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

function Breakdown({ lines }: { lines: ScoreLine[] }) {
  return (
    <ul className="annual-radar-breakdown">
      {lines.map((line, index) => (
        <li key={`${line.source}-${index}`}>
          <span>{line.source}</span>
          <strong>{formatSigned(line.points)}</strong>
          <small>{line.reason}</small>
        </li>
      ))}
    </ul>
  );
}

function selectedExplanation(selected: AnnualAxisStrength) {
  const baseRaw = selected.breakdown.filter(isBaseContributionLine);
  const otherRaw = selected.breakdown.filter(
    (line) => !isBaseContributionLine(line),
  );
  const baseUi = formatUIBreakdown(baseRaw);
  const otherUi = formatUIBreakdown(otherRaw);
  return {
    baseDisplay: baseUi.total,
    lines: [...baseUi.items, ...otherUi.items],
  };
}

export function AnnualRadar({ chart, school, compact = false }: AnnualRadarProps) {
  const strengths = useMemo(
    () => getAnnualAxisStrengths(chart, { school }),
    [chart, school],
  );
  const [selected, setSelected] = useState<AnnualAxisStrength | null>(null);
  const explanation = useMemo(
    () => (selected ? selectedExplanation(selected) : null),
    [selected],
  );

  const size = compact ? 300 : 360;
  const center = size / 2;
  const radius = size * 0.34;

  const geometry = useMemo(() => {
    const angleStep = 360 / ANNUAL_AXIS_ORDER.length;
    return strengths.map((item, index) => {
      const angle = index * angleStep;
      const rad = ((angle - 90) * Math.PI) / 180;
      const r = radius * (item.score / 100);
      const baseR = radius * (item.base / 100);
      return {
        item,
        angle,
        outer: {
          x: center + radius * Math.cos(rad),
          y: center + radius * Math.sin(rad),
        },
        point: {
          x: center + r * Math.cos(rad),
          y: center + r * Math.sin(rad),
        },
        basePoint: {
          x: center + baseR * Math.cos(rad),
          y: center + baseR * Math.sin(rad),
        },
        label: {
          x: center + (radius + 24) * Math.cos(rad),
          y: center + (radius + 24) * Math.sin(rad),
        },
      };
    });
  }, [strengths, center, radius]);

  const polygon = geometry
    .map((entry, index) => `${index === 0 ? "M" : "L"} ${entry.point.x},${entry.point.y}`)
    .join(" ") + " Z";
  const basePolygon = geometry
    .map(
      (entry, index) =>
        `${index === 0 ? "M" : "L"} ${entry.basePoint.x},${entry.basePoint.y}`,
    )
    .join(" ") + " Z";

  const year = chart.annualYear;
  const smallLimit = chart.smallLimitPalace?.name;

  return (
    <section className="annual-radar" aria-label={`Radar vận hạn 6 trục năm ${year}`}>
      <header className="annual-radar-head">
        <h3>Vận hạn 6 trục · {year}</h3>
        <p className="annual-radar-disclaimer">
          Điểm nền từ khí vận 12 cung (trọng số domain), cộng sao Lưu trên cung
          chính và đối cung, kích hoạt hạn và guardrails liên trục. Nét đứt là
          nền gốc; nét sáng là vận khí năm. Thang 0–100 — mô hình tham khảo,
          không phải định mệnh.
          {smallLimit ? ` Tiểu Hạn: ${smallLimit}.` : ""}
        </p>
      </header>

      <div className="annual-radar-stage">
        <svg
          className="annual-radar-svg"
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Radar vận hạn 6 trục theo năm xem"
        >
          {[0.33, 0.66, 1].map((level) => {
            const ring = geometry
              .map((entry, index) => {
                const x = center + (entry.outer.x - center) * level;
                const y = center + (entry.outer.y - center) * level;
                return `${index === 0 ? "M" : "L"} ${x},${y}`;
              })
              .join(" ") + " Z";
            return <path key={level} className="annual-radar-grid" d={ring} />;
          })}

          {geometry.map((entry) => (
            <line
              key={`axis-${entry.item.axis}`}
              className="annual-radar-axis"
              x1={center}
              y1={center}
              x2={entry.outer.x}
              y2={entry.outer.y}
            />
          ))}

          <path className="annual-radar-base-polygon" d={basePolygon} />
          <path className="annual-radar-polygon" d={polygon} />

          {geometry.map((entry) => (
            <g key={entry.item.axis}>
              <circle
                className="annual-radar-dot"
                cx={entry.point.x}
                cy={entry.point.y}
                r={3.5}
                onClick={() =>
                  setSelected((current) =>
                    current?.axis === entry.item.axis ? null : entry.item,
                  )
                }
              />
              <text
                className="annual-radar-label"
                x={entry.label.x}
                y={entry.label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                onClick={() =>
                  setSelected((current) =>
                    current?.axis === entry.item.axis ? null : entry.item,
                  )
                }
              >
                {entry.item.axis}
                <tspan x={entry.label.x} dy="1.1em">
                  {entry.item.score}
                </tspan>
              </text>
            </g>
          ))}
        </svg>
      </div>

      {selected && (
        <aside className="annual-radar-panel">
          <header>
            <div>
              <h4>{selected.axis}</h4>
              <p>
                Vận hạn <strong>{selected.score}</strong> · năm {selected.year}
                {selected.smallLimitPalace
                  ? ` · Tiểu Hạn ${selected.smallLimitPalace}`
                  : ""}
              </p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>
              Đóng
            </button>
          </header>

          <p className="annual-radar-base">
            Điểm nền B_D <strong>{explanation?.baseDisplay}</strong>
          </p>

          <h5 className="annual-radar-subhead">Nền + sao lưu + guardrails</h5>
          <Breakdown lines={explanation?.lines ?? []} />
        </aside>
      )}
    </section>
  );
}
