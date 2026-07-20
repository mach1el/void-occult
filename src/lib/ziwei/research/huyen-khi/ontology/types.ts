/**
 * ApexVoid Huyền Khí Ontology V0.1 — type contracts.
 *
 * RESEARCH ONLY. This package does NOT compute a numeric score and MUST NOT be
 * imported by production modules. It mirrors the supplied JSON schemas under
 * `research/huyen-khi/ontology/v0.1/` and the ontology hardening specification.
 *
 * Symbolic-only: dimensions carry ORDINAL vocabulary (state names, magnitude
 * words), never coefficients. No `score / weight / coefficient / support /
 * pressure / stability / activation / factor / delta / multiplier` keys are
 * permitted in ontology knowledge — the validator enforces this.
 *
 * The five ApexVoid dimensions are engineered analytical constructs, NOT
 * traditional canonical terms; `tendency` is NOT the old support/pressure axis.
 */

// ── Dimensions & symbolic vocabulary ───────────────────────────────────────

export type PalaceQiCapacity = "depleted" | "weak" | "adequate" | "strong" | "abundant";
export type PalaceQiCoherence = "fragmented" | "conflicted" | "mixed" | "coherent" | "integrated";
export type PalaceQiExpression = "blocked" | "restricted" | "available" | "expressive";
export type PalaceQiRegulation = "overwhelmed" | "insufficient" | "conditional" | "effective";
export type PalaceQiTendency = "nourishing" | "mixed" | "pressuring" | "unresolved";

/** Five separate dimensions — never collapse into one good/bad state. */
export type HuyenKhiDimension =
  | "capacity"
  | "coherence"
  | "expression"
  | "regulation"
  | "tendency";

export type HuyenKhiOperation =
  | "strengthen"
  | "weaken"
  | "stabilize"
  | "destabilize"
  | "block"
  | "restrict"
  | "release"
  | "nourish"
  | "deplete"
  | "regulate"
  | "overwhelm"
  | "transform"
  | "classify"
  | "orient";

/** Ordinal vocabulary, NOT a coefficient. */
export type HuyenKhiMagnitude = "trace" | "light" | "moderate" | "strong" | "dominant";

// ── School ─────────────────────────────────────────────────────────────────

export type HuyenKhiSchoolProfile = "shared" | "nam-phai" | "trung-chau";
export type HuyenKhiSchoolOnly = "nam-phai" | "trung-chau";
export type HuyenKhiExtractionSchoolProfile = HuyenKhiSchoolProfile | "unresolved";

// ── Source registry ─────────────────────────────────────────────────────────

export type HuyenKhiSourceKind =
  | "calculation-core"
  | "classical-primary"
  | "classical-transcription"
  | "modern-vietnamese-reference"
  | "modern-chinese-reference"
  | "expert-review"
  | "external-output-benchmark"
  | "internal-specification";

export type HuyenKhiWitnessKind =
  | "physical-scan"
  | "searchable-transcription"
  | "bibliography-only"
  | "not-applicable";

export interface HuyenKhiSource {
  readonly sourceId: string;
  readonly title: string;
  readonly kind: HuyenKhiSourceKind;
  readonly status: string;
  readonly witnessKind?: HuyenKhiWitnessKind;
  /** A transcription declares the physical-witness source it derives from. */
  readonly derivedFromSourceId?: string;
  readonly allowedUsage?: readonly string[];
  readonly prohibitedUsage?: readonly string[];
  readonly [key: string]: unknown;
}

export interface HuyenKhiSourceRegistry {
  readonly schemaVersion: string;
  readonly registryId: string;
  readonly sources: readonly HuyenKhiSource[];
}

// ── Claim registry + strict locator ─────────────────────────────────────────

export type HuyenKhiClaimStatus =
  | "approved-engineering"
  | "approved-research-policy"
  | "primary-source-reviewed"
  | "secondary-source-reviewed"
  | "expert-consensus"
  | "experimental"
  | "disputed"
  | "unresolved";

export type HuyenKhiLocatorKind =
  | "physical-witness"
  | "searchable-transcription"
  | "modern-commentary"
  | "internal-specification"
  | "expert-review-evidence"
  | "external-benchmark";

