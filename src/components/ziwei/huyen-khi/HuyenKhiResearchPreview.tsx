import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type { ChartData, School } from "@/types/chart";
import {
  buildHuyenKhiPreview,
  HUYEN_KHI_DIMENSION_IDS,
  type HuyenKhiDimensionId,
  type HuyenKhiPreviewPalace,
  type HuyenKhiPreviewResult,
} from "@/lib/ziwei/analysis/modules/huyen-khi-preview";
import "./huyen-khi-research-preview.css";

const MINOR_STAR_DEFAULT_LIMIT = 8;

const DIMENSION_LABEL_VI: Record<HuyenKhiDimensionId, string> = {
  capacity: "Sức chứa",
  coherence: "Tính kết nối",
  expression: "Khả năng biểu hiện",
  regulation: "Khả năng điều tiết",
  tendency: "Khuynh hướng",
};

const DIMENSION_DEF_VI: Record<HuyenKhiDimensionId, string> = {
  capacity: "Khả năng duy trì và chứa đựng lực cấu trúc tại cung.",
  coherence: "Mức độ các thành phần tại cung phối hợp hoặc kéo ngược nhau.",
  expression: "Mức độ cấu trúc tại cung có thể biểu hiện ra ngoài hay bị cản trở.",
  regulation: "Khả năng kiềm chế, điều hòa hoặc chuyển hóa các yếu tố gây nhiễu.",
  tendency: "Nhãn định hướng định tính của toàn cấu trúc; không phải điểm tốt hoặc xấu.",
};

/**
 * Stable identity for the natal chart only — excludes annualYear/flowBase
 * and any other temporal display input, so palace selection survives
 * changing the viewed year without resetting to Mệnh.
 */
function natalIdentityKey(chart: ChartData, school: School): string {
  return [
    school,
    chart.solar.year,
    chart.solar.month,
    chart.solar.day,
    chart.timeZone,
    chart.birthHourBranch,
    chart.yearStem,
    chart.yearBranch,
    chart.menhIndex,
    chart.thanIndex,
    chart.cuc.number,
  ].join(":");
}

export interface HuyenKhiResearchPreviewProps {
  chart: ChartData;
  school: School;
  /** Optional precomputed result for tests / parent memoization. */
  result?: HuyenKhiPreviewResult;
}

function palaceButtonLabel(palace: HuyenKhiPreviewPalace): string {
  const tags: string[] = [];
  if (palace.isMenh) tags.push("M");
  if (palace.isThan) tags.push("T");
  if (palace.isVoChinhDieu) tags.push("VCD");
  const suffix = tags.length > 0 ? ` · ${tags.join("")}` : "";
  return `${palace.palaceName}${suffix}`;
}

/**
 * Natal-only Huyền Khí Research Preview. No scores, no evaluator states.
 */
