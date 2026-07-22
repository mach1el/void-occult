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
  const radial = R + LABEL_GAP + (sin > 0.55 ? 8 : 0);
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
  if (sin > 0.55) dy = 10;
  else if (sin < -0.55) dy = -4;
  return {
    x: CX + radial * cos,
    y: CY + radial * sin,
    textAnchor,
    dx,
    dy,
  };
}

/**
 * Build open polyline segments for contiguous plottable axes.
 * Unavailable axes create visible gaps — never a center (score-zero) vertex.
 */
export function buildRadarSegments(
  scores: Array<number | null>,
): Array<Array<{ x: number; y: number; index: number }>> {
  const total = scores.length;
  const segments: Array<Array<{ x: number; y: number; index: number }>> = [];
  let current: Array<{ x: number; y: number; index: number }> = [];

  const pushPoint = (i: number, score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    const p = polar(i, total, (clamped / 100) * R);
    current.push({ x: p.x, y: p.y, index: i });
  };

  for (let i = 0; i < total; i++) {
    const score = scores[i];
    if (score == null) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      continue;
    }
    pushPoint(i, score);
  }
  if (current.length > 0) segments.push(current);

  // Wrap-around: if first and last scores are both plottable and there is a gap
  // somewhere else, merge the first and last open segments into one polyline.
  if (
    segments.length >= 2 &&
    scores[0] != null &&
    scores[total - 1] != null &&
    scores.some((s) => s == null)
  ) {
    const first = segments[0]!;
    const last = segments[segments.length - 1]!;
    if (first[0]?.index === 0 && last[last.length - 1]?.index === total - 1) {
      segments[0] = [...last, ...first];
      segments.pop();
    }
  }

  return segments;
}

function segmentToPointsAttr(
  segment: Array<{ x: number; y: number }>,
): string {
  return segment.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
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
 * Six-axis radar for the annual axes result.
 * Unavailable axes remain inspectable but are not plotted at radius zero.
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
    axis.status === "available" || axis.status === "partial-data" ? axis.score : null,
  );
  const segments = buildRadarSegments(scores);

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
        {segments.map((segment, segIdx) => {
          if (segment.length === 1) {
            const p = segment[0]!;
            return (
              <circle
                key={`seg-${segIdx}`}
                cx={p.x}
                cy={p.y}
                r={2}
                fill="color-mix(in srgb, currentColor 40%, transparent)"
                data-radar-segment="singleton"
              />
            );
          }
          const closed =
            scores.every((s) => s != null) && segment.length === scores.length;
          if (closed) {
            return (
              <polygon
                key={`seg-${segIdx}`}
                points={segmentToPointsAttr(segment)}
                fill="color-mix(in srgb, currentColor 18%, transparent)"
                stroke="currentColor"
                strokeWidth={1.4}
                data-radar-segment="closed"
              />
            );
          }
          return (
            <polyline
              key={`seg-${segIdx}`}
              points={segmentToPointsAttr(segment)}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              data-radar-segment="open"
            />
          );
        })}
        {ordered.map(({ domain, axis }, i) => {
          const isPlottable = axis.status === "available" || axis.status === "partial-data";
          const score = isPlottable ? axis.score : null;
          // Unavailable markers sit on the outer ring so they remain visible
          // without implying a numeric score of zero at the center.
          const p = polar(i, 6, isPlottable ? ((score ?? 0) / 100) * R : R * 0.92);
          const label = labelPlacement(i, 6);
          const isActive = activeDomain === domain;
          const axisLabel =
            ANNUAL_AXIS_LABEL_VI[domain as keyof typeof ANNUAL_AXIS_LABEL_VI] ?? domain;
          const scoreLabel = isPlottable
            ? `điểm ${axis.score}${axis.status === "partial-data" ? " · thiếu dữ liệu" : ""}`
            : "không đủ dữ liệu";
          return (
            <g key={domain} className="annual-axes-radar__axis">
              <g
                className={`annual-axes-radar__point${isActive ? " is-active" : ""}`}
                tabIndex={0}
                role="button"
                aria-pressed={selectedDomain === domain}
                aria-label={`${axisLabel} — ${scoreLabel}`}
                data-domain={domain}
                data-status={axis.status}
                data-radius={isPlottable ? "scored" : "gap"}
                onMouseEnter={() => onHover(domain)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(domain)}
                onBlur={() => onHover(null)}
                onClick={() => onSelect(domain)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(domain);
                  }
                }}
              >
                {/* invisible larger hit target for pointer/keyboard tap area */}
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" pointerEvents="all" />
                {isPlottable ? (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 5 : 3.5}
                    fill="currentColor"
                    stroke={axis.status === "partial-data" ? "currentColor" : undefined}
                    strokeDasharray={axis.status === "partial-data" ? "2 2" : undefined}
                    data-plot="scored"
                  />
                ) : (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 5 : 3.5}
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="2 3"
                    data-plot="unavailable"
                  />
                )}
              </g>
              <text
                className={`annual-axes-radar__label${isActive ? " is-active" : ""}`}
                x={label.x}
                y={label.y}
                dx={label.dx}
                dy={label.dy}
                textAnchor={label.textAnchor}
                dominantBaseline="middle"
                pointerEvents="none"
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
