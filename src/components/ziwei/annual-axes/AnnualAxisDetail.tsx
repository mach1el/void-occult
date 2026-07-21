import type { AnnualAxisResult, AnnualAxisEvidence } from "@/lib/ziwei/analysis/modules/annual-axes";
import { ANNUAL_AXIS_BAND_LABEL_VI, ANNUAL_AXIS_LABEL_VI } from "./labels";
import type { AnnualAxisDomain } from "@/lib/ziwei/analysis";

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

export interface AnnualAxisDetailProps {
  domain: AnnualAxisDomain;
  axis: AnnualAxisResult;
  onClose: () => void;
}

/**
 * Deterministic detail modal — no prediction prose. Renders the axis's
 * band, top drivers, and provenance versions verbatim from the analyzer
 * output. When the axis is unavailable, only reason codes are shown.
 */
export function AnnualAxisDetail({ domain, axis, onClose }: AnnualAxisDetailProps) {
  const label = ANNUAL_AXIS_LABEL_VI[domain];

  return (
    <div className="annual-axis-detail" role="region" aria-label={`Chi tiết ${label}`}>
      <h4 className="annual-axis-detail__title">Chi tiết · {label}</h4>

      {axis.status === "available" ? (
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

          {axis.routing ? (
            <section className="annual-axis-detail__section" data-annual-routing>
              <h5>Định tuyến đầu tàu năm</h5>
              <ul>
                <li>Routing: {axis.routing.routing.toFixed(4)}</li>
                {typeof axis.routedStrength === "number" ? (
                  <li>Routed strength: {axis.routedStrength.toFixed(4)}</li>
                ) : (
                  <>
                    <li>Head share: {axis.routing.headShare.toFixed(4)}</li>
                    <li>Local share: {axis.routing.localShare.toFixed(4)}</li>
                  </>
                )}
              </ul>
            </section>
          ) : null}

          {axis.natalResponse && axis.scoreTrace?.formulaVersion !== "v0.5-calibrated-core" && axis.scoreTrace?.formulaVersion !== "v0.6-annual-dominant-core" ? (
            <section className="annual-axis-detail__section" data-natal-response>
              <h5>Đáp ứng bản mệnh (biên độ, không phải điểm tốt/xấu)</h5>
              <ul>
                <li>Sensitivity: {axis.natalResponse.sensitivity.toFixed(3)}</li>
                <li>Resilience: {axis.natalResponse.resilience.toFixed(3)}</li>
                <li>Amplitude: {axis.natalResponse.amplitudeMultiplier.toFixed(3)}</li>
              </ul>
            </section>
          ) : null}

          {axis.scoreTrace?.formulaVersion === "v0.6-annual-dominant-core" ? (
            <div className="annual-axis-detail__score-trace" aria-label="V0.6 score reconstruction">
              <h5 className="annual-axis-detail__subtitle">V0.6 · Tái dựng điểm</h5>
              <ul className="annual-axis-detail__list">
                <li>Ứng viên: {axis.scoreTrace.candidateId}</li>
                <li>Hệ số lớp năm: {axis.scoreTrace.signedLayerFactors.annual.toFixed(2)}</li>
                <li>Hệ số lớp bản mệnh kích hoạt: {axis.scoreTrace.signedLayerFactors.natalActivated.toFixed(2)}</li>
                <li>Hệ số đại vận: {axis.scoreTrace.signedLayerFactors.majorFortune.toFixed(2)}</li>
                <li>Kích hoạt năm: {axis.scoreTrace.activationGate.toFixed(4)}</li>
                <li>Độ nhạy bản mệnh: {axis.scoreTrace.natalGain.toFixed(4)}</li>
                <li>Tín hiệu không gian: {axis.scoreTrace.spatialSigned.toFixed(4)}</li>
                <li>Tín hiệu hiệu lực: {axis.scoreTrace.latent.toFixed(4)}</li>
                <li>Thang chuẩn hóa miền: {axis.scoreTrace.domainScale.toFixed(4)}</li>
                <li>Điểm tuyệt đối: {axis.scoreTrace.absoluteScore}</li>
              </ul>
            </div>
          ) : null}
          {axis.scoreTrace?.formulaVersion === "v0.5-calibrated-core" ? (
            <section className="annual-axis-detail__section" data-v05-score-trace>
              <h5>Thành phần điểm V0.5 (xác định, không dự đoán)</h5>
              <ul>
                <li>Kích hoạt năm: {axis.scoreTrace.activationGate.toFixed(4)}</li>
                <li>Tổng kích hoạt: {axis.scoreTrace.annualActivationRaw.toFixed(4)}</li>
                <li>Độ nhạy bản mệnh: {axis.scoreTrace.natalGain.toFixed(4)}</li>
                <li>Tín hiệu không gian: {axis.scoreTrace.spatialSigned.toFixed(4)}</li>
                <li>Tín hiệu hiệu lực: {axis.scoreTrace.latent.toFixed(4)}</li>
                <li>Thang chuẩn hóa miền: {axis.scoreTrace.domainScale.toFixed(4)}</li>
              </ul>
            </section>
          ) : null}

          {axis.channels ? (
            <section className="annual-axis-detail__section" data-annual-channels>
              <h5>Bốn kênh delta</h5>
              <ul>
                <li>
                  Global: {axis.channels.globalAnnualClimate.signed.toFixed(3)}
                </li>
                <li>
                  Routed head: {axis.channels.routedHeadImpact.signed.toFixed(3)}
                </li>
                <li>
                  Direct domain: {axis.channels.directDomainImpact.signed.toFixed(3)}
                </li>
                <li>
                  Major background: {axis.channels.majorFortuneBackground.signed.toFixed(3)}
                </li>
              </ul>
            </section>
          ) : null}

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
            {axis.reasonCodes.length === 0 ? (
              <li>Chưa đủ dữ liệu</li>
            ) : (
              axis.reasonCodes.map((code) => <li key={code}>{code}</li>)
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
