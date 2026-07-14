/**
 * Sinh / kiểm tra golden snapshot cho 2 engine Tử Vi (nam-phai, trung-chau).
 *
 * Sử dụng:
 *   npx tsx scripts/gen-tuvi-golden.ts            # sinh (ghi đè) tests/golden/tuvi-*.json
 *   npx tsx scripts/gen-tuvi-golden.ts --verify    # so kết quả hiện tại với snapshot đã lưu, KHÔNG ghi đè
 *
 * Từ Commit 2 (cắt dây DOM), 2 engine đã export `calculate(input)` bình thường —
 * không còn cần dựng jsdom/window.TuViEngines nữa, chỉ import thẳng và gọi.
 * Bộ ca (golden-cases.ts) và 2 file snapshot JSON không đổi qua các commit.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOLDEN_CASES, type GoldenBirthInput } from "./golden-cases";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GOLDEN_DIR = path.join(ROOT, "tests/golden");

const SCHOOLS = ["nam-phai", "trung-chau"] as const;
type School = (typeof SCHOOLS)[number];

const ENGINE_PATHS: Record<School, string> = {
  "nam-phai": path.join(ROOT, "src/lib/ziwei/engine-nam-phai.ts"),
  "trung-chau": path.join(ROOT, "src/lib/ziwei/engine-trung-chau.ts"),
};

interface EngineModule {
  calculate(input: GoldenBirthInput): unknown;
}

async function loadEngines(): Promise<Record<School, EngineModule>> {
  const [namPhai, trungChau] = await Promise.all([
    import(ENGINE_PATHS["nam-phai"]),
    import(ENGINE_PATHS["trung-chau"]),
  ]);
  return {
    "nam-phai": namPhai as unknown as EngineModule,
    "trung-chau": trungChau as unknown as EngineModule,
  };
}

/**
 * Chuyển 1 object graph có thể chứa tham chiếu vòng (xem H6: monthlyPalaces[i]
 * và palace.flowMonths[j] trỏ vào chính nhau) thành dạng an toàn cho JSON:
 * lần gặp đầu tiên của 1 object được khai triển đầy đủ, lần gặp lại sau đó
 * được thay bằng { "$ref": "<đường dẫn lần đầu>" } — không mất dữ liệu nào,
 * chỉ khử trùng lặp tham chiếu (kiểu Crockford JSON.decycle).
 */
function decycle(root: unknown): unknown {
  const seen = new Map<object, string>();
  function walk(value: unknown, pathStr: string): unknown {
    if (value === null || typeof value !== "object") return value;
    const obj = value as object;
    const existing = seen.get(obj);
    if (existing) return { $ref: existing };
    seen.set(obj, pathStr);
    if (Array.isArray(obj)) {
      return obj.map((item, i) => walk(item, `${pathStr}[${i}]`));
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      out[key] = walk((obj as Record<string, unknown>)[key], `${pathStr}.${key}`);
    }
    return out;
  }
  return walk(root, "$");
}

interface GoldenFile {
  cases: Array<{ id: string; label: string; input: GoldenBirthInput; output: unknown }>;
}

function goldenFilePath(school: School): string {
  return path.join(GOLDEN_DIR, `tuvi-${school}.json`);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** So sánh sâu 2 giá trị đã decycle, trả về đường dẫn khác biệt đầu tiên (nếu có). */
function firstDiff(a: unknown, b: unknown, pathStr = "$"): string | null {
  if (a === b) return null;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${pathStr} (length ${a.length} != ${b.length})`;
    for (let i = 0; i < a.length; i++) {
      const d = firstDiff(a[i], b[i], `${pathStr}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      const d = firstDiff(a[key], b[key], `${pathStr}.${key}`);
      if (d) return d;
    }
    return null;
  }
  return `${pathStr} (${JSON.stringify(a)} != ${JSON.stringify(b)})`;
}

function printCoverage(school: School, records: Array<{ input: GoldenBirthInput; output: unknown }>) {
  const yearBranches = new Set<string>();
  const hourBranches = new Set<string>();
  let leapCount = 0;
  let minDay = Infinity;
  let maxDay = -Infinity;

  for (const r of records) {
    const out = r.output as Record<string, unknown> | null;
    hourBranches.add(r.input.birthHour);
    if (isPlainObject(out)) {
      if (typeof out.yearBranch === "string") yearBranches.add(out.yearBranch);
      const lunar = out.lunar as Record<string, unknown> | undefined;
      if (isPlainObject(lunar)) {
        if (lunar.leap) leapCount++;
        if (typeof lunar.day === "number") {
          minDay = Math.min(minDay, lunar.day);
          maxDay = Math.max(maxDay, lunar.day);
        }
      }
    }
  }

  console.log(
    `  [${school}] records=${records.length} yearBranches=${yearBranches.size}/12 ` +
      `hourBranches=${hourBranches.size}/12 leapCases=${leapCount} lunarDayRange=${minDay}-${maxDay}`
  );
}

async function main() {
  const verify = process.argv.includes("--verify");
  const harness = await loadEngines();

  mkdirSync(GOLDEN_DIR, { recursive: true });

  let anyMismatch = false;

  for (const school of SCHOOLS) {
    const engine = harness[school];
    const records = GOLDEN_CASES.map((c) => ({
      id: c.id,
      label: c.label,
      input: c.input,
      output: decycle(engine.calculate(c.input)),
    }));

    if (verify) {
      const filePath = goldenFilePath(school);
      const existing = JSON.parse(readFileSync(filePath, "utf-8")) as GoldenFile;
      const byId = new Map(existing.cases.map((c) => [c.id, c]));

      let mismatches = 0;
      for (const rec of records) {
        const expected = byId.get(rec.id);
        if (!expected) {
          console.error(`  ✗ [${school}] ca "${rec.id}" không có trong snapshot đã lưu`);
          mismatches++;
          continue;
        }
        const diff = firstDiff(rec.output, expected.output);
        if (diff) {
          console.error(`  ✗ [${school}] ca "${rec.id}" (${rec.label}) lệch tại ${diff}`);
          mismatches++;
        }
      }
      if (mismatches > 0) {
        anyMismatch = true;
        console.error(`  => [${school}] ${mismatches}/${records.length} ca KHÔNG khớp snapshot`);
      } else {
        console.log(`  => [${school}] ${records.length}/${records.length} ca khớp 100% snapshot`);
      }
      printCoverage(school, records);
    } else {
      const file: GoldenFile = { cases: records };
      writeFileSync(goldenFilePath(school), JSON.stringify(file, null, 2) + "\n", "utf-8");
      console.log(`  [${school}] đã ghi ${records.length} ca vào ${goldenFilePath(school)}`);
      printCoverage(school, records);
    }
  }

  if (verify && anyMismatch) {
    console.error("\n❌ VERIFY THẤT BẠI — có ca lệch snapshot. DỪNG, báo cáo, không tự sửa snapshot.");
    process.exit(1);
  }
  if (verify) {
    console.log("\n✅ VERIFY THÀNH CÔNG — khớp 100% snapshot ở mọi ca.");
  } else {
    console.log("\n✅ Đã sinh xong golden snapshot. Vui lòng duyệt trước khi sang Task 2.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
