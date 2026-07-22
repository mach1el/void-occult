/**
 * Candidate evaluation entry — currently fails closed unless foundation
 * readiness permits experimental work. CONTROL-V08 verification lives in
 * control-v08.ts / run-decision.ts.
 */

import { intakeFoundation } from "./foundation-intake";
import { loadCandidatePack } from "./load-candidates";

export function assertCandidateEvaluationAllowed(): void {
  const foundation = intakeFoundation();
  if (!foundation.permitsCandidateEvaluation) {
    throw new Error(
      `FOUNDATION_BLOCKED:${foundation.readiness}:${foundation.issues.join(";")}`,
    );
  }
  const pack = loadCandidatePack();
  if (pack.issues.length > 0) {
    throw new Error(`CANDIDATE_PACK_INVALID:${pack.issues.map((i) => i.message).join(";")}`);
  }
}
