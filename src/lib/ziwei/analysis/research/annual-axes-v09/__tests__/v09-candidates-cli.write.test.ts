import { describe, expect, it } from "vitest";
import {
  cliValidate,
  cliControl,
  cliTraining,
  cliFreeze,
  cliHoldout,
  cliProduct,
  cliDecision,
} from "../cli";

const CMD = process.env.V09_CANDIDATES_CMD ?? "decision";

describe.runIf(Boolean(process.env.V09_CANDIDATES_CLI))(
  `annual-axes v0.9 candidates CLI (${CMD})`,
  () => {
    it(`runs ${CMD}`, () => {
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
      const fn = table[CMD];
      expect(fn).toBeTypeOf("function");
      fn!();
    });
  },
);
