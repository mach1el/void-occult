import { useMemo } from "react";
import { ElementStrength } from "@/lib/bazi/element-strength";
import { ELEMENTS } from "@/lib/bazi/elements";
import { ELEMENT_COLOR_VAR } from "./element-colors";

interface ElementRadarProps {
  strength: ElementStrength;
  size?: number;
}

export function ElementRadar({ strength, size = 200 }: ElementRadarProps) {
  const center = size / 2;
  const radius = size * 0.4; // Để dành không gian cho nhãn
  
  // Các đỉnh của ngũ giác (0 độ ở trục Y âm - hướng lên trên)
  // Thứ tự tương sinh: Mộc -> Hỏa -> Thổ -> Kim -> Thủy
  // Góc: 0, 72, 144, 216, 288 (độ)
  // Chuyển sang radian = độ * PI / 180
  const getPoint = (angleDeg: number, distance: number) => {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: center + distance * Math.cos(angleRad),
      y: center + distance * Math.sin(angleRad)
    };
  };

  const points = useMemo(() => {
    const maxVal = Math.max(...Object.values(strength.normalized), 20); // Ít nhất là 20% để scale
    return ELEMENTS.map((el, i) => {
      const angle = i * 72;
      const val = strength.normalized[el];
      // Normalize distance so that the maximum value touches the outer circle (or use absolute scale 0-100 if we want it comparable across charts)
      // Thường radar chart % thì 0-100, nhưng Bát tự hiếm khi có hành 100%. 
      // Ta scale theo hành lớn nhất để dễ nhìn dáng hình, hoặc scale max=50%.
      const scale = 50; // max distance is 50%
      const r = radius * Math.min(val / scale, 1.0);
      return { el, angle, val, pt: getPoint(angle, r), outer: getPoint(angle, radius) };
    });
  }, [strength.normalized, radius, center]);

  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.pt.x},${p.pt.y}`).join(" ") + " Z";

  return (
    <div className="relative" style={{ width: size, height: size }} aria-label="Biểu đồ Ngũ Hành">
      <svg width={size} height={size} className="overflow-visible">
        {/* Lưới nền (3 vòng) */}
        {[0.33, 0.66, 1].map((level) => {
          const bgPoints = points.map(p => getPoint(p.angle, radius * level));
          const bgPath = bgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") + " Z";
          return (
            <path 
              key={level} 
              d={bgPath} 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.1)" 
              strokeWidth="1" 
            />
          );
        })}

        {/* Trục từ tâm ra */}
        {points.map(p => (
          <line 
            key={`axis-${p.el}`} 
            x1={center} 
            y1={center} 
            x2={p.outer.x} 
            y2={p.outer.y} 
            stroke="rgba(255, 255, 255, 0.1)" 
            strokeWidth="1" 
          />
        ))}

        {/* Data Polygon */}
        <path 
          d={polygonPath} 
          fill="rgba(255, 255, 255, 0.15)" 
          stroke="var(--color-gold)" 
          strokeWidth="2"
          style={{ transition: "all 0.5s ease" }}
        />

        {/* Điểm ở các đỉnh dữ liệu */}
        {points.map(p => (
          <circle 
            key={`pt-${p.el}`}
            cx={p.pt.x}
            cy={p.pt.y}
            r={3}
            fill={ELEMENT_COLOR_VAR[p.el]}
          />
        ))}

        {/* Nhãn */}
        {points.map(p => {
          const isDM = p.el === strength.dayMasterElement;
          
          let textAnchor: "start" | "middle" | "end" = "middle";
          let xOffset = 0;
          let yOffset = 0;

          if (p.angle === 0) { // Mộc (Top)
            textAnchor = "middle";
            yOffset = -12;
          } else if (p.angle === 72) { // Hỏa (Top Right)
            textAnchor = "start";
            xOffset = 10;
            yOffset = -5;
          } else if (p.angle === 144) { // Thổ (Bottom Right)
            textAnchor = "start";
            xOffset = 10;
            yOffset = 8;
          } else if (p.angle === 216) { // Kim (Bottom Left)
            textAnchor = "end";
            xOffset = -10;
            yOffset = 8;
          } else if (p.angle === 288) { // Thủy (Top Left)
            textAnchor = "end";
            xOffset = -10;
            yOffset = -5;
          }

          const labelPt = p.outer;

          return (
            <g key={`lbl-${p.el}`} transform={`translate(${labelPt.x + xOffset}, ${labelPt.y + yOffset})`}>
              <text
                x="0"
                y="-4"
                textAnchor={textAnchor}
                className="text-xs font-bold"
                fill={ELEMENT_COLOR_VAR[p.el]}
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
              >
                {p.el}
              </text>
              <text
                x="0"
                y="10"
                textAnchor={textAnchor}
                className="text-[10px]"
                fill="rgba(255,255,255,0.7)"
              >
                {p.val}%
              </text>
              {isDM && (
                <text
                  x="0"
                  y="-18"
                  textAnchor={textAnchor}
                  className="text-[9px] uppercase tracking-wide"
                  fill="var(--paper)"
                >
                  Nhật Chủ
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
