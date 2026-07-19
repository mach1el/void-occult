import { describe, expect, it } from "vitest";
import { loadAnnualAxesKnowledgeV04NamPhai } from "../../../knowledge/annual-axes/v0.4";
import { aggregateNamPhaiV04Channels } from "../nam-phai-v04/aggregate-channels";
import { normalizeAnnualDeltaV04 } from "../nam-phai-v04/normalize-delta";
import type { AnnualAxisEvidence, AnnualChannelSummary } from "../types";

/**
 * V0.4.1 corrective prompt §5 — proves every configured multiplier is
 * applied exactly once end-to-end. Uses a linearity argument: if a
 * multiplier `m` is applied exactly once, doubling `m` must exactly double
 * the linear output; if applied twice (or squared), doubling `m` would
 * roughly quadruple it instead. This is a stronger, harder-to-fake proof
 * than asserting a single fixed numeric expectation.
 */

function emptyChannel(): AnnualChannelSummary {
  return {
    supportRaw: 0,
    pressureRaw: 0,
    activationRaw: 0,
    supportNorm: 0,
    pressureNorm: 0,
    signed: 0,
    evidenceIds: [],
  };
}

const loaded = loadAnnualAxesKnowledgeV04NamPhai();
if (!loaded.ok) throw new Error("v0.4.1 knowledge invalid");
const knowledge = loaded.knowledge;

describe("Annual Axes V0.4.1 · routedStrength applied exactly once (§5)", () => {
  it("doubling routedStrength exactly doubles effectiveDelta (linear ⇒ single application)", () => {
    const channels = {
      globalAnnualClimate: emptyChannel(),
      routedHeadImpact: { ...emptyChannel(), signed: 1 },
      directDomainImpact: emptyChannel(),
      majorFortuneBackground: emptyChannel(),
    };
    const natalResponse = { sensitivity: 1, resilience: 1, amplitudeMultiplier: 1, provenance: [] };
    const rawAxes = { support: 0, pressure: 0, stability: 0, activation: 0 };

    const base = normalizeAnnualDeltaV04({
      channels,
      routedStrength: 0.4,
      natalResponse,
      rawAxes,
      knowledge,
    });
    const doubled = normalizeAnnualDeltaV04({
      channels,
      routedStrength: 0.8,
      natalResponse,
      rawAxes,
      knowledge,
    });

    expect(base.effectiveDelta).not.toBe(0);
    expect(doubled.effectiveDelta).toBeCloseTo(base.effectiveDelta * 2, 10);
  });

  it("routing=0 zeroes the routed-head contribution entirely, independent of channel signed value", () => {
    const channels = {
      globalAnnualClimate: emptyChannel(),
      routedHeadImpact: { ...emptyChannel(), signed: 1 },
      directDomainImpact: emptyChannel(),
      majorFortuneBackground: emptyChannel(),
    };
    const natalResponse = { sensitivity: 1, resilience: 1, amplitudeMultiplier: 1, provenance: [] };
    const rawAxes = { support: 0, pressure: 0, stability: 0, activation: 0 };

    const result = normalizeAnnualDeltaV04({ channels, routedStrength: 0, natalResponse, rawAxes, knowledge });
    expect(result.effectiveDelta).toBe(0);
  });
});

function makeEvidence(overrides: Partial<AnnualAxisEvidence>): AnnualAxisEvidence {
  return {
    id: "test",
    domain: "health",
    layer: "annual",
    category: "star",
    physicalFactId: "star:0:Test",
    ruleId: "RULE-TEST",
    targetPalaceIndex: 0,
    targetPalaceName: "Mệnh",
    targetAnnualPalaceName: "Mệnh",
    frameRole: "focus",
    anchorPalaceName: "Mệnh",
    stackingGroup: "test-group",
    rawAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    effectiveWeight: 1,
    weightedAxes: { support: 1, pressure: 0, stability: 0, activation: 1 },
    confidenceWeight: 1,
    factIds: ["star:0:Test"],
    sourceIds: ["SRC-TEST"],
    knowledgeStatus: "experimental",
    activationPaths: [
      {
        triggerId: "annual-moving-star-palace",
        channel: "direct-domain",
        geometryWeight: 1,
        affinityWeight: 1,
        effectivePathWeight: 1,
        boundedPathWeight: 1,
      },
    ],
    ...overrides,
  };
}

describe("Annual Axes V0.4.1 · aggregate-channels.ts multiplier accounting (§6)", () => {
  it("doubling confidenceWeight exactly doubles that evidence's channel contribution", () => {
    const base = aggregateNamPhaiV04Channels([makeEvidence({ confidenceWeight: 1 })], knowledge);
    const doubled = aggregateNamPhaiV04Channels([makeEvidence({ confidenceWeight: 2 })], knowledge);

    expect(base.channels.directDomainImpact.supportRaw).not.toBe(0);
    expect(doubled.channels.directDomainImpact.supportRaw).toBeCloseTo(
      base.channels.directDomainImpact.supportRaw * 2,
      10,
    );
  });

  it("doubling a path's boundedPathWeight exactly doubles that path's channel contribution", () => {
    const base = aggregateNamPhaiV04Channels(
      [
        makeEvidence({
          activationPaths: [
            {
              triggerId: "annual-moving-star-palace",
              channel: "direct-domain",
              geometryWeight: 1,
              affinityWeight: 0.5,
              effectivePathWeight: 0.5,
              boundedPathWeight: 0.5,
            },
          ],
        }),
      ],
      knowledge,
    );
    const doubled = aggregateNamPhaiV04Channels(
      [
        makeEvidence({
          activationPaths: [
            {
              triggerId: "annual-moving-star-palace",
              channel: "direct-domain",
              geometryWeight: 1,
              affinityWeight: 1,
              effectivePathWeight: 1,
              boundedPathWeight: 1,
            },
          ],
        }),
      ],
      knowledge,
    );

    expect(doubled.channels.directDomainImpact.supportRaw).toBeCloseTo(
      base.channels.directDomainImpact.supportRaw * 2,
      10,
    );
  });

  it("a fact with paths on two different channels contributes its own bounded weight independently to each — no cross-channel split", () => {
    const evidence = makeEvidence({
      activationPaths: [
        {
          triggerId: "annual-head-tp4c",
          channel: "routed-head",
          geometryWeight: 1,
          affinityWeight: 1,
          effectivePathWeight: 1,
          boundedPathWeight: 1,
        },
        {
          triggerId: "head-domain-frame-intersection",
          channel: "direct-domain",
          geometryWeight: 1,
          affinityWeight: 1,
          effectivePathWeight: 1,
          boundedPathWeight: 1,
        },
      ],
    });
    const single = aggregateNamPhaiV04Channels(
      [makeEvidence({ activationPaths: evidence.activationPaths?.slice(0, 1) })],
      knowledge,
    );
    const both = aggregateNamPhaiV04Channels([evidence], knowledge);

    // Each channel receives the SAME full contribution whether or not the
    // fact also touches another channel — no proportional split across
    // channels (the pre-V0.4.1 "combine then split" defect would have
    // halved each channel's share here).
    expect(both.channels.routedHeadImpact.supportRaw).toBeCloseTo(
      single.channels.routedHeadImpact.supportRaw,
      10,
    );
    expect(both.channels.directDomainImpact.supportRaw).toBeCloseTo(
      both.channels.routedHeadImpact.supportRaw,
      10,
    );
  });
});
