import { useMemo, useState } from "react";
import type { TrendPoint } from "@/lib/ziwei/trend-score";
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
  const [showTaiLoc, setShowTaiLoc] = useState(true);
  const [showThachThuc, setShowThachThuc] = useState(true);

  const width = 640;
  const height = 260;
  const pad = { top: 28, right: 16, bottom: 36, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const geometry = useMemo(() => {
    const n = Math.max(points.length - 1, 1);
    const toX = (index: number) => pad.left + (index / n) * plotW;
    const toY = (value: number) => pad.top + (1 - value / 100) * plotH;

    const taiPts = points.map((point, index) => ({
      x: toX(index),
      y: toY(point.taiLoc),
    }));
    const thachPts = points.map((point, index) => ({
      x: toX(index),
      y: toY(point.thachThuc),
    }));

    const labelStep =
      points.length > 16 ? 4 : points.length > 10 ? 2 : 1;

    return {
      toX,
      toY,
      baselineY: pad.top + plotH,
      taiLine: catmullRomPath(taiPts),
      thachLine: catmullRomPath(thachPts),
      taiArea: areaPath(catmullRomPath(taiPts), taiPts, pad.top + plotH),
      thachArea: areaPath(catmullRomPath(thachPts), thachPts, pad.top + plotH),
      taiPts,
      thachPts,
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
              checked={showTaiLoc}
              onChange={(event) => setShowTaiLoc(event.target.checked)}
            />
            Tài lộc
          </label>
          <label className="trend-chart-toggle">
            <input
              type="checkbox"
              checked={showThachThuc}
              onChange={(event) => setShowThachThuc(event.target.checked)}
            />
            Thách thức
          </label>
        </div>
      </header>

      <p className="trend-chart-disclaimer">
        Biểu đồ xu hướng — mô hình tham khảo, không phải định mệnh.
      </p>

      <details className="trend-chart-method">
        <summary>Xem cách tính</summary>
        <div className="trend-chart-method-body">
          <p>
            <strong>Tài lộc</strong> đo cơ hội từ Lưu/ĐV Hóa Lộc·Quyền·Khoa, cát
            tinh hội và chính tinh miếu/vượng tại cung trọng.
          </p>
          <p>
            <strong>Thách thức</strong> đo rủi ro từ Hóa Kỵ, sát tinh, chính tinh
            hãm, Tuần/Triệt và hung tinh vòng Thái Tuế — độc lập, không trừ Tài lộc.
          </p>
          <p>
            Bấm một mốc trên đường cong để mở bài làm chi tiết (breakdown) của
            engine.
          </p>
        </div>
      </details>

      <svg
        className="trend-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}. Tài lộc và Thách thức theo mốc thời gian, thang 0 đến 100.`}
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

        {showThachThuc && (
          <>
            <path className="trend-area is-thach" d={geometry.thachArea} />
            <path className="trend-line is-thach" d={geometry.thachLine} fill="none" />
          </>
        )}
        {showTaiLoc && (
          <>
            <path className="trend-area is-tai" d={geometry.taiArea} />
            <path className="trend-line is-tai" d={geometry.taiLine} fill="none" />
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
                aria-label={`Mốc ${point.label}: Tài lộc ${point.taiLoc}, Thách thức ${point.thachThuc}`}
              />
              {showTaiLoc && (
                <circle
                  className="trend-dot is-tai"
                  cx={x}
                  cy={geometry.toY(point.taiLoc)}
                  r={active ? 4.5 : 3}
                />
              )}
              {showThachThuc && (
                <circle
                  className="trend-dot is-thach"
                  cx={x}
                  cy={geometry.toY(point.thachThuc)}
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
