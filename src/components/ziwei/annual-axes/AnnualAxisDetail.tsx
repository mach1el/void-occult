import type {
  AnnualAxisResult,
  AnnualAxisEvidence,
  AnnualAxisV08Evidence,
  AnnualAxisPalaceContributionTraceV08,
} from "@/lib/ziwei/analysis/modules/annual-axes";
import { ANNUAL_AXIS_BAND_LABEL_VI, ANNUAL_AXIS_LABEL_VI } from "./labels";
import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";
import {
  formatPalaceStars,
  isRelevantCooperatingPalace,
  shouldShowCoverage,
} from "./v08-display";

const CATEGORY_LABEL_VI: Record<AnnualAxisEvidence["category"], string> = {
  star: "Sao",
  mutagen: "Tứ Hóa",
  "focal-marker": "Điểm chú",
  "annual-focus": "Trọng tâm năm",
  interaction: "Tương tác",
};

const ROLE_LABEL_VI: Record<AnnualAxisEvidence["frameRole"], string> = {
  focus: "Bản cung",
  opposite: "Đối cung",
  trine: "Tam hợp",
};

const LAYER_LABEL_VI: Record<AnnualAxisEvidence["layer"], string> = {
  annual: "Lưu niên",
  "major-fortune": "Đại vận",
  "natal-activated": "Bản mệnh",
};

function EvidenceLine({ e }: { e: AnnualAxisEvidence }) {
  return (
    <li>
      <strong>{e.targetPalaceName}</strong> · {CATEGORY_LABEL_VI[e.category]} ·{" "}
      {ROLE_LABEL_VI[e.frameRole]} · {LAYER_LABEL_VI[e.layer]}
    </li>
  );
}

function formatWeightedEvidence(items: AnnualAxisV08Evidence[] | undefined): string {
  if (!items || items.length === 0) return "—";
  return items
    .map((e) => {
      const w = e.weightedContribution;
      const signed = w > 0 ? `+${w.toFixed(2)}` : w.toFixed(2);
      return `${e.exactMatchedStarName} (${signed})`;
    })
    .join(", ");
}

function v08ScoreStateLabel(
  scoreState: "scored" | "no-signal" | "balanced-signal" | "partial-data" | "unavailable",
  bandLabel: string,
): string {
  switch (scoreState) {
    case "no-signal":
      return "Chưa có tín hiệu";
    case "balanced-signal":
      return "Cân bằng tín hiệu";
    case "partial-data":
      return "Thiếu một phần dữ liệu";
    case "unavailable":
      return "Không đủ dữ liệu";
    case "scored":
      return bandLabel;
  }
}

function V08PalaceContribution({
  palace,
}: {
  palace: AnnualAxisPalaceContributionTraceV08;
}) {
  const positiveStars = formatPalaceStars(palace.matchedFacts, "positive");
  const negativeStars = formatPalaceStars(palace.matchedFacts, "negative");

  return (
    <li>
      <strong>{palace.palaceName}</strong>
      {palace.missingReason ? (
        <>
          <br />
          Thiếu dữ liệu: {palace.missingReason}
        </>
      ) : (
        <>
          {positiveStars ? (
            <>
              <br />
              Sao tốt: {positiveStars}
            </>
          ) : null}
          {negativeStars ? (
            <>
              <br />
              Sao xấu: {negativeStars}
            </>
          ) : null}
        </>
      )}
    </li>
  );
}

export interface AnnualAxisDetailProps {
  domain: AnnualAxisDomain;
  axis: AnnualAxisResult;
  onClose: () => void;
}

/**
 * Deterministic detail modal — no prediction prose.
 * V0.8 shows only palaces and stars that contribute to the score.
 */