export type HuyenKhiLocatorVerificationStatus =
  | "unverified"
  | "locator-provided"
  | "cross-checked-against-witness"
  | "expert-verified";

export interface HuyenKhiLocator {
  readonly locatorKind: HuyenKhiLocatorKind;
  readonly sourceId: string;
  readonly edition?: string;
  readonly witnessId?: string;
  readonly volume?: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly page?: string;
  readonly folio?: string;
  readonly stableUrl?: string;
  readonly transcriptionAnchor?: string;
  readonly verificationStatus: HuyenKhiLocatorVerificationStatus;
  readonly verificationNotes?: string;
}

export interface HuyenKhiClaim {
  readonly claimId: string;
  readonly summary: string;
  readonly status: HuyenKhiClaimStatus;
  readonly sourceIds: readonly string[];
  readonly locator?: HuyenKhiLocator;
  readonly schoolProfiles?: readonly HuyenKhiSchoolProfile[];
  readonly supportsClaimIds?: readonly string[];
  readonly contradictsClaimIds?: readonly string[];
  readonly qualifiesClaimIds?: readonly string[];
  readonly limitations?: readonly string[];
}

export interface HuyenKhiClaimRegistry {
  readonly schemaVersion: string;
  readonly registryId: string;
  readonly claims: readonly HuyenKhiClaim[];
}

// ── Rule contract ────────────────────────────────────────────────────────────

export type HuyenKhiRuleStatus =
  | "draft"
  | "reviewed"
  | "approved"
  | "experimental"
  | "disputed"
  | "disabled";

export type HuyenKhiRuleSpecificity =
  | "exact-combination"
  | "exact-star-state"
  | "exact-star"
  | "star-family"
  | "generic-structure";

export type HuyenKhiRuleSubjectKind =
  | "palace-foundation"
  | "major-star"
  | "minor-star"
  | "star-family"
  | "transformation"
  | "void-marker"
  | "relation"
  | "combination";

export interface HuyenKhiRuleSubject {
  readonly kind: HuyenKhiRuleSubjectKind;
  readonly id: string;
}

export interface HuyenKhiRuleCondition {
  readonly fact?: string;
  readonly operator?: string;
  readonly value?: unknown;
  readonly [key: string]: unknown;
}

export interface HuyenKhiRuleEffect {
  readonly dimension: HuyenKhiDimension;
  readonly operation: HuyenKhiOperation;
  readonly magnitude: HuyenKhiMagnitude;
  readonly targetFactSelector?: Readonly<Record<string, unknown>>;
}

export interface HuyenKhiRule {
  readonly ruleId: string;
  readonly version: string;
  readonly status: HuyenKhiRuleStatus;
  readonly schoolProfile: HuyenKhiSchoolProfile;
  readonly specificity: HuyenKhiRuleSpecificity;
  readonly subject: HuyenKhiRuleSubject;
  readonly conditions: readonly HuyenKhiRuleCondition[];
  readonly effects: readonly HuyenKhiRuleEffect[];
  readonly stackingGroup: string;
  readonly suppressesRuleIds?: readonly string[];
  readonly sourceIds: readonly string[];
  readonly claimIds?: readonly string[];
  readonly limitations?: readonly string[];
}

/** Non-effective example catalog. NEVER loaded as knowledge. */
export interface HuyenKhiNonEffectiveRuleCatalog {
  readonly schemaVersion: string;
  readonly catalogId: string;
  readonly effective: false;
  readonly notes?: string;
  readonly rules: readonly HuyenKhiRule[];
}

// ── Expert fixtures (maturity + append-only reviews) ────────────────────────

export type HuyenKhiReviewRole =
  | "researcher"
  | "source-reviewer"
  | "school-expert"
  | "adjudicator";

/** A reviewer's decision — never "draft" (draft is the absence of reviews). */
export type HuyenKhiReviewDecision = "reviewed" | "approved" | "disputed";

/** Authoring stage set by hand. */
export type HuyenKhiFixtureMaturity = "planned" | "research-ready" | "reviewable";

