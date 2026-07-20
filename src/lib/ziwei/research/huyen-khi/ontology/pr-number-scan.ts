/**
 * Hard-coded PR-number scan (Phase B).
 *
 * Release gates must reference capabilities or phases, never a mutable PR
 * number. Scans ontology data files and docs for `PR #<n>` style references.
 * Generated reports are excluded (regenerated deterministically).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { ONTOLOGY_DIR } from "./paths";

const PR_NUMBER = /\bPR\s*#\s*\d+/i;

export interface PrNumberHit {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

function collect(dir: string, exts: readonly string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (entry === "reports") continue;
      out.push(...collect(abs, exts));
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(abs);
    }
  }
  return out;
}

export function scanHardCodedPrNumbers(dir: string = ONTOLOGY_DIR): PrNumberHit[] {
  const hits: PrNumberHit[] = [];
  for (const file of collect(dir, [".json", ".md"])) {
    const rel = path.relative(dir, file);
    readFileSync(file, "utf-8").split(/\r?\n/).forEach((text, i) => {
      if (PR_NUMBER.test(text)) hits.push({ file: rel, line: i + 1, text: text.trim() });
    });
  }
  return hits;
}
