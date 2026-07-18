import { useMemo, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  analyzeAllPalaces,
  type PalaceEvidence,
  type PalaceOverviewBand,
  type PalaceOverviewResult,
} from "@/lib/ziwei/analysis/modules/palace-overview";
import {
  formatContribution,
  palaceDomainHint,
  renderExplanationKey,
} from "./explanation-renderer";
import "./palace-overview-radar.css";

const CX = 150;
const CY = 150;
const R = 112;

/** Short, unambiguous radar labels for the 12 palace names. */
const PALACE_SHORT_LABEL: Record<string, string> = {
  "Mệnh": "Mệnh",
  "Phụ Mẫu": "P.Mẫu",
  "Phúc Đức": "Phúc",
  "Điền Trạch": "Đ.Trạch",
  "Quan Lộc": "Q.Lộc",
  "Nô Bộc": "Nô Bộc",
  "Thiên Di": "T.Di",
  "Tật Ách": "T.Ách",
  "Tài Bạch": "T.Bạch",
  "Tử Tức": "Tử Tức",
  "Phu Thê": "Phu Thê",
  "Huynh Đệ": "H.Đệ",
};

const BAND_LABEL: Record<PalaceOverviewBand, string> = {
  low: "Yếu",
  guarded: "Cần thận trọng",
  balanced: "Cân bằng",
  supportive: "Thuận lợi",
  strong: "Mạnh",
};

