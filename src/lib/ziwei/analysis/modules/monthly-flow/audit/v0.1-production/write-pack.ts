/**
 * Monthly Flow V0.1 production smoke audit + research pack writer.
 * @deprecated Prefer audit/v0.1.2-hardening — thin re-export for CLI backward compat.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  runMonthlyFlowV012HardeningAudit,
  writeMonthlyFlowV012HardeningPack,
} from "../v0.1.2-hardening/write-pack";

export const runMonthlyFlowV01SmokeAudit = runMonthlyFlowV012HardeningAudit;
export const writeMonthlyFlowV01ProductionPack = writeMonthlyFlowV012HardeningPack;

/** Legacy pack path — v0.1-production-ui corpus from prior release. */
export const PACK_REL = "research/monthly-flow/v0.1-production-ui";

export function readDecisionFromPack(): string | null {
  const p = join(process.cwd(), PACK_REL, "reports/decision.json");
  if (!existsSync(p)) return null;
  const j = JSON.parse(readFileSync(p, "utf8")) as { readinessDecision?: string };
  return j.readinessDecision ?? null;
}
