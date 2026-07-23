import { useCallback, useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { MonthlyFlowMonthSummary } from "@/lib/ziwei/analysis/modules/monthly-flow/v0.1-production";
import {
  MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT,
  projectVisibleMonthSummary,
} from "@/lib/ziwei/analysis/modules/monthly-flow/v0.1-production/display-projection";
import {
  DOMAIN_LABEL_VI,
  formatMonthShortLabel,
  formatMonthViewLabel,
} from "./labels";

export interface MonthlyFlowTimelineChartProps {
  summaries: MonthlyFlowMonthSummary[];
  selectedMonthKey: string | null;
  currentMonthKey: string | null;
  onSelectMonthKey: (monthKey: string) => void;
}

const VIEW_W = 1000;
const VIEW_H = 280;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 28;
const PAD_B = 44;
const Y_MAX = 100;
const Y_TICKS = [0, 20, 40, 60, 80, 100];
const COMPOSITE_LABEL = "Điểm tổng hợp 5 trục hiển thị";

function scoreToY(score: number): number {
  const plotH = VIEW_H - PAD_T - PAD_B;
  return PAD_T + plotH * (1 - score / Y_MAX);
}

function moduleStateLabel(status: "available" | "partial" | "unavailable"): string {
  if (status === "unavailable") return "Không khả dụng";
  if (status === "partial") return "Thiếu dữ liệu";
  return "Đã đánh giá";
}

function tooltipLines(summary: MonthlyFlowMonthSummary): string[] {
  const visible = projectVisibleMonthSummary(summary);
  const lines = [formatMonthViewLabel(summary.lunarMonth, summary.isLeapMonth), ""];

  if (visible.visibleCompositeScore == null) {
    lines.push("Điểm tổng hợp: —");
  } else {
    lines.push(`Điểm tổng hợp: ${visible.visibleCompositeScore.toFixed(1)}`);
  }

  lines.push(
    `Độ phủ: ${visible.visibleAxisCount}/${MONTHLY_FLOW_VISIBLE_DOMAIN_COUNT} trục`,
  );

  if (visible.visibleStrongestDomain) {
    lines.push(`Trục mạnh nhất: ${DOMAIN_LABEL_VI[visible.visibleStrongestDomain]}`);
  } else {
    lines.push("Trục mạnh nhất: —");
  }

  if (visible.visibleWeakestDomain) {
    lines.push(`Trục thấp nhất: ${DOMAIN_LABEL_VI[visible.visibleWeakestDomain]}`);
  } else {
    lines.push("Trục thấp nhất: —");
  }

  lines.push(`Trạng thái: ${moduleStateLabel(visible.status)}`);
  return lines;
}

/**
 * Accessible SVG monthly composite chart (no external chart library).
 */
export function MonthlyFlowTimelineChart({
  summaries,
  selectedMonthKey,
  currentMonthKey,
  onSelectMonthKey,
}: MonthlyFlowTimelineChartProps) {
  const reactId = useId();
  const [focusMonthKey, setFocusMonthKey] = useState<string | null>(null);
  const tipKey = focusMonthKey ?? selectedMonthKey;
  const tipSummary = summaries.find((m) => m.monthKey === tipKey) ?? null;

  const layout = useMemo(() => {
    const n = Math.max(summaries.length, 1);
    const plotW = VIEW_W - PAD_L - PAD_R;
    const slot = plotW / n;
    return summaries.map((summary, i) => {
      const cx = PAD_L + slot * (i + 0.5);
      const barW = Math.min(slot * 0.55, 42);
      return { summary, cx, barW, slot };
    });
  }, [summaries]);

  const minWidthPx = Math.max(summaries.length * 64, 320);

  const onKeyNav = useCallback(
    (e: KeyboardEvent, monthKey: string) => {
      const idx = summaries.findIndex((m) => m.monthKey === monthKey);
      if (idx < 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = summaries[Math.min(idx + 1, summaries.length - 1)];
        if (next) onSelectMonthKey(next.monthKey);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = summaries[Math.max(idx - 1, 0)];
        if (prev) onSelectMonthKey(prev.monthKey);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectMonthKey(monthKey);
      } else if (e.key === "Home") {
        e.preventDefault();
        if (summaries[0]) onSelectMonthKey(summaries[0].monthKey);
      } else if (e.key === "End") {
        e.preventDefault();
        const last = summaries[summaries.length - 1];
        if (last) onSelectMonthKey(last.monthKey);
      }
    },
    [onSelectMonthKey, summaries],
  );

  if (summaries.length === 0) {
    return (
      <div className="mf-flow-timeline mf-flow-timeline--empty" role="status">
        Không có tháng Lưu Nguyệt hợp lệ để hiển thị.
      </div>
    );
  }

  const plotBottom = VIEW_H - PAD_B;

  return (
    <div className="mf-flow-timeline">
      <div className="mf-flow-timeline__legend" aria-hidden="true">
        <span className="mf-flow-timeline__swatch mf-flow-timeline__swatch--composite" />
        {COMPOSITE_LABEL}
        <span className="mf-flow-timeline__swatch mf-flow-timeline__swatch--current" />
        Tháng hiện tại
      </div>

      <div
        className="mf-flow-timeline__scroll"
        data-testid="mf-flow-timeline-scroll"
        style={{ ["--mf-flow-timeline-min-width" as string]: `${minWidthPx}px` }}
      >
        <svg
          className="mf-flow-timeline__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label="Biểu đồ Lưu Nguyệt theo tháng âm lịch"
        >
          <title>Lưu Nguyệt — điểm tổng hợp 5 trục hiển thị theo tháng</title>

          <defs>
            <pattern
              id={`${reactId}-partial-hatch`}
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(62, 207, 142, 0.35)" strokeWidth="2" />
            </pattern>
          </defs>

          <g className="mf-flow-timeline__grid">
            {Y_TICKS.map((t) => {
              const y = scoreToY(t);
              return (
                <line
                  key={t}
                  x1={PAD_L}
                  x2={VIEW_W - PAD_R}
                  y1={y}
                  y2={y}
                  className="mf-flow-timeline__grid-line"
                />
              );
            })}
          </g>

          <g className="mf-flow-timeline__y-axis" aria-hidden="true">
            {Y_TICKS.map((t) => (
              <text
                key={t}
                x={PAD_L - 8}
                y={scoreToY(t) + 4}
                textAnchor="end"
                className="mf-flow-timeline__axis-label"
              >
                {t}
              </text>
            ))}
          </g>

          <g className="mf-flow-timeline__bars">
            {layout.map(({ summary, cx, barW }) => {
              const visible = projectVisibleMonthSummary(summary);
              const selected = summary.monthKey === selectedMonthKey;
              const partial = summary.status === "partial";
              const unavailable = visible.visibleCompositeScore == null;

              if (unavailable) {
                return (
                  <rect
                    key={`ph-${summary.monthKey}`}
                    x={cx - barW / 2}
                    y={plotBottom - 6}
                    width={barW}
                    height={6}
                    className="mf-flow-timeline__bar-placeholder"
                    data-month={summary.monthKey}
                    data-unavailable="true"
                  />
                );
              }

              const y = scoreToY(visible.visibleCompositeScore!);
              const h = Math.max(plotBottom - y, 0);
              return (
                <rect
                  key={`bar-${summary.monthKey}`}
                  x={cx - barW / 2}
                  y={y}
                  width={barW}
                  height={h}
                  rx={5}
                  className={[
                    "mf-flow-timeline__bar-composite",
                    selected ? "is-selected" : "",
                    partial ? "is-partial" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  fill={partial ? `url(#${reactId}-partial-hatch)` : undefined}
                  data-month={summary.monthKey}
                />
              );
            })}
          </g>

          <g className="mf-flow-timeline__hit">
            {layout.map(({ summary, cx, slot }) => (
              <rect
                key={`hit-${summary.monthKey}`}
                x={cx - slot / 2}
                y={PAD_T}
                width={slot}
                height={VIEW_H - PAD_T - PAD_B + 28}
                className="mf-flow-timeline__hit-area"
                tabIndex={0}
                role="button"
                aria-pressed={summary.monthKey === selectedMonthKey}
                aria-label={formatMonthViewLabel(summary.lunarMonth, summary.isLeapMonth)}
                data-month={summary.monthKey}
                onClick={() => onSelectMonthKey(summary.monthKey)}
                onKeyDown={(e) => onKeyNav(e, summary.monthKey)}
                onFocus={() => setFocusMonthKey(summary.monthKey)}
                onBlur={() => setFocusMonthKey(null)}
                onMouseEnter={() => setFocusMonthKey(summary.monthKey)}
                onMouseLeave={() => setFocusMonthKey(null)}
              />
            ))}
          </g>

          {layout.map(({ summary, cx }) =>
            summary.monthKey === currentMonthKey ? (
              <g
                key={`cur-${summary.monthKey}`}
                className="mf-flow-timeline__current-marker"
                aria-label={`Tháng hiện tại ${formatMonthShortLabel(summary.lunarMonth, summary.isLeapMonth)}`}
              >
                <line
                  x1={cx}
                  x2={cx}
                  y1={PAD_T - 6}
                  y2={plotBottom}
                  className="mf-flow-timeline__current-line"
                />
                <rect
                  x={cx - 42}
                  y={8}
                  width={84}
                  height={20}
                  rx={10}
                  className="mf-flow-timeline__current-pill"
                />
                <text
                  x={cx}
                  y={22}
                  textAnchor="middle"
                  className="mf-flow-timeline__current-pill-text"
                >
                  Tháng hiện tại
                </text>
              </g>
            ) : null,
          )}

          <g className="mf-flow-timeline__x-axis">
            {layout.map(({ summary, cx }) => {
              const isCurrent = summary.monthKey === currentMonthKey;
              const isSelected = summary.monthKey === selectedMonthKey;
              const label = formatMonthShortLabel(summary.lunarMonth, summary.isLeapMonth);
              return (
                <g key={`x-${summary.monthKey}`}>
                  {isCurrent ? (
                    <rect
                      x={cx - 28}
                      y={plotBottom + 10}
                      width={56}
                      height={20}
                      rx={8}
                      className="mf-flow-timeline__month-pill"
                    />
                  ) : null}
                  <text
                    x={cx}
                    y={plotBottom + 24}
                    textAnchor="middle"
                    className={[
                      "mf-flow-timeline__month-label",
                      isSelected ? "is-selected" : "",
                      isCurrent ? "is-current" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {tipSummary ? (
        <div
          className="mf-flow-timeline__tooltip"
          id={`${reactId}-tip`}
          role="status"
          data-testid="mf-flow-timeline-tooltip"
        >
          {tooltipLines(tipSummary).map((line, i) =>
            line === "" ? <br key={`b-${i}`} /> : <div key={`${i}-${line}`}>{line}</div>,
          )}
        </div>
      ) : null}
    </div>
  );
}
