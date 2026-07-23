import { deepFreeze, type DeepReadonly } from "../deep-freeze";
import type { MajorFortuneV02Knowledge } from "./types";
import { validateMajorFortuneKnowledgeV02 } from "./validate";

import manifest from "./manifest.v0.2.json";
import formula from "./formula.v0.2.json";
import bands from "./bands.v0.2.json";
import branchElementMap from "./branch-element-map.v0.2.json";
import schoolCapabilities from "./school-capabilities.v0.2.json";
import natalPalaceGroups from "./natal-palace-groups.v0.2.json";
import rules from "./rules.v0.2.json";

export type LoadMajorFortuneKnowledgeV02Result =
  | { ok: true; knowledge: DeepReadonly<MajorFortuneV02Knowledge> }
  | { ok: false; issues: Array<{ path: string; message: string }> };

let cache: DeepReadonly<MajorFortuneV02Knowledge> | null = null;

function assemble(): MajorFortuneV02Knowledge {
  return {
    manifest: manifest as MajorFortuneV02Knowledge["manifest"],
    formula: formula as MajorFortuneV02Knowledge["formula"],
    bands: bands as MajorFortuneV02Knowledge["bands"],
    branchElementMap: branchElementMap as MajorFortuneV02Knowledge["branchElementMap"],
    schoolCapabilities: schoolCapabilities as MajorFortuneV02Knowledge["schoolCapabilities"],
    natalPalaceGroups: natalPalaceGroups as MajorFortuneV02Knowledge["natalPalaceGroups"],
    rules: rules as MajorFortuneV02Knowledge["rules"],
  };
}

export function loadMajorFortuneKnowledgeV02(): LoadMajorFortuneKnowledgeV02Result {
  if (cache) return { ok: true, knowledge: cache };
  const assembled = assemble();
  const validation = validateMajorFortuneKnowledgeV02(assembled);
  if (!validation.ok) return { ok: false, issues: validation.issues };
  cache = deepFreeze(assembled);
  return { ok: true, knowledge: cache };
}

export function resetMajorFortuneKnowledgeV02Cache(): void {
  cache = null;
}
