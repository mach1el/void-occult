#!/usr/bin/env npx tsx
import {
  cliValidate,
  cliControl,
  cliTraining,
  cliFreeze,
  cliHoldout,
  cliProduct,
  cliDecision,
} from "./cli";

const cmd = process.argv[2] ?? "decision";
const table: Record<string, () => void> = {
  validate: cliValidate,
  control: cliControl,
  training: cliTraining,
  freeze: cliFreeze,
  holdout: cliHoldout,
  product: cliProduct,
  decision: cliDecision,
  all: () => {
    cliValidate();
    cliControl();
    cliTraining();
    cliFreeze();
    cliHoldout();
    cliProduct();
    cliDecision();
  },
};

const fn = table[cmd];
if (!fn) {
  process.stderr.write(`Unknown command: ${cmd}\n`);
  process.exit(1);
}
fn();
