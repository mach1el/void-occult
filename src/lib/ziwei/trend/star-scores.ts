/**
 * Loader bảng điểm sao cho engine radar vận khí 12 cung.
 *
 * SSOT = `star-scores.csv` (parse lúc runtime). Muốn tuning chỉ cần sửa CSV,
 * KHÔNG đụng code. File này chỉ lo parse + tra cứu.
 *
 * ── Đã sửa so với CSV gốc của thầy (data check đối chiếu engine thật) ──
 * - Tên sao sai → không bao giờ khớp engine, đã đổi:
 *     "Tả Phù" → "Tả Phụ" · "Thiên Diêu" → "Thiên Riêu" · "Trường Sinh" → "Tràng Sinh"
 * - "Quan Phù" (vòng Thái Tuế) và "Quan Phủ" (vòng Lộc Tồn) là HAI sao khác
 *   nhau — CSV gốc chỉ có Quan Phù; đã bổ sung Quan Phủ.
 * - Bổ sung Tier 1 (14 chính tinh, dựng từ spec v1) + 25 sao engine CÓ sinh ra
 *   nhưng CSV gốc thiếu điểm (notes ghi "ĐỀ XUẤT" — chờ thầy duyệt).
 *
 * ── Cột `element` KHÔNG dùng ──
 * Ngũ hành của sao lấy từ `engine.elementForStar()` (thầy chốt): bảng hành
 * khác nhau giữa Nam phái / Trung Châu, và CSV lệch ở Ân Quang, Thiên Phúc,
 * Phượng Các, Tam Thai. Giữ cột trong CSV để đối chiếu, engine mới là chuẩn.
 */

import rawCsv from "./star-scores.csv?raw";

/** is_good: 1 = cát, 0 = hung, 2 = đổi dấu theo vị trí (đắc/hãm). */
export type StarPolarity = "cat" | "hung" | "conditional";

export interface StarScoreRow {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  /** Điểm khi Bình hòa / không xác định được vị trí. */
  base: number;
  /** Điểm neo khi Miếu / Vượng / Đắc. */
  dac: number;
  /** Điểm neo khi Hãm. */
  ham: number;
  group: string;
  polarity: StarPolarity;
  notes: string;
}

/** Parse một dòng CSV, có hỗ trợ ô bọc dấu ngoặc kép. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return cells;
}

const POLARITY: Record<string, StarPolarity> = {
  "1": "cat",
  "0": "hung",
  "2": "conditional",
};

function parseRows(csv: string): StarScoreRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const header = parseCsvLine(lines[0]!);
  const col = (name: string) => header.indexOf(name);
  const iId = col("id");
  const iName = col("star_name");
  const iTier = col("tier");
  const iBase = col("default_point");
  const iDac = col("dac_dia_point");
  const iHam = col("ham_dia_point");
  const iGroup = col("star_group");
  const iGood = col("is_good");
  const iNotes = col("notes");

  return lines.slice(1).map((line) => {
    const c = parseCsvLine(line);
    return {
      id: c[iId] ?? "",
      name: c[iName] ?? "",
      tier: Number(c[iTier]) as 1 | 2 | 3 | 4,
      base: Number(c[iBase]),
      dac: Number(c[iDac]),
      ham: Number(c[iHam]),
      group: c[iGroup] ?? "",
      polarity: POLARITY[c[iGood] ?? "1"] ?? "cat",
      notes: c[iNotes] ?? "",
    };
  });
}

export const STAR_SCORES: StarScoreRow[] = parseRows(rawCsv);

const BY_NAME = new Map<string, StarScoreRow>(
  STAR_SCORES.map((row) => [row.name, row]),
);

/**
 * Tra sao theo tên engine. Chuẩn hóa tiền tố lưu niên ("Lưu ") và đại vận
 * ("ĐV Hóa Lộc") — trừ "Lưu Hà" vốn là tên thật của một bại tinh, không phải
 * tiền tố lưu.
 */
export function findStarScore(name: string): StarScoreRow | undefined {
  const direct = BY_NAME.get(name);
  if (direct) return direct;
  if (name === "Lưu Hà") return undefined;
  return BY_NAME.get(name.replace(/^(Lưu|ĐV)\s+/, ""));
}
