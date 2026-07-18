import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  absEffect,
  analyzeAllPalaces,
  type PalaceAnnotation,
  type PalaceEvidence,
  type PalaceOverviewBand,
  type PalaceOverviewResult,
} from "@/lib/ziwei/analysis/modules/palace-overview";
import {
  formatAxisContribution,
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
  low: "Cẩn trọng",
  guarded: "Cẩn trọng",
  balanced: "Cân bằng",
  supportive: "Thuận lợi",
  strong: "Mạnh",
};

/** V1.2 — pair/group annotation scope → Vietnamese group label. */
const SCOPE_LABEL: Record<string, string> = {
  "same-palace": "Đồng cung",
  "opposite-link": "Đối cung",
  "trine-link": "Tam hợp",
  tp4c: "Toàn tam phương tứ chính",
};

/** V1.2 — small non-score Mệnh/Thân suffix for the radar point label. */
function menhThanSuffix(result: PalaceOverviewResult): string {
  if (result.isMenh && result.isThan) return " (M·T)";
  if (result.isMenh) return " (M)";
  if (result.isThan) return " (T)";
  return "";
}

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
  // V1.2.1: store only the selection key, never the analysis object itself —
  // a stale PalaceOverviewResult would otherwise keep showing the previous
  // chart/school's scores until the user manually reselected (see PR #81
  // review thread). Deriving from `results` each render means a chart/school
  // change can never leave stale data on screen.
  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState<number | null>(null);
  const [hoveredPalaceIndex, setHoveredPalaceIndex] = useState<number | null>(null);
  const pointRefs = useRef(new Map<number, SVGGElement>());

  useEffect(() => {
    setSelectedPalaceIndex(null);
    setHoveredPalaceIndex(null);
  }, [chart, school]);

  const selected =
    selectedPalaceIndex == null
      ? null
      : (results.find((r) => r.palaceIndex === selectedPalaceIndex) ?? null);
  const hovered =
    hoveredPalaceIndex == null
      ? null
      : (results.find((r) => r.palaceIndex === hoveredPalaceIndex) ?? null);

  const ordered = useMemo(() => {
    if (!analysis.knowledgeValid || results.length === 0) return [];
    const byBranch = chart.palaces.map(
      (p) => results.find((r) => r.palaceIndex === p.index)!,
    );
    // Mệnh always sits at the top of the radar (index 0 → 12 o'clock),
    // regardless of which branch it lands on for this chart — rotate the
    // ring rather than reorder scores.
    const menhIndex = byBranch.findIndex((r) => r.palaceName === "Mệnh");
    if (menhIndex <= 0) return byBranch;
    return [...byBranch.slice(menhIndex), ...byBranch.slice(0, menhIndex)];
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

  function togglePalace(palaceIndex: number) {
    setSelectedPalaceIndex((cur) => (cur === palaceIndex ? null : palaceIndex));
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
                  ref={(el) => {
                    if (el) pointRefs.current.set(result.palaceIndex, el);
                    else pointRefs.current.delete(result.palaceIndex);
                  }}
                  className={`palace-overview-radar__point${isActive ? " is-active" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedPalaceIndex === result.palaceIndex}
                  aria-label={`${result.palaceName} · ${result.palaceBranch}${menhThanSuffix(result)} — điểm ${result.score}, ${BAND_LABEL[result.band]}`}
                  onMouseEnter={() => setHoveredPalaceIndex(result.palaceIndex)}
                  onMouseLeave={() => setHoveredPalaceIndex(null)}
                  onFocus={() => setHoveredPalaceIndex(result.palaceIndex)}
                  onBlur={() => setHoveredPalaceIndex(null)}
                  onClick={() => togglePalace(result.palaceIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePalace(result.palaceIndex);
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
                    {menhThanSuffix(result)}
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
          semanticStatus={analysis.semanticStatus}
          onClose={() => {
            const palaceIndex = selectedPalaceIndex;
            setSelectedPalaceIndex(null);
            if (palaceIndex != null) pointRefs.current.get(palaceIndex)?.focus();
          }}
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

function groupByScope(
  annotations: PalaceAnnotation[],
): Array<[string, PalaceAnnotation[]]> {
  const map = new Map<string, PalaceAnnotation[]>();
  for (const a of annotations) {
    const key = a.metadata?.scope ?? "tp4c";
    const list = map.get(key) ?? [];
    list.push(a);
    map.set(key, list);
  }
  return [...map.entries()];
}

function normalizeForDedup(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

interface TransformTargetGroup {
  key: string;
  label: string;
  bullets: string[];
}

/**
 * V1.2.1 — one transformation fact can match several semantic rules (e.g.
 * both "communication-friction" and "documentation-pressure" for the same
 * Hóa Kỵ → target). Group by the shared transformation fact id (factIds[0])
 * so the UI renders one card per fact instead of a repeated header, with
 * deduplicated bullet text. No annotations are dropped from engine output —
 * this is presentation-only grouping.
 */
function groupTransformTargetAnnotations(
  annotations: PalaceAnnotation[],
): TransformTargetGroup[] {
  const map = new Map<string, { label: string; bullets: Set<string> }>();
  const order: string[] = [];
  for (const a of annotations) {
    const key = a.factIds[0] ?? a.id;
    if (!map.has(key)) {
      map.set(key, { label: a.label, bullets: new Set() });
      order.push(key);
    }
    map.get(key)!.bullets.add(normalizeForDedup(renderExplanationKey(a.explanationKey, a.label)));
  }
  return order.map((key) => {
    const entry = map.get(key)!;
    return { key, label: entry.label, bullets: [...entry.bullets] };
  });
}

/** V1.2 — trace a domain-projection annotation back to the evidence it
 * projects from, so the UI can tell major/transform subjects (shown in
 * full) apart from minor-star subjects (capped to top 3 by effect). */
function subjectEvidenceFor(
  annotation: PalaceAnnotation,
  allEvidence: PalaceEvidence[],
): PalaceEvidence | undefined {
  const factId = annotation.factIds[0];
  if (!factId) return undefined;
  return allEvidence.find((e) => e.factIds.includes(factId));
}

function cloneProjectionAnnotation(
  annotation: PalaceAnnotation,
): PalaceAnnotation {
  return {
    ...annotation,
    tags: [...annotation.tags],
    factIds: [...annotation.factIds],
    palaceIndexes: [...annotation.palaceIndexes],
    palaceRoles: [...annotation.palaceRoles],
    sourceIds: [...annotation.sourceIds],
    metadata: annotation.metadata
      ? {
          ...annotation.metadata,
          targetTraits: annotation.metadata.targetTraits
            ? [...annotation.metadata.targetTraits]
            : undefined,
          contributorStarNames:
            annotation.metadata.contributorStarNames
              ? [...annotation.metadata.contributorStarNames]
              : undefined,
          contributorEvidenceIds:
            annotation.metadata.contributorEvidenceIds
              ? [...annotation.metadata.contributorEvidenceIds]
              : undefined,
        }
      : undefined,
  };
}

function DomainProjectionList({
  annotations,
  allEvidence,
}: {
  annotations: PalaceAnnotation[];
  allEvidence: PalaceEvidence[];
}) {
  const dedupedAnnotations = useMemo(() => {
    const seen = new Set<string>();
    const deduped: PalaceAnnotation[] = [];
    for (const a of annotations) {
      const normalized = a.label
        .normalize("NFC")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("vi");
      if (!seen.has(normalized)) {
        seen.add(normalized);
        deduped.push(cloneProjectionAnnotation(a));
      } else {
        const existing = deduped.find(
          (d) =>
            d.label.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi") ===
            normalized
        );
        if (existing) {
          existing.factIds = [...new Set([...existing.factIds, ...a.factIds])];
          existing.sourceIds = [...new Set([...existing.sourceIds, ...a.sourceIds])];
          if (existing.metadata && a.metadata) {
            existing.metadata.contributorStarNames = [
              ...new Set([
                ...(existing.metadata.contributorStarNames || []),
                ...(a.metadata.contributorStarNames || []),
              ]),
            ];
            existing.metadata.contributorEvidenceIds = [
              ...new Set([
                ...(existing.metadata.contributorEvidenceIds || []),
                ...(a.metadata.contributorEvidenceIds || []),
              ]),
            ];
            existing.metadata.contributorCount =
              existing.metadata.contributorEvidenceIds?.length || 0;
          }
        }
      }
    }
    return deduped;
  }, [annotations]);

  const majorTransform = dedupedAnnotations.filter((a) => {
    const subject = subjectEvidenceFor(a, allEvidence);
    return subject?.category === "major-star" || subject?.category === "transformation";
  });
  const minor = [...dedupedAnnotations]
    .filter((a) => subjectEvidenceFor(a, allEvidence)?.category === "minor-star-family")
    .sort(
      (a, b) =>
        absEffect(subjectEvidenceFor(b, allEvidence)?.axes ?? emptyAxesFallback) -
        absEffect(subjectEvidenceFor(a, allEvidence)?.axes ?? emptyAxesFallback),
    );

  const [expanded, setExpanded] = useState(false);
  const shownMinor = expanded ? minor : minor.slice(0, 3);

  return (
    <>
      <ul>
        {majorTransform.length === 0 && minor.length === 0 ? (
          <li>—</li>
        ) : (
          [...majorTransform, ...shownMinor].map((a) => <li key={a.id}>{a.label}</li>)
        )}
      </ul>
      {minor.length > 3 ? (
        <button
          type="button"
          className="palace-overview-detail__expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Thu gọn" : `Xem thêm sao phụ (+${minor.length - 3})`}
        </button>
      ) : null}
    </>
  );
}

const emptyAxesFallback = { support: 0, pressure: 0, stability: 0, activation: 0 };

function EvidenceLine({ e }: { e: PalaceEvidence }) {
  return (
    <li key={e.id}>
      {e.label} ({formatContribution(e.axes)}) —{" "}
      {renderExplanationKey(e.explanationKey, e.label)}
    </li>
  );
}

/** V1.2.1 — compact minor-star row showing only the one relevant axis
 * (support OR pressure), never all four, per the independent grouping. */
function MinorAxisLine({
  e,
  axis,
}: {
  e: PalaceEvidence;
  axis: "support" | "pressure";
}) {
  return (
    <li key={e.id}>
      {e.label} · {formatAxisContribution(axis, e.axes[axis])} —{" "}
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
          aria-expanded={expanded}
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
  semanticStatus,
  onClose,
}: {
  result: PalaceOverviewResult;
  semanticStatus: "available" | "unavailable";
  onClose: () => void;
}) {
  const groupA = result.allEvidence.filter((e) => classifyGroup(e) === "A");
  const groupB = result.allEvidence.filter((e) => classifyGroup(e) === "B");
  const groupC = result.allEvidence.filter((e) => classifyGroup(e) === "C");
  const groupF = result.allEvidence.filter((e) => classifyGroup(e) === "F");
  const groupG = result.allEvidence.filter((e) => classifyGroup(e) === "G");
  const voidEnvironment = groupF.filter((e) => e.category === "void-environment");
  const supportMinors = result.allEvidence.filter(
    (e) => e.category === "minor-star-family" && e.axes.support > 0,
  );
  const pressureMinors = result.allEvidence.filter(
    (e) => e.category === "minor-star-family" && e.axes.pressure > 0,
  );

  const menhThanAnnotations = result.annotations.filter(
    (a) => a.category === "menh-than",
  );
  // Basic "Cung Mệnh"/"Cung Thân" are already fully represented by the
  // header badges — this section only needs the special cases.
  const specialMenhThanAnnotations = menhThanAnnotations.filter(
    (a) =>
      a.explanationKey === "context.menh-than.same-palace" ||
      a.explanationKey === "context.menh-void.than-reference",
  );
  const minorPairAnnotations = result.annotations.filter(
    (a) => a.category === "minor-pair",
  );
  const pairAnnotationsByScope = groupByScope(minorPairAnnotations);
  const transformTargetAnnotations = result.annotations.filter(
    (a) => a.category === "transformation-target",
  );
  const domainProjectionAnnotations = result.annotations.filter(
    (a) => a.category === "domain-projection",
  );
  const transformTargetGroups = groupTransformTargetAnnotations(transformTargetAnnotations);

  return (
    <div className="palace-overview-detail">
      <h4 className="palace-overview-detail__title">
        Chi tiết · {result.palaceName}
        {result.isMenh ? (
          <span className="palace-overview-detail__badge">Mệnh</span>
        ) : null}
        {result.isThan ? (
          <span className="palace-overview-detail__badge">Thân</span>
        ) : null}
      </h4>
      <p className="palace-overview-detail__band">
        {BAND_LABEL[result.band]} · Điểm {result.score}
      </p>

      <section className="palace-overview-detail__section">
        <h5>Cấu trúc lõi</h5>
        <ul>
          {groupA.length === 0 ? <li>—</li> : groupA.map((e) => <EvidenceLine key={e.id} e={e} />)}
        </ul>
        <p className="palace-overview-detail__meta">
          Tứ Hóa gốc:{" "}
          {groupC.length === 0 ? "—" : groupC.map((e) => e.label).join(", ")}
        </p>
        {voidEnvironment.length > 0 ? (
          <ul>
            {voidEnvironment.map((e) => (
              <li key={e.id}>{renderExplanationKey(e.explanationKey, e.label)}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="palace-overview-detail__section">
        <h5>Hỗ trợ nổi bật</h5>
        <DriverList drivers={result.topSupportDrivers} />
      </section>

      <section className="palace-overview-detail__section">
        <h5>Áp lực nổi bật</h5>
        <DriverList drivers={result.topPressureDrivers} />
      </section>

      {semanticStatus === "available" ? (
        <>
          {specialMenhThanAnnotations.length > 0 ? (
            <section className="palace-overview-detail__section">
              <h5>Mệnh–Thân</h5>
              <ul>
                {specialMenhThanAnnotations.map((a) => (
                  <li key={a.id}>{renderExplanationKey(a.explanationKey, a.label)}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {minorPairAnnotations.length > 0 ? (
            <section className="palace-overview-detail__section">
              <h5>Liên kết phụ tinh</h5>
              <p className="palace-overview-detail__semantic-note">
                Ngữ nghĩa cấu trúc, chưa cộng điểm V1.2.
              </p>
              {pairAnnotationsByScope.map(([scope, items]) => (
                <div key={scope} className="palace-overview-detail__family-group">
                  <p className="palace-overview-detail__family-label">
                    {SCOPE_LABEL[scope] ?? scope}
                  </p>
                  <ul>
                    {items.map((a) => (
                      <li key={a.id}>{a.label}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}

          {transformTargetGroups.length > 0 ? (
            <section className="palace-overview-detail__section">
              <h5>Tứ Hóa theo sao nhận Hóa</h5>
              {transformTargetGroups.map((group) => (
                <div key={group.key} className="palace-overview-detail__family-group">
                  <p className="palace-overview-detail__family-label">{group.label}</p>
                  <ul>
                    {group.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}

          {domainProjectionAnnotations.length > 0 ? (
            <section className="palace-overview-detail__section">
              <h5>Biểu hiện tại cung</h5>
              <DomainProjectionList
                annotations={domainProjectionAnnotations}
                allEvidence={result.allEvidence}
              />
            </section>
          ) : null}
        </>
      ) : (
        <p className="palace-overview-detail__semantic-note">
          Không thể tải phần diễn giải ngữ nghĩa. Điểm cấu trúc vẫn được giữ
          nguyên.
        </p>
      )}

      <details className="palace-overview-detail__section palace-overview-detail__full-evidence">
        <summary>Xem toàn bộ bằng chứng</summary>

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
          {supportMinors.length === 0 ? (
            <ul><li>—</li></ul>
          ) : (
            groupByFamilyLabel(supportMinors).map(([label, items]) => (
              <div key={label} className="palace-overview-detail__family-group">
                <p className="palace-overview-detail__family-label">{label}</p>
                <ul>
                  {items.map((e) => <MinorAxisLine key={e.id} e={e} axis="support" />)}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="palace-overview-detail__section">
          <h5>E. Phụ tinh áp lực</h5>
          {pressureMinors.length === 0 ? (
            <ul><li>—</li></ul>
          ) : (
            groupByFamilyLabel(pressureMinors).map(([label, items]) => (
              <div key={label} className="palace-overview-detail__family-group">
                <p className="palace-overview-detail__family-label">{label}</p>
                <ul>
                  {items.map((e) => <MinorAxisLine key={e.id} e={e} axis="pressure" />)}
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

        {result.contextOnlyStars.length > 0 ? (
          <section className="palace-overview-detail__section">
            <h5>H. Sao ngữ cảnh chưa chấm điểm</h5>
            <ul>
              {result.contextOnlyStars.map((s, i) => (
                <li key={`${s.name}-${s.role}-${i}`}>
                  {s.name} · {s.role}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </details>

      <details className="palace-overview-detail__section palace-overview-detail__meta-details">
        <summary>Thông tin mô hình</summary>
        <p className="palace-overview-detail__meta">
          Mức đánh giá {BAND_LABEL[result.band]} · Độ đầy đủ dữ liệu{" "}
          {result.evidenceCompleteness} · {result.profileId} · {result.school}
        </p>
        <p className="palace-overview-detail__meta">
          Phiên bản contract {result.versions.contractVersion} · engine{" "}
          {result.versions.engineVersion} · knowledge{" "}
          {result.versions.knowledgeVersion}
        </p>
        <p className="palace-overview-detail__meta">
          Trạng thái semantic:{" "}
          {semanticStatus === "available" ? "Có sẵn" : "Không khả dụng"}
        </p>
      </details>

      <button type="button" className="palace-overview-detail__close" onClick={onClose}>
        Đóng
      </button>
    </div>
  );
}
