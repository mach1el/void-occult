import { describe, expect, it } from "vitest";
import type { ChartPalace } from "@/types/chart";
import { detectPairRules } from "../pairs";
import { SCORING_WEIGHTS } from "../weights";

describe("detectPairRules", () => {
  it("Thanh Long Mệnh + Hóa Kỵ Thiên Di (xung) thành longKy", () => {
    const menh = {
      index: 0,
      branch: "Thìn",
      name: "Mệnh",
      stars: [{ name: "Thanh Long", layer: "misc" }],
    } as ChartPalace;
    const di = {
      index: 6,
      branch: "Tuất",
      name: "Thiên Di",
      stars: [{ name: "Hóa Kỵ", source: "natal-mutagen", mutagen: "Kỵ" }],
    } as ChartPalace;

    const hits = detectPairRules(
      [
        { palace: menh, role: "focus" },
        { palace: di, role: "xung" },
      ],
      SCORING_WEIGHTS,
    );

    const longKy = hits.find((hit) => hit.id === "longKy");
    expect(longKy).toBeDefined();
    expect(longKy!.geometry).toBe("xung");
    expect(longKy!.catPoints).toBeGreaterThan(0);
    expect(longKy!.kyReliefRatio).toBeGreaterThan(0);
  });

  it("Vũ + Tham trên mộ thành vuThamMo", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [
        { name: "Vũ Khúc", layer: "major", brightness: "Miếu" },
        { name: "Tham Lang", layer: "major", brightness: "Miếu" },
      ],
    } as ChartPalace;

    const hits = detectPairRules(
      [{ palace: menh, role: "focus" }],
      SCORING_WEIGHTS,
    );
    expect(hits.some((hit) => hit.id === "vuThamMo")).toBe(true);
  });

  it("Lộc Tồn + Thiên Mã thành locMa", () => {
    const menh = {
      index: 0,
      branch: "Dần",
      name: "Mệnh",
      stars: [
        { name: "Lộc Tồn", layer: "helper" },
        { name: "Thiên Mã", layer: "misc" },
      ],
    } as ChartPalace;

    const hits = detectPairRules(
      [{ palace: menh, role: "focus" }],
      SCORING_WEIGHTS,
    );
    expect(hits.some((hit) => hit.id === "locMa")).toBe(true);
  });

  it("Phi Liêm xung Bạch Hổ thành phiHo; Đào+Hồng thành daoHong", () => {
    const menh = {
      index: 0,
      branch: "Thìn",
      name: "Mệnh",
      stars: [
        { name: "Phi Liêm", layer: "harm" },
        { name: "Đào Hoa", layer: "romance" },
      ],
    } as ChartPalace;
    const di = {
      index: 6,
      branch: "Tuất",
      name: "Thiên Di",
      stars: [
        { name: "Bạch Hổ", layer: "harm" },
        { name: "Hồng Loan", layer: "romance" },
      ],
    } as ChartPalace;

    const hits = detectPairRules(
      [
        { palace: menh, role: "focus" },
        { palace: di, role: "xung" },
      ],
      SCORING_WEIGHTS,
    );
    expect(hits.some((hit) => hit.id === "phiHo")).toBe(true);
    expect(hits.some((hit) => hit.id === "daoHong")).toBe(true);
  });

  it("Tam Thai–Bát Tọa và Ân Quang–Thiên Quý thành cặp", () => {
    const menh = {
      index: 0,
      branch: "Thìn",
      name: "Mệnh",
      stars: [
        { name: "Tam Thai", layer: "helper" },
        { name: "Ân Quang", layer: "helper" },
      ],
    } as ChartPalace;
    const di = {
      index: 6,
      branch: "Tuất",
      name: "Thiên Di",
      stars: [
        { name: "Bát Tọa", layer: "helper" },
        { name: "Thiên Quý", layer: "helper" },
      ],
    } as ChartPalace;

    const hits = detectPairRules(
      [
        { palace: menh, role: "focus" },
        { palace: di, role: "xung" },
      ],
      SCORING_WEIGHTS,
    );
    expect(hits.some((hit) => hit.id === "thaiToa")).toBe(true);
    expect(hits.some((hit) => hit.id === "quangQuy")).toBe(true);
  });
});