/** Status DERIVED from the append-only review ledger — never stored by hand. */
export type HuyenKhiDerivedFixtureStatus =
  | "draft"
  | "reviewed"
  | "approved"
  | "disputed";

export interface HuyenKhiFixtureExpectedState {
  readonly capacity?: PalaceQiCapacity;
  readonly coherence?: PalaceQiCoherence;
  readonly expression?: PalaceQiExpression;
  readonly regulation?: PalaceQiRegulation;
  readonly tendency?: PalaceQiTendency;
}

export interface HuyenKhiFixtureReview {
  readonly reviewerId: string;
  readonly role: HuyenKhiReviewRole;
  readonly schoolProfile: HuyenKhiSchoolProfile;
  readonly decision: HuyenKhiReviewDecision;
  readonly rationale: string;
  readonly reviewedAt: string;
  readonly expectedState?: HuyenKhiFixtureExpectedState;
  readonly expectedEffectiveRuleIds?: readonly string[];
  readonly forbiddenRuleIds?: readonly string[];
  readonly sourceIds?: readonly string[];
  readonly claimIds?: readonly string[];
}

export interface HuyenKhiExpertFixture {
  readonly fixtureId: string;
  readonly title: string;
  readonly category: string;
  readonly schoolProfile: HuyenKhiSchoolProfile;
  readonly maturity: HuyenKhiFixtureMaturity;
  readonly inputFacts: Readonly<Record<string, unknown>>;
  readonly researchQuestion?: string;
  readonly candidateSourceIds?: readonly string[];
  readonly expectedEvidence?: readonly string[];
  readonly expectedState?: HuyenKhiFixtureExpectedState;
  readonly expectedEffectiveRuleIds?: readonly string[];
  readonly forbiddenRuleIds?: readonly string[];
  readonly limitations?: readonly string[];
  readonly knownContradictions?: readonly string[];
  readonly reviewQuestions: readonly string[];
  readonly rationale?: string;
  readonly reviews?: readonly HuyenKhiFixtureReview[];
}

export interface HuyenKhiExpertFixturePlan {
  readonly schemaVersion: string;
  readonly fixtureSetId: string;
  readonly minimumApprovedRequiredForNextPhase: number;
  readonly preferredApproved?: number;
  readonly fixtures: readonly HuyenKhiExpertFixture[];
}

// ── Catalogs & policies ──────────────────────────────────────────────────────

export interface HuyenKhiTerm {
  readonly termId: string;
  readonly labelVi: string;
  readonly definition: string;
  readonly notEquivalentTo?: readonly string[];
  readonly phase?: string;
  readonly epistemicStatus?: string;
}

export interface HuyenKhiNamespaceSeparation {
  readonly left: string;
  readonly right: string;
  readonly rule: string;
}

export interface HuyenKhiTerminology {
  readonly schemaVersion: string;
  readonly catalogId: string;
  readonly terms: readonly HuyenKhiTerm[];
  readonly namespaceSeparations?: readonly HuyenKhiNamespaceSeparation[];
  readonly dimensionEpistemicNote?: string;
}

export interface HuyenKhiDimensionSpec {
  readonly orderedStates?: readonly string[];
  readonly unorderedStates?: readonly string[];
  readonly epistemicStatus: "apexvoid-engineered-construct";
  readonly description: string;
  readonly assessmentTargetKinds: readonly string[];
  readonly observableIndicators: readonly string[];
  readonly nonClaims: readonly string[];
  readonly aggregationDeferred: true;
  readonly numericMappingForbidden: true;
}

export interface HuyenKhiSymbolicDimensions {
  readonly schemaVersion: string;
  readonly catalogId: string;
  readonly vocabularyNote?: string;
  readonly dimensions: Readonly<Record<HuyenKhiDimension, HuyenKhiDimensionSpec>>;
  readonly magnitudeVocabulary: readonly HuyenKhiMagnitude[];
  readonly effectOperations: readonly HuyenKhiOperation[];
  readonly operationVocabularyNote?: string;
}

