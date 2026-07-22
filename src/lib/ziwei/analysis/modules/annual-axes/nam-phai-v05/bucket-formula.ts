/**
 * V0.5 bucket signed formula — intensity × polarity (not independent norm deltas).
 */

export interface BucketSignedInput {
  supportRaw: number;
  pressureRaw: number;
  evidenceScale: number;
  epsilon: number;
}

export interface BucketSignedResult {
  total: number;
  intensity: number;
  polarity: number;
  signed: number;
  supportRaw: number;
  pressureRaw: number;
}

export function computeBucketSigned(input: BucketSignedInput): BucketSignedResult {
  const { supportRaw, pressureRaw, evidenceScale, epsilon } = input;
  const total = supportRaw + pressureRaw;
  const intensity = 1 - Math.exp(-total / evidenceScale);
  const polarity =
    total > epsilon ? (supportRaw - pressureRaw) / (total + epsilon) : 0;
  const signed = intensity * polarity;

  return {
    total,
    intensity: clamp01(intensity),
    polarity: clampSigned(polarity),
    signed: clampSigned(signed),
    supportRaw,
    pressureRaw,
  };
}

export function computeSpatialSigned(
  directSigned: number,
  tp4cSigned: number,
  directBudget = 0.9,
  tp4cBudget = 0.1,
): {
  spatialSigned: number;
  directContribution: number;
  tp4cContribution: number;
} {
  const directContribution = directBudget * directSigned;
  const tp4cContribution = tp4cBudget * tp4cSigned;
  return {
    spatialSigned: directContribution + tp4cContribution,
    directContribution,
    tp4cContribution,
  };
}

export function computeActivationGate(annualActivationRaw: number, activationScale: number): number {
  if (!(annualActivationRaw > 0) || !(activationScale > 0)) return 0;
  return Math.tanh(annualActivationRaw / activationScale);
}

export function computeLatent(
  spatialSigned: number,
  activationGate: number,
  natalGain: number,
): number {
  return spatialSigned * activationGate * natalGain;
}

export function computeDomainScore(
  latent: number,
  domainScale: number,
  neutral = 50,
  amplitude = 38,
  minimum = 0,
  maximum = 100,
  precision = 1,
): number {
  if (!(domainScale > 0)) return neutral;
  const raw = neutral + amplitude * Math.tanh(latent / domainScale);
  const clamped = Math.min(maximum, Math.max(minimum, raw));
  const factor = 10 ** precision;
  return Math.round(clamped * factor) / factor;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function clampSigned(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(-1, n));
}
