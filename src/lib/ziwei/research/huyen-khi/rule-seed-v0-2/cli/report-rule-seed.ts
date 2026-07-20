import { generateReports } from "../generate-reports";
import { loadRuleSeed } from "../load-rule-seed";
import { validateCandidateRules } from "../validate-candidate-rules";
import { validateExtractions } from "../validate-extractions";
import { validateFixtureMaterialization } from "../validate-fixture-materialization";
import { validateTopicCoverage } from "../validate-topic-coverage";

const data = loadRuleSeed();
const issues = [
  validateTopicCoverage(data),
  validateExtractions(data),
  validateCandidateRules(data),
  validateFixtureMaterialization(data),
].flatMap((result) => result.issues);

const errors = issues.filter((issue) => issue.severity === "error");
if (errors.length > 0) {
  errors.forEach((issue) =>
    console.error(`[${issue.code}] ${issue.path}: ${issue.message}`),
  );
  console.error("Reports not generated: validation failed.");
  process.exit(1);
}

generateReports(data);
console.log("Reports generated");