export function HuyenKhiResearchPreview({
  chart,
  school,
  result: resultProp,
}: HuyenKhiResearchPreviewProps) {
  const preview = useMemo(() => {
    if (resultProp) return resultProp;
    return buildHuyenKhiPreview(chart, { school });
  }, [chart, school, resultProp]);

  const menhIndex = useMemo(() => {
    const menh = preview.palaces.find((p) => p.isMenh);
    return menh?.palaceIndex ?? preview.palaces[0]?.palaceIndex ?? 0;
  }, [preview]);

  const [selectedPalaceIndex, setSelectedPalaceIndex] = useState(menhIndex);
  const [minorsExpanded, setMinorsExpanded] = useState(false);
  const [minorsOpen, setMinorsOpen] = useState(false);
  const [dimsOpen, setDimsOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);

  const natalKey = useMemo(() => natalIdentityKey(chart, school), [chart, school]);

  useEffect(() => {
    setSelectedPalaceIndex(menhIndex);
    setMinorsExpanded(false);
    setMinorsOpen(false);
    setDimsOpen(false);
    setResearchOpen(false);
    // Only natal chart identity (or school) resets the selection — a
    // change to annualYear/flowBase alone must preserve it.
  }, [natalKey, menhIndex]);

  const selected =
    preview.palaces.find((p) => p.palaceIndex === selectedPalaceIndex) ??
    preview.palaces.find((p) => p.isMenh) ??
    null;

  function selectPalace(index: number) {
    setSelectedPalaceIndex(index);
    setMinorsExpanded(false);
  }

  function onPalaceKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPalace(index);
    }
  }

  const visibleMinors = selected
    ? minorsExpanded
      ? selected.minorStars
      : selected.minorStars.slice(0, MINOR_STAR_DEFAULT_LIMIT)
    : [];
  const hiddenMinorCount = selected
    ? Math.max(0, selected.minorStars.length - MINOR_STAR_DEFAULT_LIMIT)
    : 0;

  return (
    <section
      className="huyen-khi-preview"
      data-module="huyen-khi"
      data-mode="research-preview"
      aria-label="Huyền Khí Research Preview"
    >
      <header className="huyen-khi-preview__head">
        <h3 className="huyen-khi-preview__title">Huyền Khí</h3>
        <span className="huyen-khi-preview__badge">Research Preview</span>
        <p className="huyen-khi-preview__subtitle">
          Bản xem trước cấu trúc khí của 12 cung
        </p>
      </header>

      <p className="huyen-khi-preview__disclaimer" role="note">
        Đây là bản xem trước dữ liệu cấu trúc, chưa phải kết luận Huyền Khí và
        không phải dự đoán sự kiện.
      </p>
      <p className="huyen-khi-preview__natal-note">
        Module này chỉ đọc nguyên cục; thay đổi năm xem không làm thay đổi kết
        quả.
      </p>

      {preview.status === "unavailable" ? (
        <p className="huyen-khi-preview__unavailable">
          Không đủ dữ liệu nguyên cục để xem trước.
        </p>
      ) : (
        <>
          <div
            className="huyen-khi-preview__palaces"
            role="listbox"
            aria-label="Chọn cung"
          >
            {preview.palaces.map((palace) => {
              const selectedNow = palace.palaceIndex === selectedPalaceIndex;
              return (
                <button
                  key={palace.palaceIndex}
                  type="button"
                  role="option"
                  aria-selected={selectedNow}
                  className={
                    selectedNow
                      ? "huyen-khi-preview__palace is-selected"
                      : "huyen-khi-preview__palace"
                  }
                  onClick={() => selectPalace(palace.palaceIndex)}
                  onKeyDown={(e) => onPalaceKeyDown(e, palace.palaceIndex)}
                >
                  {palaceButtonLabel(palace)}
                </button>
              );
            })}
          </div>

          {selected ? (
            <div
              className="huyen-khi-preview__detail"
              data-palace-index={selected.palaceIndex}
            >
              <section className="huyen-khi-preview__block">
                <h4>Nền cung</h4>
                <ul>
                  <li>
                    {selected.palaceName} · {selected.stem ?? "—"} {selected.branch}
                  </li>
                  <li>
                    {selected.isMenh ? "Mệnh" : null}
                    {selected.isMenh && selected.isThan ? " · " : null}
                    {selected.isThan ? "Thân" : null}
                    {!selected.isMenh && !selected.isThan ? "—" : null}
                  </li>
                  <li>Trường Sinh: {selected.changShengStage ?? "—"}</li>
                  <li>
                    Vô Chính Diệu: {selected.isVoChinhDieu ? "Có" : "Không"}
                  </li>
                </ul>
              </section>

              <section className="huyen-khi-preview__block">
                <h4>Chính tinh</h4>
                {selected.majorStars.length === 0 ? (
                  <p>Không có chính tinh tọa thủ.</p>
                ) : (
                  <ul>
                    {selected.majorStars.map((s) => (
                      <li key={s.factId}>
                        {s.canonicalStarName}
                        {s.brightness ? ` · ${s.brightness}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="huyen-khi-preview__block">
                <h4>Tứ Hóa gốc</h4>
                {selected.natalTransformations.length === 0 ? (
                  <p>Không có Tứ Hóa gốc tại cung.</p>
                ) : (
                  <ul>
                    {selected.natalTransformations.map((t) => (
                      <li key={t.factId}>
                        Hóa {t.transformation} · {t.targetStar}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="huyen-khi-preview__block">
                <h4>Tuần / Triệt</h4>
                {selected.voidMarkers.length === 0 ? (
                  <p>Không có Tuần/Triệt tại cung.</p>
                ) : (
                  <ul>
                    {selected.voidMarkers.map((v) => (
                      <li key={v.factId}>{v.voidType}</li>
                    ))}
                  </ul>
                )}
              </section>

              {selected.isVoChinhDieu ? (
                <section className="huyen-khi-preview__block" data-borrowed-majors>
                  <h4>Tham chiếu đối cung</h4>
                  <p className="huyen-khi-preview__hint">
                    Chính tinh tại đối cung (tham chiếu cấu trúc, không hệ số).
                  </p>
                  {selected.borrowedMajorStars.length === 0 ? (
                    <p>Đối cung không có chính tinh để tham chiếu.</p>
                  ) : (
                    <ul>
                      {selected.borrowedMajorStars.map((s) => (
                        <li key={s.factId}>
                          {s.canonicalStarName}
                          {s.brightness ? ` · ${s.brightness}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}

              <details
                className="huyen-khi-preview__collapse"
                open={minorsOpen}
                onToggle={(e) => setMinorsOpen(e.currentTarget.open)}
                data-minors-collapsed={!minorsOpen ? "true" : "false"}
              >
                <summary>Phụ tinh tại cung ({selected.minorStars.length})</summary>
                {selected.minorStars.length === 0 ? (
                  <p>—</p>
                ) : (
                  <>
                    <ul data-minor-list>
                      {visibleMinors.map((s) => (
                        <li key={s.factId}>
                          {s.canonicalStarName}
                          {s.brightness ? ` · ${s.brightness}` : ""}
                        </li>
                      ))}
                    </ul>
                    {!minorsExpanded && hiddenMinorCount > 0 ? (
                      <button
                        type="button"
                        className="huyen-khi-preview__more"
                        onClick={() => setMinorsExpanded(true)}
                      >
                        Hiện thêm {hiddenMinorCount} phụ tinh
                      </button>
                    ) : null}
                  </>
                )}
              </details>

              <details
                className="huyen-khi-preview__collapse"
                open={dimsOpen}
                onToggle={(e) => setDimsOpen(e.currentTarget.open)}
                data-dimensions-collapsed={!dimsOpen ? "true" : "false"}
              >
                <summary>Khung đánh giá Huyền Khí</summary>
                <ul className="huyen-khi-preview__dimensions">
                  {HUYEN_KHI_DIMENSION_IDS.map((id) => (
                    <li key={id} data-dimension={id}>
                      <strong>{DIMENSION_LABEL_VI[id]}</strong>
                      <span className="huyen-khi-preview__dim-state">Chưa đánh giá</span>
                      <p>{DIMENSION_DEF_VI[id]}</p>
                      <p className="huyen-khi-preview__dim-reason">
                        Bộ đánh giá biểu tượng chưa được kích hoạt vì chưa đạt
                        cổng kiểm chứng chuyên gia.
                      </p>
                    </li>
                  ))}
                </ul>
              </details>

              <details
                className="huyen-khi-preview__collapse"
                open={researchOpen}
                onToggle={(e) => setResearchOpen(e.currentTarget.open)}
              >
                <summary>Thông tin nghiên cứu</summary>
                <ul>
                  <li>Mode: {preview.mode}</li>
                  <li>Evaluator: {preview.evaluatorStatus}</li>
                  <li>
                    Versions: contract {preview.versions.contractVersion} ·
                    adapter {preview.versions.adapterVersion} · copy{" "}
                    {preview.versions.copyVersion}
                  </li>
                  <li>School: {preview.school}</li>
                </ul>
              </details>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
