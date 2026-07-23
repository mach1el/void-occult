import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAnalysisStatus } from "../../../../contracts/common";
import { loadMajorFortuneOrdinalKnowledge } from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal";
import adapterPolicy from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal-adapter/adapter-policy.v0.3.json";
import provenance from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal-adapter/engineering-provenance.v0.3.json";
import familyMatrix from "../../../../knowledge/major-fortune-scoring/v0.3-ordinal-adapter/family-matrix.v0.3.json";
import { runMajorFortuneV03SmokeFixtures } from "../../v0.3-ordinal-adapter/smoke-fixtures";
import { calculate as calculateNamPhai } from "../../../../../engine-nam-phai";
import { calculate as calculateTrungChau } from "../../../../../engine-trung-chau";
import { analyzeMajorFortuneOrdinalV03 } from "../../v0.3-ordinal-adapter";

export const PACK_REL = "research/major-fortune/v0.3-adapter-ui";

function writeJson(abs: string, value: unknown): void {
  writeFileSync(abs, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeMajorFortuneV03AdapterUiPack(): {
  decision: "EXPERIMENTAL_UI_READY_FOR_MANUAL_REVIEW" | "EXPERIMENTAL_UI_REVISION_REQUIRED";
  hardGateFailures: string[];
} {
  const packDir = join(process.cwd(), PACK_REL);
  const reports = join(packDir, "reports");
  const policy = join(packDir, "policy");
  const fixtures = join(packDir, "fixtures");
  const prompts = join(packDir, "prompts");
  for (const d of [packDir, reports, policy, fixtures, prompts]) mkdirSync(d, { recursive: true });

  const hardGateFailures: string[] = [];
  const loaded = loadMajorFortuneOrdinalKnowledge();
  if (!loaded.ok) hardGateFailures.push("v03-contract-invalid");
  else {
    if (loaded.knowledge.formula.baseScore !== 50) hardGateFailures.push("baseScore-changed");
    if (loaded.knowledge.formula.ordinalDivisor !== 4) hardGateFailures.push("ordinalDivisor-changed");
    if (!loaded.knowledge.formula.derivation.forbidsPerRuleRawDelta) {
      hardGateFailures.push("rawDelta-allowed");
    }
  }

  const routing = getAnalysisStatus("major-fortune");
  if (routing.status !== "available" || routing.version !== "0.3.1") {
    hardGateFailures.push("production-routing-unexpected");
  }

  const smoke = runMajorFortuneV03SmokeFixtures();
  const temporal = smoke.find((s) => s.id === "annual-monthly-equivalence");
  if (!temporal?.notes.includes("temporal-independent:ok")) {
    hardGateFailures.push("temporal-independence-failed");
  }
  const noPalace = smoke.find((s) => s.id === "no-active-palace");
  if (noPalace?.adapterStatus !== "unavailable" || noPalace.score != null) {
    hardGateFailures.push("no-palace-must-be-unavailable");
  }

  // Spot UI analysis shape
  const nam = analyzeMajorFortuneOrdinalV03(
    calculateNamPhai({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    }),
    { school: "nam-phai" },
  );
  const tc = analyzeMajorFortuneOrdinalV03(
    calculateTrungChau({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    }),
    { school: "trung-chau" },
  );

  if (nam.display.pillarSummaries.length !== 4) hardGateFailures.push("pillar-display-count");
  if (!nam.display.disclaimer.includes("không phải công thức cổ điển")) {
    hardGateFailures.push("disclaimer-missing");
  }
  if ((nam.result?.score ?? -1) < 0 || (nam.result?.score ?? 101) > 100) {
    hardGateFailures.push("score-bounds-nam-phai");
  }
  if ((tc.result?.score ?? -1) < 0 || (tc.result?.score ?? 101) > 100) {
    hardGateFailures.push("score-bounds-trung-chau");
  }
  if (nam.adapterDiagnostics.ownershipViolations.length > 0) {
    hardGateFailures.push("ownership-violations");
  }

  const uniqueFailures = [...new Set(hardGateFailures)].sort();
  const decision =
    uniqueFailures.length === 0
      ? "EXPERIMENTAL_UI_READY_FOR_MANUAL_REVIEW"
      : "EXPERIMENTAL_UI_REVISION_REQUIRED";

  writeJson(join(policy, "adapter-policy.v0.3.json"), adapterPolicy);
  writeJson(join(policy, "engineering-provenance.v0.3.json"), provenance);
  writeJson(join(policy, "family-matrix.v0.3.json"), familyMatrix);

  writeJson(join(fixtures, "product-smoke-manifest.json"), {
    fixtureSetId: "major-fortune-v0.3-adapter-ui-smoke",
    cases: smoke,
  });

  writeJson(join(reports, "ui-proof-report.json"), {
    namPhai: {
      adapterStatus: nam.adapterStatus,
      score: nam.result?.score ?? null,
      coverage: nam.result?.coverage.coverageWeight ?? null,
      pillarCount: nam.display.pillarSummaries.length,
      experimental: nam.experimental,
      disclaimerPresent: Boolean(nam.display.disclaimer),
    },
    trungChau: {
      adapterStatus: tc.adapterStatus,
      score: tc.result?.score ?? null,
      coverage: tc.result?.coverage.coverageWeight ?? null,
      xfEvidence: tc.emittedEvidence.filter(
        (e) => e.signalFamilyId === "major-fortune-transformations",
      ).length,
    },
  });

  writeJson(join(reports, "validation-report.json"), {
    ok: uniqueFailures.length === 0,
    hardGateFailures: uniqueFailures,
    productionRouting: routing,
    v03ContractValid: loaded.ok,
    featureFlagDefaultOff: true,
    featureFlagId: "ziweiMajorFortuneV03Ordinal",
    featureFlagEnv: "VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL",
  });

  writeJson(join(reports, "summary-report.json"), {
    adapterVersion: adapterPolicy.adapterVersion,
    modelNature: "engineering-heuristic",
    classicalDoctrineVerified: false,
    numericAuthority: "engineering-defined",
    enabledFamilies: familyMatrix.enabled,
    disabledFamilies: familyMatrix.disabled,
    smoke,
    readinessDecision: decision,
    hardGateFailures: uniqueFailures,
    productionRouting: routing,
  });

  writeJson(join(reports, "decision.json"), {
    schemaVersion: "0.3.0",
    decisionId: "major-fortune-v0.3-adapter-ui-decision",
    readinessDecision: decision,
    modelNature: "engineering-heuristic",
    doctrineRelationship: "doctrine-informed-not-classical-reconstruction",
    numericAuthority: "engineering-defined",
    productionStatus: "research-only",
    experimentalOnly: true,
    defaultProductionRolloutAuthorized: false,
    hardGateFailures: uniqueFailures,
    featureFlag: {
      id: "ziweiMajorFortuneV03Ordinal",
      env: "VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL",
      defaultEnabled: false,
    },
    v01Unchanged: true,
    v02Unchanged: true,
    v03OrdinalContractUnchanged: true,
    productionRoutingUnchanged: true,
  });

  writeFileSync(
    join(packDir, "V0.3-ADAPTER-UI-DECISION.md"),
    [
      "# Major Fortune V0.3 Adapter + Experimental UI Decision",
      "",
      `**\`${decision}\`**`,
      "",
      "## Governance",
      "",
      "```text",
      "model nature: engineering heuristic",
      "classical doctrine verified: false",
      "numeric authority: engineering defined",
      "```",
      "",
      "## Feature flag",
      "",
      "- `ziweiMajorFortuneV03Ordinal`",
      "- default: enabled",
      "- `VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL=false` kill-switch",
      "",
      "## Production safety",
      "",
      "- `getAnalysisStatus(\"major-fortune\")` → `available` / `0.3.1` when enabled + knowledge valid",
      "- V0.1 / V0.2 / V0.3 ordinal formula unchanged",
      "- Monthly Flow remains rebuilding",
      "",
      "## Hard gates",
      "",
      uniqueFailures.length === 0
        ? "- All structural hard gates passed."
        : uniqueFailures.map((f) => `- FAIL: \`${f}\``).join("\n"),
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    join(packDir, "README.md"),
    [
      "# Major Fortune V0.3 Adapter + Experimental UI",
      "",
      "Feature-flagged experimental path:",
      "",
      "```text",
      "ChartData → V0.3 evidence adapter → pure ordinal evaluator → experimental UI",
      "```",
      "",
      "## Enable",
      "",
      "```bash",
      "VITE_ZIWEI_MAJOR_FORTUNE_V03_ORDINAL=true",
      "```",
      "",
      "## Decision",
      "",
      `See \`V0.3-ADAPTER-UI-DECISION.md\` — **\`${decision}\`**.`,
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    join(prompts, "next-step-handoff-prompt.md"),
    [
      "# Next-step handoff — Major Fortune V0.3 adapter UI",
      "",
      `Decision: \`${decision}\``,
      "",
      "This does not authorize default production rollout.",
      "Manual product review should observe Nam Phái partial XF and Trung Châu transformation behavior.",
      "Do not tune mappings from aesthetic score distribution in the same phase.",
      "",
    ].join("\n"),
    "utf8",
  );

  return { decision, hardGateFailures: uniqueFailures };
}
