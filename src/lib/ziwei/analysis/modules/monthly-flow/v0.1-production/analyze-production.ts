/**
 * UI-facing Monthly Flow production analysis wrapper (integration 0.1.2).
 * Wires Calculation Core provider + school-aware domain adapter into the
 * existing analyzeMonthlyFlow scorer without copying scoring logic.
 */
import type { ChartData } from "../../../../../../types/chart";
import type { ZiweiSchool } from "../../../facts";
import { loadAnnualAxesKnowledgeV0 } from "../../../knowledge/annual-axes";
import { loadMonthlyFlowScoringKnowledgeV0 } from "../../../knowledge/monthly-flow";
import { analyzeMonthlyFlow } from "../analyze";
import { createMonthlyCalculationProvider } from "../create-monthly-calculation-provider";
import {
  resolveMonthlyFlowAnnualDomains,
  type MonthlyFlowAnnualDomainAdapterDiagnostics,
  type MonthlyFlowAnnualDomainAdapterResult,
} from "../resolve-monthly-flow-annual-domains";
import type {
  ExplicitLeapMonthContext,
  MonthlyFlowResult,
  MonthlyFlowYearDiagnostics,
} from "../types";
import {
  buildMonthlyFlowMonthSummaries,
  type MonthlyFlowMonthSummary,
} from "./month-summaries";

export const MONTHLY_FLOW_INTEGRATION_VERSION = "0.1.2";
export const MONTHLY_FLOW_CONTRACT_VERSION = "0.1.0";

export interface MonthlyFlowProductionDiagnostics {
  providerUnavailable: boolean;
  providerSchoolMismatch: string[];
  invalidKnowledge: string[];
  domainAdapterFailed: boolean;
  domainAdapter: MonthlyFlowAnnualDomainAdapterDiagnostics | null;
  engine: MonthlyFlowYearDiagnostics | null;
  notes: string[];
}

export interface MonthlyFlowProductionAnalysis {
  module: "monthly-flow";
  version: "0.1.2";
  annualYear: number;
  school: ZiweiSchool;
  result: MonthlyFlowResult | null;
  monthSummaries: MonthlyFlowMonthSummary[];
  status: "available" | "partial" | "unavailable";
  domainAdapter: MonthlyFlowAnnualDomainAdapterResult | null;
  diagnostics: MonthlyFlowProductionDiagnostics;
}

function emptyProductionDiagnostics(): MonthlyFlowProductionDiagnostics {
  return {
    providerUnavailable: false,
    providerSchoolMismatch: [],
    invalidKnowledge: [],
    domainAdapterFailed: false,
    domainAdapter: null,
    engine: null,
    notes: [],
  };
}

/**
 * Production pipeline:
 * ChartData → Calculation Core provider → school-aware annual-domain adapter
 * → analyzeMonthlyFlow(resolvedDomainContext) → display summaries.
 */
export function analyzeMonthlyFlowProduction(
  chart: ChartData,
  options: {
    school: ZiweiSchool;
    explicitLeapContexts?: readonly ExplicitLeapMonthContext[];
  },
): MonthlyFlowProductionAnalysis {
  const { school, explicitLeapContexts } = options;
  const diagnostics = emptyProductionDiagnostics();

  const knowledge = loadMonthlyFlowScoringKnowledgeV0();
  if (!knowledge.ok) {
    diagnostics.invalidKnowledge.push(
      ...knowledge.issues.map((i) => `${i.path}: ${i.message}`),
    );
    return {
      module: "monthly-flow",
      version: MONTHLY_FLOW_INTEGRATION_VERSION,
      annualYear: chart.annualYear,
      school,
      result: null,
      monthSummaries: [],
      status: "unavailable",
      domainAdapter: null,
      diagnostics,
    };
  }

  const annualKnowledge = loadAnnualAxesKnowledgeV0();
  if (!annualKnowledge.ok) {
    diagnostics.invalidKnowledge.push(
      ...annualKnowledge.issues.map((i) => `${i.path}: ${i.message}`),
    );
    return {
      module: "monthly-flow",
      version: MONTHLY_FLOW_INTEGRATION_VERSION,
      annualYear: chart.annualYear,
      school,
      result: null,
      monthSummaries: [],
      status: "unavailable",
      domainAdapter: null,
      diagnostics,
    };
  }

  const provider = createMonthlyCalculationProvider(school);
  if (!provider) {
    diagnostics.providerUnavailable = true;
    return {
      module: "monthly-flow",
      version: MONTHLY_FLOW_INTEGRATION_VERSION,
      annualYear: chart.annualYear,
      school,
      result: null,
      monthSummaries: [],
      status: "unavailable",
      domainAdapter: null,
      diagnostics,
    };
  }

  if (provider.school !== school) {
    diagnostics.providerSchoolMismatch.push(
      `requested=${school};provider=${provider.school}`,
    );
    return {
      module: "monthly-flow",
      version: MONTHLY_FLOW_INTEGRATION_VERSION,
      annualYear: chart.annualYear,
      school,
      result: null,
      monthSummaries: [],
      status: "unavailable",
      domainAdapter: null,
      diagnostics,
    };
  }

  const domainAdapter = resolveMonthlyFlowAnnualDomains(
    chart,
    school,
    annualKnowledge.knowledge.axisDefinitions,
  );
  diagnostics.domainAdapter = domainAdapter.diagnostics;

  if (!domainAdapter.ok || !domainAdapter.resolvedDomainContext) {
    diagnostics.domainAdapterFailed = true;
    return {
      module: "monthly-flow",
      version: MONTHLY_FLOW_INTEGRATION_VERSION,
      annualYear: chart.annualYear,
      school,
      result: null,
      monthSummaries: [],
      status: "unavailable",
      domainAdapter,
      diagnostics,
    };
  }

  const result = analyzeMonthlyFlow(chart, {
    school,
    provider,
    explicitLeapContexts,
    resolvedDomainContext: domainAdapter.resolvedDomainContext,
  });

  diagnostics.engine = result.diagnostics;
  if (result.diagnostics.providerSchoolMismatch.length > 0) {
    diagnostics.providerSchoolMismatch.push(...result.diagnostics.providerSchoolMismatch);
  }

  const monthSummaries = buildMonthlyFlowMonthSummaries(result.months);

  return {
    module: "monthly-flow",
    version: MONTHLY_FLOW_INTEGRATION_VERSION,
    annualYear: result.annualYear,
    school,
    result,
    monthSummaries,
    status: result.status,
    domainAdapter,
    diagnostics,
  };
}
