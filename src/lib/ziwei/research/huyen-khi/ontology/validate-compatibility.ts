/**
 * Operation/dimension compatibility (Phase D).
 *
 * A (dimension, operation) pair is valid only if the compatibility contract
 * lists it. Invalid pairs are REJECTED (never silently coerced) by both the
 * declarative compatibility check here and runtime rule validation. Symbolic
 * only — no numeric delta.
 */

import type {
  HuyenKhiDimension,
  HuyenKhiDimensionOperationCompatibility,
  HuyenKhiOperation,
} from "./types";

export function isCompatible(
  contract: HuyenKhiDimensionOperationCompatibility,
  dimension: HuyenKhiDimension,
  operation: HuyenKhiOperation,
): boolean {
  const allowed = contract.compatibility[dimension];
  return Array.isArray(allowed) && allowed.includes(operation);
}

/** All allowed (dimension, operation) pairs — for exhaustive testing/reports. */
export function allowedPairs(
  contract: HuyenKhiDimensionOperationCompatibility,
): { readonly dimension: HuyenKhiDimension; readonly operation: HuyenKhiOperation }[] {
  const out: { dimension: HuyenKhiDimension; operation: HuyenKhiOperation }[] = [];
  for (const dimension of Object.keys(contract.compatibility) as HuyenKhiDimension[]) {
    for (const operation of contract.compatibility[dimension]) {
      out.push({ dimension, operation });
    }
  }
  return out;
}