function palaceShortLabel(name: string): string {
  return PALACE_SHORT_LABEL[name] ?? name.slice(0, 4);
}

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
        <p>Không tải được dữ liệu tri thức Tử Vi cho module này.</p>
      </div>
    );
  }

  const active = selected ?? hovered;
  const scores = ordered.map((r) => r.score);

  function togglePalace(result: PalaceOverviewResult) {
    setSelected((cur) => (cur?.palaceIndex === result.palaceIndex ? null : result));
  }

  return (
    <div className="palace-overview-radar" data-module="palace-overview">
      <div className="palace-overview-radar__head">
        <h3 className="palace-overview-radar__title">Cấu trúc 12 cung</h3>
        <span className="palace-overview-radar__badge">Experimental</span>
      </div>
      <p className="palace-overview-radar__disclaimer">
        Điểm thể hiện mô hình phân tích cấu trúc lá số, không phải kết luận định
        mệnh. Chi tiết mỗi cung chỉ hiển thị sao thuộc khung Tam Phương Tứ Chính
        (bản cung, xung chiếu, tam hợp) của cung được chọn.
      </p>

      <div className="palace-overview-radar__body">
        <div className="palace-overview-radar__svg-wrap">
          <svg
            className="palace-overview-radar__svg"
            viewBox="0 0 300 300"
            role="img"
            aria-label="Radar cấu trúc 12 cung"
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
                  tabIndex={0}
                  role="button"
                  aria-pressed={selected?.palaceIndex === result.palaceIndex}
                  aria-label={`${result.palaceName} · ${result.palaceBranch} — điểm ${result.score}, ${BAND_LABEL[result.band]}`}
                  onMouseEnter={() => setHovered(result)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(result)}
                  onBlur={() => setHovered(null)}
                  onClick={() => togglePalace(result)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePalace(result);
                    }
                  }}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill="transparent"
                    pointerEvents="all"
                  />
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
                    {palaceShortLabel(result.palaceName)}
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
            <p className="palace-overview-radar__tooltip-summary">
              Điểm {active.score} · {BAND_LABEL[active.band]}
              <br />
              {formatContribution(active.rawAxes)}
            </p>
          </div>
        ) : (
          <p className="palace-overview-radar__tooltip">
            Di chuột hoặc chọn một cung để xem chi tiết (dùng Tab + Enter trên
            bàn phím).
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

function classifyGroup(e: PalaceEvidence): "A" | "B" | "C" | "D" | "E" | "F" | "G" | null {
  if (e.category === "major-star") {
    return e.palaceRole === "focus" && !e.borrowedFromOpposite ? "A" : "B";
  }
  if (e.category === "transformation") return "C";
  if (e.category === "minor-star-family") {
    return e.axes.support >= e.axes.pressure ? "D" : "E";
  }
  if (e.category === "chang-sheng" || e.category === "void-environment") return "F";
  if (e.category === "structural-rule") return "G";
  return null;
}

function groupByFamilyLabel(items: PalaceEvidence[]): Array<[string, PalaceEvidence[]]> {
  const map = new Map<string, PalaceEvidence[]>();
  for (const e of items) {
    const key = e.familyLabel ?? "Khác";
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return [...map.entries()];
}

function EvidenceLine({ e }: { e: PalaceEvidence }) {
  return (
    <li key={e.id}>
      {e.label} ({formatContribution(e.axes)}) —{" "}
      {renderExplanationKey(e.explanationKey, e.label)}
    </li>
  );
}

function DriverList({ drivers }: { drivers: PalaceEvidence[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? drivers : drivers.slice(0, 3);
  return (
    <>
      <ul>
        {shown.length === 0 ? (
          <li>—</li>
        ) : (
          shown.map((e) => <EvidenceLine key={e.id} e={e} />)
        )}
      </ul>
      {drivers.length > 3 ? (
        <button
          type="button"
          className="palace-overview-detail__expand"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Thu gọn" : `Xem thêm (+${drivers.length - 3})`}
        </button>
      ) : null}
    </>
  );
}

function PalaceOverviewDetail({
  result,
  onClose,
}: {
  result: PalaceOverviewResult;
  onClose: () => void;
}) {
  const groupA = result.allEvidence.filter((e) => classifyGroup(e) === "A");
  const groupB = result.allEvidence.filter((e) => classifyGroup(e) === "B");
  const groupC = result.allEvidence.filter((e) => classifyGroup(e) === "C");
  const groupD = result.allEvidence.filter((e) => classifyGroup(e) === "D");
  const groupE = result.allEvidence.filter((e) => classifyGroup(e) === "E");
  const groupF = result.allEvidence.filter((e) => classifyGroup(e) === "F");
  const groupG = result.allEvidence.filter((e) => classifyGroup(e) === "G");

  return (
    <div className="palace-overview-detail">
      <h4 className="palace-overview-detail__title">
        Chi tiết · {result.palaceName}
      </h4>
      <p className="palace-overview-detail__band">
        {BAND_LABEL[result.band]} · Điểm {result.score}
      </p>

      <section className="palace-overview-detail__section">
        <h5>A. Chính tinh tại cung</h5>
        <ul>
          {groupA.length === 0 ? <li>—</li> : groupA.map((e) => <EvidenceLine key={e.id} e={e} />)}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>B. Chính tinh hội chiếu</h5>
        <ul>
          {groupB.length === 0 ? <li>—</li> : groupB.map((e) => <EvidenceLine key={e.id} e={e} />)}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>C. Tứ Hóa gốc</h5>
        <ul>
          {groupC.length === 0 ? <li>—</li> : groupC.map((e) => <EvidenceLine key={e.id} e={e} />)}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>D. Phụ tinh hỗ trợ</h5>
        {groupD.length === 0 ? (
          <ul><li>—</li></ul>
        ) : (
          groupByFamilyLabel(groupD).map(([label, items]) => (
            <div key={label} className="palace-overview-detail__family-group">
              <p className="palace-overview-detail__family-label">{label}</p>
              <ul>
                {items.map((e) => <EvidenceLine key={e.id} e={e} />)}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="palace-overview-detail__section">
        <h5>E. Phụ tinh áp lực</h5>
        {groupE.length === 0 ? (
          <ul><li>—</li></ul>
        ) : (
          groupByFamilyLabel(groupE).map(([label, items]) => (
            <div key={label} className="palace-overview-detail__family-group">
              <p className="palace-overview-detail__family-label">{label}</p>
              <ul>
                {items.map((e) => <EvidenceLine key={e.id} e={e} />)}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="palace-overview-detail__section">
        <h5>F. Trường Sinh / môi trường</h5>
        <ul>
          {groupF.length === 0 ? <li>—</li> : groupF.map((e) => <EvidenceLine key={e.id} e={e} />)}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>G. Cách cục</h5>
        <ul>
          {groupG.length === 0 ? <li>—</li> : groupG.map((e) => <EvidenceLine key={e.id} e={e} />)}
        </ul>
      </section>

      <section className="palace-overview-detail__section">
        <h5>Top hỗ trợ</h5>
        <DriverList drivers={result.topSupportDrivers} />
      </section>

      <section className="palace-overview-detail__section">
        <h5>Top áp lực</h5>
        <DriverList drivers={result.topPressureDrivers} />
      </section>

      {result.contextOnlyStars.length > 0 ? (
        <details className="palace-overview-detail__section palace-overview-detail__context-only">
          <summary>H. Sao ngữ cảnh chưa chấm điểm</summary>
          <ul>
            {result.contextOnlyStars.map((s, i) => (
              <li key={`${s.name}-${s.role}-${i}`}>
                {s.name} · {s.role}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <details className="palace-overview-detail__section palace-overview-detail__meta-details">
        <summary>Thông tin mô hình</summary>
        <p className="palace-overview-detail__meta">
          Band {result.band} · completeness {result.evidenceCompleteness} ·{" "}
          {result.profileId} · {result.version} · {result.school}
        </p>
      </details>

      <button type="button" className="palace-overview-detail__close" onClick={onClose}>
        Đóng
      </button>
    </div>
  );
}
