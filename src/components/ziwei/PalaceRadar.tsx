import { useMemo, useState } from "react";
import type { ChartData } from "@/types/chart";
import {
  getPalaceStrengths,
  shortPalaceName,
  type PalaceStrength,
  type ScoreLine,
} from "@/lib/ziwei/trend-score";
import "./palace-radar.css";

interface PalaceRadarProps {
  chart: ChartData;
  compact?: boolean;
}

function Breakdown({ lines }: { lines: ScoreLine[] }) {
  return (
    <ul className="palace-radar-breakdown">
      {lines.map((line, index) => (
        <li key={`${line.source}-${index}`}>
          <span>{line.source}</span>
          <strong>
            {line.points > 0 ? `+${line.points}` : line.points}
          </strong>
          <small>{line.reason}</small>
        </li>
      ))}
    </ul>
  );
}

export function PalaceRadar({ chart, compact = false }: PalaceRadarProps) {
  const strengths = useMemo(() => getPalaceStrengths(chart), [chart]);
  const [selected, setSelected] = useState<PalaceStrength | null>(null);

  const size = compact ? 300 : 360;
  const center = size / 2;
  const radius = size * 0.34;

  const geometry = useMemo(() => {
    const angleStep = 360 / Math.max(strengths.length, 1);
    return strengths.map((item, index) => {
      const angle = index * angleStep;
      const rad = ((angle - 90) * Math.PI) / 180;
      const r = radius * (item.score / 100);
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
        label: {
          x: center + (radius + 22) * Math.cos(rad),
          y: center + (radius + 22) * Math.sin(rad),
        },
      };
    });
  }, [strengths, center, radius]);

  const polygon = geometry
    .map((entry, index) => `${index === 0 ? "M" : "L"} ${entry.point.x},${entry.point.y}`)
    .join(" ") + " Z";

  const menhName = chart.palaces.find((palace) => palace.isMenh)?.name ?? "Mệnh";
  const thanName = chart.palaces[chart.thanIndex]?.name;

  return (
    <section className="palace-radar" aria-label="Radar khí vận 12 cung">
      <header className="palace-radar-head">
        <h3>Khí vận 12 cung</h3>
        <p className="palace-radar-disclaimer">
          Độ vững tĩnh của cung — mô hình tham khảo, không phải định mệnh.
        </p>
      </header>

      <div className="palace-radar-stage">
        <svg
          className="palace-radar-svg"
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Radar độ vững 12 cung bản mệnh"
        >
          <title>Radar khí vận 12 cung</title>
          {[0.33, 0.66, 1].map((level) => {
            const ring = geometry
              .map((entry, index) => {
                const x = center + (entry.outer.x - center) * level;
                const y = center + (entry.outer.y - center) * level;
                return `${index === 0 ? "M" : "L"} ${x},${y}`;
              })
              .join(" ") + " Z";
            return <path key={level} className="palace-radar-grid" d={ring} />;
          })}

          {geometry.map((entry) => (
            <line
              key={`axis-${entry.item.palace}`}
              className="palace-radar-axis"
              x1={center}
              y1={center}
              x2={entry.outer.x}
              y2={entry.outer.y}
            />
          ))}

          <path className="palace-radar-polygon" d={polygon} />

          {geometry.map((entry) => {
            const isMenh = entry.item.palace === menhName;
            const isThan = entry.item.palace === thanName;
            const label = compact
              ? shortPalaceName(entry.item.palace)
              : entry.item.palace;
            return (
              <g key={entry.item.palace}>
                <circle
                  className={`palace-radar-dot${isMenh ? " is-menh" : ""}${isThan ? " is-than" : ""}`}
                  cx={entry.point.x}
                  cy={entry.point.y}
                  r={isMenh || isThan ? 4.5 : 3}
                  onClick={() => setSelected(entry.item)}
                />
                <text
                  className={`palace-radar-label${isMenh ? " is-menh" : ""}${isThan ? " is-than" : ""}`}
                  x={entry.label.x}
                  y={entry.label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  onClick={() => setSelected(entry.item)}
                >
                  {label}
                  <tspan x={entry.label.x} dy="1.1em">
                    {entry.item.score}
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected && (
        <aside className="palace-radar-panel">
          <header>
            <div>
              <h4>{selected.palace}</h4>
              <p>
                Độ vững <strong>{selected.score}</strong>
                {selected.palace === menhName ? " · Mệnh" : ""}
                {selected.palace === thanName ? " · Thân" : ""}
              </p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>
              Đóng
            </button>
          </header>
          <Breakdown lines={selected.breakdown} />
        </aside>
      )}
    </section>
  );
}
