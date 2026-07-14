/**
 * Sinh / kiểm tra golden snapshot cho 2 engine Tử Vi (nam-phai, trung-chau).
 *
 * Sử dụng:
 *   npx tsx scripts/gen-tuvi-golden.ts            # sinh (ghi đè) tests/golden/tuvi-*.json
 *   npx tsx scripts/gen-tuvi-golden.ts --verify    # so kết quả hiện tại với snapshot đã lưu, KHÔNG ghi đè
 *
 * QUAN TRỌNG: Ở Task 1, "engine hiện tại" là 2 file JS gốc trong pages/purple-star/,
 * chạy trong 1 jsdom Document được dựng thủ công (chưa hề sửa 1 dòng nào của 2 file đó).
 * Từ Task 2 trở đi, hàm `runEngine()` dưới đây sẽ được cập nhật để gọi thẳng
 * `calculate(input)` đã được export bình thường — cơ chế đọc input thay đổi,
 * nhưng bộ ca (golden-cases.ts) và 2 file snapshot JSON thì KHÔNG được đổi.
 */
import { JSDOM } from "jsdom";
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
  "nam-phai": path.join(ROOT, "pages/purple-star/tu-vi-engine-nam-phai.js"),
  "trung-chau": path.join(ROOT, "pages/purple-star/tu-vi-engine-trung-chau.js"),
};

interface EngineHarness {
  calculate(input: GoldenBirthInput): unknown;
}

/**
 * Dựng 1 jsdom Document với đúng các id mà 2 engine hiện tại cào (#solarDate,
 * #annualYear, #timezone, #birthHour, #gender, #flowBase), rồi import (dynamic)
 * cả 2 file engine JS gốc — kích hoạt els cache + đăng ký window.TuViEngines.
 * Dùng <input> thuần cho mọi field (kể cả chỗ UI thật là <select>) vì engine chỉ
 * đọc .value, không quan tâm loại widget.
 */
async function setupLegacyDomHarness(): Promise<Record<School, EngineHarness>> {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <input id="solarDate">
      <input id="annualYear">
      <input id="timezone">
      <input id="birthHour">
      <input id="gender">
      <input id="flowBase">
    </body></html>`,
    { url: "http://localhost/" }
  );

  (globalThis as unknown as { window: unknown }).window = dom.window;
  (globalThis as unknown as { document: Document }).document = dom.window.document as unknown as Document;

  const doc = dom.window.document;
  function setValue(id: string, value: string) {
    const el = doc.getElementById(id) as HTMLInputElement | null;
    if (!el) throw new Error(`Không tìm thấy #${id} trong jsdom harness`);
    el.value = value;
  }

  await Promise.all([
    import(ENGINE_PATHS["nam-phai"]),
    import(ENGINE_PATHS["trung-chau"]),
  ]);

  const win = dom.window as unknown as {
    TuViEngines?: Partial<Record<School, { calculate(): unknown }>>;
  };

  const harness: Partial<Record<School, EngineHarness>> = {};
  for (const school of SCHOOLS) {
    const engine = win.TuViEngines?.[school];
    if (!engine) throw new Error(`window.TuViEngines["${school}"] không được đăng ký`);
    harness[school] = {
      calculate(input: GoldenBirthInput) {
        setValue("solarDate", input.solarDate);
        setValue("annualYear", input.annualYear);
        setValue("timezone", input.timezone);
        setValue("birthHour", input.birthHour);
        setValue("gender", input.gender);
        setValue("flowBase", input.flowBase);
        return engine.calculate();
      },
    };
  }
  return harness as Record<School, EngineHarness>;
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
  const harness = await setupLegacyDomHarness();

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