export interface HuyenKhiDimensionOperationCompatibility {
  readonly schemaVersion: string;
  readonly contractId: string;
  readonly note?: string;
  readonly compatibility: Readonly<Record<HuyenKhiDimension, readonly HuyenKhiOperation[]>>;
  readonly rationale?: Readonly<Record<string, string>>;
}

export interface HuyenKhiClaimProvenancePolicy {
  readonly schemaVersion: string;
  readonly policyId: string;
  readonly note?: string;
  readonly locatorKinds: readonly HuyenKhiLocatorKind[];
  readonly doctrinalLocatorRequiredForStatus: readonly HuyenKhiClaimStatus[];
  readonly doctrinalLocatorKinds: readonly HuyenKhiLocatorKind[];
  readonly engineeringPolicyStatuses: readonly HuyenKhiClaimStatus[];
  readonly engineeringPolicyLocatorKinds: readonly HuyenKhiLocatorKind[];
  readonly locatorNotRequiredForStatus: readonly HuyenKhiClaimStatus[];
  readonly contradictionLinkFields: readonly string[];
  readonly autoResolveContradictions: false;
  readonly transcriptionRule?: string;
}

export interface HuyenKhiSourceWitnessMatrix {
  readonly schemaVersion: string;
  readonly matrixId: string;
  readonly note?: string;
  readonly witnesses: readonly {
    readonly sourceId: string;
    readonly role: HuyenKhiLocatorKind;
    readonly title: string;
    readonly derivedFromSourceId: string | null;
    readonly editionResolved: boolean;
    readonly verificationStatus: HuyenKhiLocatorVerificationStatus;
  }[];
}

export interface HuyenKhiFixtureMaturityPolicy {
  readonly schemaVersion: string;
  readonly policyId: string;
  readonly note?: string;
  readonly maturityLevels: readonly string[];
  readonly authoringLevels: readonly HuyenKhiFixtureMaturity[];
  readonly derivedLevels: readonly HuyenKhiDerivedFixtureStatus[];
  readonly requirements: Readonly<Record<string, readonly string[]>>;
  readonly gateNaming: Readonly<Record<string, string>>;
}

export interface HuyenKhiResearchTopic {
  readonly topicId: string;
  readonly label: string;
  readonly plannedSourceIds: readonly string[];
  readonly extractedClaimCount: number;
  readonly locatorVerifiedClaimCount: number;
  readonly schoolReviewStatus: string;
  readonly fixtureCoverageCount: number;
  readonly unresolvedQuestions: readonly string[];
}

export interface HuyenKhiResearchTopicCoverage {
  readonly schemaVersion: string;
  readonly matrixId: string;
  readonly note?: string;
  readonly topics: readonly HuyenKhiResearchTopic[];
}

export interface HuyenKhiSchoolProfileConfig {
  readonly status?: string;
  readonly allowedFactNamespaces?: readonly string[];
  readonly inheritsSharedFacts?: boolean;
  readonly ruleFallbackToOtherSchool?: boolean;
  readonly fallbackPolicy?: string;
}

export interface HuyenKhiSchoolPolicy {
  readonly schemaVersion: string;
  readonly catalogId: string;
  readonly profiles: Readonly<Record<string, HuyenKhiSchoolProfileConfig>>;
  readonly missingProfileBehavior: string;
}

export interface HuyenKhiConflictRule {
  readonly id: string;
  readonly condition: string;
  readonly behavior: string;
}

export interface HuyenKhiRuleConflictPolicy {
  readonly schemaVersion: string;
  readonly policyId: string;
  readonly specificityOrder: readonly HuyenKhiRuleSpecificity[];
  readonly rules: readonly HuyenKhiConflictRule[];
  readonly silentResolutionForbidden: true;
}

// ── Source extraction workflow ──────────────────────────────────────────────

export interface SourceExtractionLocator {
  readonly edition?: string;
  readonly volume?: string;
  readonly page?: string;
  readonly section?: string;
  readonly stableUrl?: string;
}

export type SourceExtractionStatus = "draft" | "reviewed" | "rejected" | "disputed";

