import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { starColor } from "./CompactChart";
import type { ChartStar } from "@/types/chart";

const compactChartSource = readFileSync(
  resolve(process.cwd(), "src/components/ziwei/chart/CompactChart.tsx"),
  "utf8",
);

test("lá số compact giữ ô cung cao 248 (không rút về tỉ lệ gần vuông)", () => {
  expect(compactChartSource).toMatch(/const CELL_HEIGHT = 248/);
  expect(compactChartSource).toMatch(/const HEIGHT = CELL_HEIGHT \* 4/);
  expect(compactChartSource).not.toMatch(/const CELL_HEIGHT = 224/);
});

test("Vũ Khúc (Kim) và Tử Vi (Thổ) nhận màu ngũ hành khác nhau", () => {
  const kimStar: ChartStar = { name: "Vũ Khúc", layer: "major" };
  const thoStar: ChartStar = { name: "Tử Vi", layer: "major" };
  const kimColor = starColor(kimStar, "nam-phai");
  const thoColor = starColor(thoStar, "nam-phai");
  expect(kimColor).toBe("var(--element-kim)");
  expect(thoColor).toBe("var(--element-tho)");
  expect(kimColor).not.toBe(thoColor);
});

test("Sao tứ hóa dùng token --mutagen-*, không còn hex/token trang trí", () => {
  const hoaKy: ChartStar = { name: "Hóa Kỵ", source: "natal-mutagen" };
  const hoaLoc: ChartStar = { name: "Hóa Lộc", source: "natal-mutagen" };
  const hoaQuyen: ChartStar = { name: "Hóa Quyền", source: "natal-mutagen" };
  const hoaKhoa: ChartStar = { name: "Hóa Khoa", source: "natal-mutagen" };
  expect(starColor(hoaKy, "nam-phai")).toBe("var(--mutagen-ky)");
  expect(starColor(hoaLoc, "nam-phai")).toBe("var(--mutagen-loc)");
  expect(starColor(hoaQuyen, "nam-phai")).toBe("var(--mutagen-quyen)");
  expect(starColor(hoaKhoa, "nam-phai")).toBe("var(--mutagen-khoa)");
});
