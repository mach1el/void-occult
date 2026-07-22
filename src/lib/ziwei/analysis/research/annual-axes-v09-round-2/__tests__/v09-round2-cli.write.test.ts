import { describe, expect, it } from "vitest";
import {
  cliValidate,
  cliControl,
  cliTraining,
  cliFreeze,
  cliHoldout,
  cliFull,
  cliProduct,
  cliSensitivity,
  cliDecision,
  cliAll,
} from "../cli";

const CMD = process.env.V09_R2_CMD ?? "validate";

describe.runIf(Boolean(process.env.V09_R2_CLI))(`annual-axes v0.9 round-2 CLI (${CMD})`, () => {
  it(`runs ${CMD}`, () => {
    const table: Record<string, () => void> = {
      validate: cliValidate,
      control: cliControl,
      training: cliTraining,
      freeze: cliFreeze,
      holdout: cliHoldout,
      full: cliFull,
      product: cliProduct,
      sensitivity: cliSensitivity,
      decision: cliDecision,
      all: cliAll,
    };
    const fn = table[CMD];
    expect(fn).toBeTypeOf("function");
    fn!();
  }, 1_800_000);
});
