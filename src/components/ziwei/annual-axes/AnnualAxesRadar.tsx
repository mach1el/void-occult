import { useMemo } from "react";
import type { AnnualAxesResult, AnnualAxisResult } from "@/lib/ziwei/analysis/modules/annual-axes";
import { ANNUAL_AXIS_DOMAIN_ORDER, ANNUAL_AXIS_LABEL_VI } from "./labels";

const CX = 210;
const CY = 210;
/** Chart radius — keep polygon large (~78% of half-viewBox); labels spill
 * outside via overflow:visible rather than shrinking the ring. */
const R = 164;
/** Clearance from the outer ring to the label anchor point. */
const LABEL_GAP = 12;

function polar(index: number, total: number, radius: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

/** Place labels just outside the ring. Anchor text outward (start/end)
 * on the sides so full Vietnamese axis names grow away from the polygon. */
function labelPlacement(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const radial = R + LABEL_GAP;
  let textAnchor: "start" | "middle" | "end" = "middle";
  let dx = 0;
  let dy = 0;
  if (cos > 0.35) {
    textAnchor = "start";
    dx = 4;
  } else if (cos < -0.35) {
    textAnchor = "end";
    dx = -4;
  }
  if (sin > 0.6) dy = 3;
  else if (sin < -0.6) dy = -2;
  return {
    x: CX + radial * cos,
    y: CY + radial * sin,
    textAnchor,
    dx,
    dy,
  };
}

function polygonPoints(scores: Array<number | null>): string {
  return scores
    .map((score, i) => {
      const clamped = score == null ? 0 : Math.max(0, Math.min(100, score));
      const p = polar(i, scores.length, (clamped / 100) * R);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

export interface AnnualAxesRadarProps {
  result: AnnualAxesResult;
  selectedDomain: string | null;
  /** Selected or hovered domain — drives the visual active state. */
  activeDomain: string | null;
  onSelect: (domain: string) => void;
  onHover: (domain: string | null) => void;
}

/**
 * Six-axis radar for the annual axes result. Only available domains are
 * plotted as concrete points — unavailable domains land at zero on the
 * polygon (per the mission spec: never plot a score of 0 as if it were a
 * real evaluation) and are labelled with an em-dash badge on their axis.
 */
export function AnnualAxesRadar({
  result,
  selectedDomain,
  activeDomain,
  onSelect,
  onHover,
}: AnnualAxesRadarProps) {
  const ordered = useMemo(() => {
    return ANNUAL_AXIS_DOMAIN_ORDER.map((domain): { domain: string; axis: AnnualAxisResult } => ({
      domain,
      axis: result.axes[domain],
    }));
  }, [result]);

  const scores = ordered.map(({ axis }) =>
    axis.status === "available" ? axis.score : null,
  );

  return (
    <div
      className="annual-axes-radar"
      data-module="annual-axes"
      role="figure"
      aria-label="Radar sáu trục khí vận năm"
    >
      <svg
        className="annual-axes-radar__svg"
        viewBox="0 0 420 420"
        role="img"
        aria-label="Radar sáu trục khí vận năm"
      >
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={Array.from({ length: 6 }, (_, i) => {
              const p = polar(i, 6, R * scale);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.18}
          />
        ))}
        {ordered.map((_, i) => {
          const p = polar(i, 6, R);
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
        {ordered.map(({ domain, axis }, i) => {
          const isAvailable = axis.status === "available";
          const score = isAvailable ? axis.score : 0;
          const p = polar(i, 6, (score / 100) * R);
          const label = labelPlacement(i, 6);
          const isActive = activeDomain === domain;
          const axisLabel =
            ANNUAL_AXIS_LABEL_VI[domain as keyof typeof ANNUAL_AXIS_LABEL_VI] ?? domain;
          const scoreLabel = isAvailable ? String(axis.score) : "—";
          return (
            <g
              key={domain}
              className={`annual-axes-radar__point${isActive ? " is-active" : ""}`}
              tabIndex={isAvailable ? 0 : -1}
              role="button"
              aria-pressed={selectedDomain === domain}
              aria-disabled={!isAvailable}
              aria-label={`${axisLabel} — điểm ${scoreLabel}`}
              data-domain={domain}
              onMouseEnter={() => onHover(domain)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(domain)}
              onBlur={() => onHover(null)}
              onClick={() => {
                if (isAvailable) onSelect(domain);
              }}
              onKeyDown={(e) => {
                if (!isAvailable) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(domain);
                }
              }}
            >
              {/* invisible larger hit target for pointer/keyboard tap area */}
              <circle cx={p.x} cy={p.y} r={22} fill="transparent" pointerEvents="all" />
              {isAvailable ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 5 : 3.5}
                  fill="currentColor"
                />
              ) : (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={2.5}
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="2 3"
                />
              )}
              <text
                className={`annual-axes-radar__label${isActive ? " is-active" : ""}`}
                x={label.x}
                y={label.y}
                dx={label.dx}
                dy={label.dy}
                textAnchor={label.textAnchor}
                dominantBaseline="middle"
              >
                {axisLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
