import { deepFreeze, type DeepReadonly } from "../deep-freeze";
import type { MajorFortuneOrdinalKnowledge } from "./types";
import { validateMajorFortuneOrdinalKnowledge } from "./validate";

import manifest from "./manifest.v0.3.json";
import governance from "./governance.v0.3.json";
import formula from "./formula.v0.3.json";
import bands from "./bands.v0.3.json";
import pillarRegistry from "./pillar-registry.v0.3.json";
import signalFamilyPolicy from "./signal-family-policy.v0.3.json";
import exclusionRegistry from "./exclusion-registry.v0.3.json";
import schoolCapabilityMatrix from "./school-capability-matrix.v0.3.json";
import crossPillarOwnership from "./cross-pillar-ownership.v0.3.json";

export type LoadMajorFortuneOrdinalKnowledgeResult =
  | { ok: true; knowledge: DeepReadonly<MajorFortuneOrdinalKnowledge> }
  | { ok: false; issues: Array<{ path: string; message: string }> };

let cache: DeepReadonly<MajorFortuneOrdinalKnowledge> | null = null;

function assemble(): MajorFortuneOrdinalKnowledge {
  return {
    manifest: manifest as MajorFortuneOrdinalKnowledge["manifest"],
    governance: governance as MajorFortuneOrdinalKnowledge["governance"],
    formula: formula as MajorFortuneOrdinalKnowledge["formula"],
    bands: bands as MajorFortuneOrdinalKnowledge["bands"],
    pillarRegistry: pillarRegistry as MajorFortuneOrdinalKnowledge["pillarRegistry"],
    signalFamilyPolicy:
      signalFamilyPolicy as MajorFortuneOrdinalKnowledge["signalFamilyPolicy"],
    exclusionRegistry:
      exclusionRegistry as MajorFortuneOrdinalKnowledge["exclusionRegistry"],
    schoolCapabilityMatrix:
      schoolCapabilityMatrix as MajorFortuneOrdinalKnowledge["schoolCapabilityMatrix"],
    crossPillarOwnership:
      crossPillarOwnership as MajorFortuneOrdinalKnowledge["crossPillarOwnership"],
  };
}

export function loadMajorFortuneOrdinalKnowledge(): LoadMajorFortuneOrdinalKnowledgeResult {
  if (cache) return { ok: true, knowledge: cache };
  const assembled = assemble();
  const validation = validateMajorFortuneOrdinalKnowledge(assembled);
  if (!validation.ok) return { ok: false, issues: validation.issues };
  cache = deepFreeze(assembled);
  return { ok: true, knowledge: cache };
}

export function resetMajorFortuneOrdinalKnowledgeCache(): void {
  cache = null;
}