export interface SourceExtractionRecord {
  readonly extractionId: string;
  readonly taskId: string;
  readonly sourceId: string;
  readonly locator: SourceExtractionLocator;
  readonly conciseParaphrase: string;
  readonly candidateClaimIds: readonly string[];
  readonly schoolProfile: HuyenKhiExtractionSchoolProfile;
  readonly extractor: string;
  readonly reviewer: string | null;
  readonly status: SourceExtractionStatus;
  readonly contradictionNotes: readonly string[];
}

export interface HuyenKhiSourceExtractionTask {
  readonly taskId: string;
  readonly topic: string;
  readonly priority?: number;
  readonly candidateSourceIds?: readonly string[];
  readonly requiredOutput?: readonly string[];
  readonly automaticExtractionForbidden?: boolean;
  readonly [key: string]: unknown;
}

export interface HuyenKhiSourceExtractionQueue {
  readonly schemaVersion: string;
  readonly queueId?: string;
  readonly tasks: readonly HuyenKhiSourceExtractionTask[];
  readonly [key: string]: unknown;
}

export interface HuyenKhiExpertReviewWorkflow {
  readonly schemaVersion: string;
  readonly workflowId: string;
  readonly roles: readonly HuyenKhiReviewRole[];
  readonly states: readonly HuyenKhiDerivedFixtureStatus[];
  readonly requirements: Readonly<Record<string, readonly string[]>>;
  readonly blindReviewRecommended?: boolean;
  readonly personalChartDataRequired?: boolean;
}

export interface HuyenKhiReleaseGates {
  readonly schemaVersion: string;
  readonly gateId: string;
  readonly hardGates: Readonly<Record<string, number | boolean>>;
  readonly symbolicEvaluatorPhasePromotionGates: Readonly<Record<string, unknown>>;
  readonly productionGate: string;
}

// ── Manifest ─────────────────────────────────────────────────────────────────

export interface HuyenKhiOntologyManifest {
  readonly schemaVersion: string;
  readonly manifestId: string;
  readonly version: string;
  readonly status: string;
  readonly files: readonly string[];
  readonly forbiddenRuntimeDependencies: readonly string[];
}

// ── Loaded ontology bundle ──────────────────────────────────────────────────

export interface HuyenKhiOntology {
  readonly manifest: HuyenKhiOntologyManifest;
  readonly sourceRegistry: HuyenKhiSourceRegistry;
  readonly claimRegistry: HuyenKhiClaimRegistry;
  readonly terminology: HuyenKhiTerminology;
  readonly symbolicDimensions: HuyenKhiSymbolicDimensions;
  readonly dimensionOperationCompatibility: HuyenKhiDimensionOperationCompatibility;
  readonly claimProvenancePolicy: HuyenKhiClaimProvenancePolicy;
  readonly sourceWitnessMatrix: HuyenKhiSourceWitnessMatrix;
  readonly fixtureMaturityPolicy: HuyenKhiFixtureMaturityPolicy;
  readonly researchTopicCoverage: HuyenKhiResearchTopicCoverage;
  readonly schoolPolicy: HuyenKhiSchoolPolicy;
  readonly ruleConflictPolicy: HuyenKhiRuleConflictPolicy;
  readonly sourceExtractionQueue: HuyenKhiSourceExtractionQueue;
  readonly expertReviewWorkflow: HuyenKhiExpertReviewWorkflow;
  readonly releaseGates: HuyenKhiReleaseGates;
  readonly fixturePlan: HuyenKhiExpertFixturePlan;
  /** Effective rules loaded as knowledge. Empty in V0.1 — no evaluator. */
  readonly rules: readonly HuyenKhiRule[];
}

// ── Validation & reports ─────────────────────────────────────────────────────

export type HuyenKhiIssueSeverity = "error" | "warning";

export interface HuyenKhiValidationIssue {
  readonly severity: HuyenKhiIssueSeverity;
  readonly code: string;
  readonly file: string;
  readonly path: string;
  readonly message: string;
}

export type HuyenKhiLoadResult =
  | { readonly ok: true; readonly ontology: HuyenKhiOntology }
  | { readonly ok: false; readonly issues: readonly HuyenKhiValidationIssue[] };
