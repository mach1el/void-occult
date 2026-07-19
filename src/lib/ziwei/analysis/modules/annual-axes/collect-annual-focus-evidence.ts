import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import type { AnnualAxisDomain } from "../../contracts/annual-axes";
import type { AnnualAxesKnowledgeV0 } from "../../knowledge/annual-axes";
import type { AnnualDomainAnchorFrame } from "./collect-domain-frames";
import type { AnnualFocusFrame } from "./build-annual-focus-frame";
import type { AnnualAxisEvidence, AnnualAxesDiagnostics } from "./types";

const ARCH_SOURCE_ID = "SRC-AA-ARCH-001";

interface CollectAnnualFocusEvidenceInput {
  chart: ChartData;
  domain: AnnualAxisDomain;
  domainFrames: AnnualDomainAnchorFrame[];
  focusFrame: AnnualFocusFrame;
  school: ZiweiSchool;
  annualKnowledge: AnnualAxesKnowledgeV0;
  diagnostics: AnnualAxesDiagnostics;
}

/**
 * Activation-only annual focus overlay. Restrictions per spec:
 *  - Runs only on the intersection of each domain frame node and the
 *    school's focus frame (`palaceIndex` equality). The overlay never
 *    reaches outside a domain's own TP4C ring.
 *  - Emits `activation`-only axes — the `support`/`pressure`/`stability`
 *    channels are hard-zeroed even if the focal marker record declares
 *    values there (defensive: today all annual-focal-markers are
 *    activation-only, but we still enforce the invariant here).
 *  - Uses the school's *primary* focal marker's activation as the base
 *    axes (Tiểu Hạn for Nam Phái, Lưu Thái Tuế for Trung Châu) so the
 *    focus overlay has stable, calibrated intensity. `frameRoleWeights`
 *    from the scoring profile modulate contribution by role.
 */
export function collectAnnualFocusEvidence(
  input: CollectAnnualFocusEvidenceInput,
): AnnualAxisEvidence[] {
  const { chart, domain, domainFrames, focusFrame, school, annualKnowledge, diagnostics } = input;
  const out: AnnualAxisEvidence[] = [];

  if (focusFrame.nodes.length === 0) {
    diagnostics.missingAnnualFocusFrameNodes.push(`${domain}:focus-frame-empty`);
    return out;
  }

  const policyProfile = annualKnowledge.schoolDomainPolicy.profiles[school];
  // The overlay only fires when the school's `primaryAnnualFocus` has a
  // dedicated marker in the focal-markers catalog. Nam Phái's small-limit
  // has one; Trung Châu's annual-menh does not — TC's annual Mệnh
  // activation is already covered by the existing focal-marker path
  // (annual-tai-tue), so re-running the overlay for TC would double-count
  // (and break the Trung Châu numeric regression lock). Trung Châu still
  // receives an `annualFocus` summary (populated by the analyzer via the
  // focus resolver + focus frame builder) — the overlay is purely a
  // scoring hook, not a display hook.
  const focusMarkerByMode: Record<string, string> = {
    "small-limit": "small-limit",
  };
  const primaryMarkerId = focusMarkerByMode[policyProfile.primaryAnnualFocus];
  if (!primaryMarkerId) return out;
  const primaryMarker = annualKnowledge.focalMarkers.records.find(
    (r) => r.markerId === primaryMarkerId,
  );
  if (!primaryMarker) return out;

  // Guardrail: activation-only. If a future edit to the JSON pushed
  // support/pressure/stability values into a focal marker, we still zero
  // them here so the focus overlay can't leak into non-activation channels.
  const baseActivationAxes = {
    support: 0,
    pressure: 0,
    stability: 0,
    activation: primaryMarker.axes.activation,
  };

  const roleWeights = annualKnowledge.scoringProfile.frameRoleWeights;

  const focusIndexes = new Set(focusFrame.nodes.map((n) => n.palaceIndex));

  // Track (anchorFrame, palaceIndex) to avoid double-emitting when the
  // same physical palace appears in more than one anchor's TP4C ring —
  // the aggregator's cross-anchor dedup will keep the strongest anyway,
  // but we emit only one row per anchor for cleanliness.
  const seenPerAnchor = new Set<string>();

  for (const frame of domainFrames) {
    for (const node of frame.nodes) {
      if (!focusIndexes.has(node.palaceIndex)) continue;
      const dedupKey = `${frame.anchorPalaceName}|${node.palaceIndex}`;
      if (seenPerAnchor.has(dedupKey)) continue;
      seenPerAnchor.add(dedupKey);

      const palace = chart.palaces.find((p) => p.index === node.palaceIndex);
      if (!palace) continue;

      const roleWeight = roleWeights[node.role];
      const activation = baseActivationAxes.activation * roleWeight;
      const axes = {
        support: 0,
        pressure: 0,
        stability: 0,
        activation,
      };

      const physicalFactId = `annual-focus:${focusFrame.focusPalaceIndex}:${node.palaceIndex}`;

      out.push({
        id: `ann-axis:${domain}:annual:annual-focus:${physicalFactId}:${node.role}`,
        domain,
        layer: "annual",
        category: "annual-focus",
        physicalFactId,
        ruleId: `RULE-AA-FOCUS-OVERLAY-${school.toUpperCase()}-V02`,
        targetPalaceIndex: palace.index,
        targetPalaceName: palace.name,
        targetAnnualPalaceName: node.annualPalaceName,
        frameRole: node.role,
        anchorPalaceName: frame.anchorPalaceName,
        stackingGroup: "annual-focus",
        rawAxes: axes,
        effectiveWeight: frame.domainAnchorWeight,
        weightedAxes: axes,
        factIds: [physicalFactId],
        sourceIds: [ARCH_SOURCE_ID],
        knowledgeStatus: "experimental",
      });
    }
  }

  return out;
}
