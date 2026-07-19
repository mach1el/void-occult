import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import type { AnnualAxesAuditObservation } from "./types";

export function vectorKey(scores: Record<AnnualAxisDomain, number | null>): string {
  return ANNUAL_AXIS_DOMAINS.map((d) => {
    const v = scores[d];
    return v == null ? "null" : v.toFixed(4);
  }).join("|");
}

export function availableScores(
  scores: Record<AnnualAxisDomain, number | null>,
): number[] {
  return ANNUAL_AXIS_DOMAINS.map((d) => scores[d]).filter((v): v is number => v != null);
}

export function euclideanDistance(
  a: Record<AnnualAxisDomain, number | null>,
  b: Record<AnnualAxisDomain, number | null>,
): number | null {
  let sum = 0;
  let n = 0;
  for (const d of ANNUAL_AXIS_DOMAINS) {
    const av = a[d];
    const bv = b[d];
    if (av == null || bv == null) continue;
    const diff = av - bv;
    sum += diff * diff;
    n += 1;
  }
  if (n === 0) return null;
  return Math.sqrt(sum / n);
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i]!;
    sy += ys[i]!;
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i]! - mx;
    const b = ys[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

export function groupByChart(
  observations: AnnualAxesAuditObservation[],
): Map<string, AnnualAxesAuditObservation[]> {
  const map = new Map<string, AnnualAxesAuditObservation[]>();
  for (const obs of observations) {
    const list = map.get(obs.chartId) ?? [];
    list.push(obs);
    map.set(obs.chartId, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.annualYear - b.annualYear);
  }
  return map;
}