export function AnnualAxisDetail({ domain, axis, onClose }: AnnualAxisDetailProps) {
  const label = ANNUAL_AXIS_LABEL_VI[domain];
  const isV08 = axis.engine === "v0.8";

  const relevantCooperating =
    isV08 && axis.scoreTrace?.formulaVersion === "v0.8-annual-palace-weighted-score"
      ? axis.scoreTrace.cooperating.filter(isRelevantCooperatingPalace)
      : [];

  const supportDrivers =
    isV08 && axis.status !== "unavailable" ? formatWeightedEvidence(axis.topSupportDriversV08) : null;
  const pressureDrivers =
    isV08 && axis.status !== "unavailable"
      ? formatWeightedEvidence(axis.topPressureDriversV08)
      : null;
  const showWeightedDrivers =
    (supportDrivers !== null && supportDrivers !== "—") ||
    (pressureDrivers !== null && pressureDrivers !== "—");

  return (
    <div className="annual-axis-detail" role="region" aria-label={`Chi tiết ${label}`}>
      <h4 className="annual-axis-detail__title">Chi tiết · {label}</h4>

      {isV08 && axis.scoreTrace?.formulaVersion === "v0.8-annual-palace-weighted-score" ? (
        <>
          {axis.status === "unavailable" ? (
            <>
              <p className="annual-axis-detail__band">Không đủ dữ liệu</p>
              <ul className="annual-axis-detail__list" aria-label="Lý do thiếu dữ liệu">
                <li>
                  Cung trọng tâm thiếu
                  {axis.scoreTrace.missingPrimaryReason
                    ? `: ${axis.scoreTrace.missingPrimaryReason}`
                    : ""}
                </li>
                {(axis.reasonCodes ?? []).map((code) => (
                  <li key={code}>{code}</li>
                ))}
                {shouldShowCoverage(axis.coverage) && axis.coverage ? (
                  <li>
                    Thiếu: {axis.coverage.missingPalaces.join(", ")}
                  </li>
                ) : null}
              </ul>
            </>
          ) : (
            <p className="annual-axis-detail__band">
              {v08ScoreStateLabel(
                axis.scoreTrace.scoreState,
                ANNUAL_AXIS_BAND_LABEL_VI[axis.band],
              )}{" "}
              · Điểm {axis.score.toFixed(1)}
            </p>
          )}

          {axis.status !== "unavailable" ? (
            <div className="annual-axis-detail__score-trace" aria-label="V0.8 palace mapping">
              <h6>Cung trọng tâm</h6>
              <ul className="annual-axis-detail__list">
                <V08PalaceContribution palace={axis.scoreTrace.primary} />
              </ul>

              {relevantCooperating.length > 0 ? (
                <>
                  <h6>Cung phối hợp</h6>
                  <ul className="annual-axis-detail__list">
                    {relevantCooperating.map((c) => (
                      <V08PalaceContribution key={`${c.role}-${c.palaceName}`} palace={c} />
                    ))}
                  </ul>
                </>
              ) : null}

              {showWeightedDrivers ? (
                <>
                  <h6>Tín hiệu nổi bật</h6>
                  <ul className="annual-axis-detail__list">
                    {supportDrivers !== "—" ? <li>Hỗ trợ: {supportDrivers}</li> : null}
                    {pressureDrivers !== "—" ? <li>Áp lực: {pressureDrivers}</li> : null}
                  </ul>
                </>
              ) : null}

              {axis.scoreTrace.isThaiTueHighlighted ? (
                <p className="annual-axis-detail__note">Lưu Thái Tuế nổi bật (×1.25)</p>
              ) : null}

              {shouldShowCoverage(axis.coverage) && axis.coverage ? (
                <p className="annual-axis-detail__note">
                  Thiếu dữ liệu một phần: {axis.coverage.missingPalaces.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : axis.engine === "v0.2" &&
        (axis.status === "available" || axis.status === "partial-data") ? (
        <>
          <p className="annual-axis-detail__band">
            {ANNUAL_AXIS_BAND_LABEL_VI[axis.band]} · Điểm {axis.score.toFixed(1)}
            {typeof axis.annualDelta === "number" ? (
              <>
                {" "}
                · Delta {axis.annualDelta >= 0 ? "+" : ""}
                {axis.annualDelta.toFixed(1)}
              </>
            ) : null}
          </p>

          <section className="annual-axis-detail__section">
            <h5>Trục cường độ / xung đột</h5>
            <ul>
              <li>Cường độ: {axis.intensity}</li>
              <li>Xung đột: {axis.conflict}</li>
            </ul>
          </section>

          <section className="annual-axis-detail__section">
            <h5>Hỗ trợ nổi bật</h5>
            <ul>
              {axis.topSupportDrivers.length === 0 ? (
                <li>—</li>
              ) : (
                axis.topSupportDrivers.map((e) => <EvidenceLine key={e.id} e={e} />)
              )}
            </ul>
          </section>

          <section className="annual-axis-detail__section">
            <h5>Áp lực nổi bật</h5>
            <ul>
              {axis.topPressureDrivers.length === 0 ? (
                <li>—</li>
              ) : (
                axis.topPressureDrivers.map((e) => <EvidenceLine key={e.id} e={e} />)
              )}
            </ul>
          </section>
        </>
      ) : (
        <section className="annual-axis-detail__section">
          <h5>Trạng thái</h5>
          <ul>
            {(axis.reasonCodes ?? []).length === 0 ? (
              <li>Chưa đủ dữ liệu</li>
            ) : (
              (axis.reasonCodes ?? []).map((code) => <li key={code}>{code}</li>)
            )}
          </ul>
        </section>
      )}

      <button
        type="button"
        className="annual-axis-detail__close"
        onClick={onClose}
        aria-label="Đóng chi tiết"
      >
        Đóng
      </button>
    </div>
  );
}
