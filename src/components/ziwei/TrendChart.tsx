import { useMemo, useState } from "react";
import type { TrendPoint } from "@/lib/ziwei/trend";
import "./trend-chart.css";

interface TrendChartProps {
  title: string;
  points: TrendPoint[];
  currentLabel: "Chính vận" | "Năm nay";
  onSelectPoint?: (point: TrendPoint) => void;
  selectedLabel?: string | null;
}

interface Pt {
  x: number;
  y: number;
}

function catmullRomPath(points: Pt[]): string {
  if (points.length === 0) return "";
  const first = points[0];
  if (!first) return "";
  if (points.length === 1) return `M ${first.x} ${first.y}`;
  const second = points[1];
  if (points.length === 2 && second) {
    return `M ${first.x} ${first.y} L ${second.x} ${second.y}`;
  }

  let path = `M ${first.x} ${first.y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

function areaPath(line: string, points: Pt[], baselineY: number): string {
  if (!points.length || !line) return "";
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return "";
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export function TrendChart({
  title,
  points,
  currentLabel,
  onSelectPoint,
  selectedLabel = null,
}: TrendChartProps) {
  const [showCat, setShowCat] = useState(true);
  const [showHung, setShowHung] = useState(true);

  const width = 640;
  const height = 260;
  const pad = { top: 28, right: 16, bottom: 36, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const geometry = useMemo(() => {
    const n = Math.max(points.length - 1, 1);
    const toX = (index: number) => pad.left + (index / n) * plotW;
    const toY = (value: number) => pad.top + (1 - value / 100) * plotH;

    const catPts = points.map((point, index) => ({
      x: toX(index),
      y: toY(point.cat),
    }));
    const hungPts = points.map((point, index) => ({
      x: toX(index),
      y: toY(point.hung),
    }));

    const labelStep =
      points.length > 16 ? 4 : points.length > 10 ? 2 : 1;

    return {
      toX,
      toY,
      baselineY: pad.top + plotH,
      catLine: catmullRomPath(catPts),
      hungLine: catmullRomPath(hungPts),
      catArea: areaPath(catmullRomPath(catPts), catPts, pad.top + plotH),
      hungArea: areaPath(catmullRomPath(hungPts), hungPts, pad.top + plotH),
      catPts,
      hungPts,
      labelStep,
      currentIndex: points.findIndex((point) => point.isCurrent),
    };
  }, [points, pad.left, pad.top, plotW, plotH]);

  if (!points.length) {
    return (
      <section className="trend-chart" aria-label={title}>
        <header className="trend-chart-head">
          <h3>{title}</h3>
        </header>
        <p className="trend-chart-empty">Chưa đủ dữ liệu để vẽ xu hướng.</p>
      </section>
    );
  }

  return (
    <section className="trend-chart" aria-label={title}>
      <header className="trend-chart-head">
        <h3>{title}</h3>
        <div className="trend-chart-toggles" role="group" aria-label="Lớp biểu đồ">
          <label className="trend-chart-toggle">
            <input
              type="checkbox"
              checked={showCat}
              onChange={(event) => setShowCat(event.target.checked)}
            />
            Cát
          </label>
          <label className="trend-chart-toggle">
            <input
              type="checkbox"
              checked={showHung}
              onChange={(event) => setShowHung(event.target.checked)}
            />
            Hung
          </label>
        </div>
      </header>

      <p className="trend-chart-disclaimer">
        Biểu đồ xu hướng — engine heuristic tất định, không phải định mệnh.
      </p>

      <details className="trend-chart-method">
        <summary>Xem cách tính</summary>
        <div className="trend-chart-method-body">
          <p>
            <strong>Cát</strong> đo cơ hội từ Hóa Lộc·Quyền·Khoa, lục cát hội và
            chính tinh miếu/vượng trong **tam phương tứ chính** của cung hạn; cộng cách
            cục cặp sao (Lộc Mã, Long–Kỵ, Vũ Tham mộ…). Đại vận và Lưu niên cùng
            khung nhìn này.
          </p>
          <p>
            <strong>Hung</strong> đo áp lực từ Hóa Kỵ, lục sát, chính tinh hãm,
            Tuần/Triệt và hung tinh vòng Thái Tuế — độc lập với Cát. Vùng địa
            chi điều chỉnh: Kỵ/Kình/Đà đắc mộ thì giảm hung; Lộc/Quyền/Khoa ở
            mộ bị hạn chế.
          </p>
          <p>
            Phase 3: Thai Tọa / Quang Quý / Phụ Cáo, Quốc Ấn·Đường Phù·Thiên
            Quan/Phúc/Trù, giải tinh, Long Phượng, vòng Trường Sinh (qua
            Tràng Sinh trên cung), và cặp Thai Tọa / Quang Quý.
          </p>
        </div>
      </details>

      <svg
        className="trend-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}. Cát và Hung theo mốc thời gian, thang 0 đến 100.`}
      >
        <title>{title}</title>

        {[0, 25, 50, 75, 100].map((tick) => {
          const y = geometry.toY(tick);
          return (
            <g key={tick}>
              <line
                className="trend-grid"
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
              />
              <text className="trend-axis-label" x={pad.left - 8} y={y + 3} textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}

        {showHung && (
          <>
            <path className="trend-area is-hung" d={geometry.hungArea} />
            <path className="trend-line is-hung" d={geometry.hungLine} fill="none" />
          </>
        )}
        {showCat && (
          <>
            <path className="trend-area is-cat" d={geometry.catArea} />
            <path className="trend-line is-cat" d={geometry.catLine} fill="none" />
          </>
        )}

        {geometry.currentIndex >= 0 && (
          <g className="trend-current">
            <line
              x1={geometry.toX(geometry.currentIndex)}
              x2={geometry.toX(geometry.currentIndex)}
              y1={pad.top}
              y2={geometry.baselineY}
            />
            <text
              x={geometry.toX(geometry.currentIndex)}
              y={pad.top - 8}
              textAnchor="middle"
            >
              {currentLabel}
            </text>
          </g>
        )}

        {points.map((point, index) => {
          if (index % geometry.labelStep !== 0 && !point.isCurrent) return null;
          return (
            <text
              key={`label-${point.label}`}
              className="trend-axis-label"
              x={geometry.toX(index)}
              y={height - 10}
              textAnchor="middle"
            >
              {point.label}
            </text>
          );
        })}

        {points.map((point, index) => {
          const x = geometry.toX(index);
          const active = selectedLabel === point.label;
          return (
            <g key={`hit-${point.label}`}>
              <rect
                className={`trend-hit${active ? " is-selected" : ""}`}
                x={x - plotW / Math.max(points.length * 2, 2)}
                y={pad.top}
                width={Math.max(plotW / points.length, 12)}
                height={plotH}
                onClick={() => onSelectPoint?.(point)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectPoint?.(point);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Mốc ${point.label}: Cát ${point.cat}, Hung ${point.hung}`}
              />
              {showCat && (
                <circle
                  className="trend-dot is-cat"
                  cx={x}
                  cy={geometry.toY(point.cat)}
                  r={active ? 4.5 : 3}
                />
              )}
              {showHung && (
                <circle
                  className="trend-dot is-hung"
                  cx={x}
                  cy={geometry.toY(point.hung)}
                  r={active ? 4.5 : 3}
                />
              )}
            </g>
          );
        })}
      </svg>
    </section>
  );
}
