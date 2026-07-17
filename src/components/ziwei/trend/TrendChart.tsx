import { useMemo, useState } from "react";
import type { TrendPoint } from "@/lib/ziwei/trend";
import "./trend-chart.css";

interface TrendChartProps {
  title: string;
  points: TrendPoint[];
  currentLabel: "Chính vận" | "Tháng nay";
  onSelectPoint?: (point: TrendPoint) => void;
  selectedLabel?: string | null;
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
    const slot = plotW / Math.max(points.length, 1);
    const toX = (index: number) => pad.left + index * slot + slot / 2;
    const toY = (value: number) => pad.top + (1 - value / 100) * plotH;

    // Một cột / mốc: Cát và Hung chồng cùng x + width.
    const barW = Math.max(Math.min(slot - 8, 28), 6);

    const labelStep =
      points.length > 16 ? 4 : points.length > 12 ? 2 : 1;

    return {
      toX,
      toY,
      baselineY: pad.top + plotH,
      slot,
      barW,
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
          <label className="trend-chart-toggle is-cat">
            <input
              type="checkbox"
              checked={showCat}
              onChange={(event) => setShowCat(event.target.checked)}
            />
            Cát
          </label>
          <label className="trend-chart-toggle is-hung">
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
            cục cặp sao (Lộc Mã, Long–Kỵ, Vũ Tham mộ…). Đại vận theo từng đại hạn
            (không tính sao lưu niên); Lưu niên theo từng tháng âm — mỗi tháng
            xếp lớp Tứ Hóa riêng của tháng (lưu nguyệt, theo can tháng) cùng Tứ
            Hóa năm và gốc.
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
          <p>
            <strong>Ám tinh</strong>: Cự Môn (ám tinh chủ) gặp Hóa Kỵ đồng
            cung/xung/tam hợp cộng thêm hung "ám thượng gia ám"; Thiên
            Khốc–Thiên Hư (cặp cố định xung chiếu nhau) giao hội cộng hung
            mất mát/u uất — cả hai độc lập với phần Hóa Kỵ/hãm địa đã tính ở
            trên, không trùng lặp.
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

        {points.map((point, index) => {
          const cx = geometry.toX(index);
          const barX = cx - geometry.barW / 2;
          const catY = geometry.toY(point.cat);
          const hungY = geometry.toY(point.hung);
          const active = selectedLabel === point.label;
          // Cùng cột: lớp cao hơn vẽ trước (đậm), lớp thấp hơn vẽ sau (nhạt + viền).
          // Ẩn 1 lớp → lớp còn lại luôn đậm.
          const bothShown = showCat && showHung;
          const catStrong = !bothShown || point.cat >= point.hung;
          const hungStrong = !bothShown || point.hung >= point.cat;
          type LayerKey = "cat" | "hung";
          const layers: Array<{
            key: LayerKey;
            value: number;
            y: number;
            strong: boolean;
          }> = [];
          if (showCat) {
            layers.push({
              key: "cat",
              value: point.cat,
              y: catY,
              strong: catStrong,
            });
          }
          if (showHung) {
            layers.push({
              key: "hung",
              value: point.hung,
              y: hungY,
              strong: hungStrong,
            });
          }
          layers.sort((a, b) => b.value - a.value);

          return (
            <g key={`bar-${point.label}`} data-slot={point.label}>
              {layers.map((layer) => (
                <rect
                  key={`${point.label}-${layer.key}`}
                  data-layer={layer.key}
                  data-strength={layer.strong ? "strong" : "weak"}
                  className={`trend-bar is-${layer.key} ${layer.strong ? "is-strong" : "is-weak"}${active ? " is-selected" : ""}`}
                  x={barX}
                  y={layer.y}
                  width={geometry.barW}
                  height={Math.max(geometry.baselineY - layer.y, 0)}
                  rx={2}
                />
              ))}
            </g>
          );
        })}

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
            <rect
              key={`hit-${point.label}`}
              className={`trend-hit${active ? " is-selected" : ""}`}
              x={x - geometry.slot / 2}
              y={pad.top}
              width={geometry.slot}
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
          );
        })}
      </svg>
    </section>
  );
}
