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
      true,
    );

    const longKy = hits.find((hit) => hit.id === "longKy");
    expect(longKy).toBeDefined();
    expect(longKy!.geometry).toBe("xung");
    expect(longKy!.catPoints).toBeGreaterThan(0);
    expect(longKy!.kyReliefRatio).toBe(0);
  });

  it("Tham + Hỏa đồng cung không phá cách → cộng Cát, không trừ hung", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [
        { name: "Tham Lang", layer: "major", brightness: "Miếu" },
        { name: "Hỏa Tinh", layer: "tough", brightness: "Đắc" },
      ],
    } as ChartPalace;

    const hits = detectPairRules([{ palace: menh, role: "focus" }], SCORING_WEIGHTS, true);
    const thamHoa = hits.find((hit) => hit.id === "thamHoa");
    expect(thamHoa).toBeDefined();
    expect(thamHoa!.catPoints).toBeGreaterThan(0);
    expect(thamHoa!.hungRelief).toBe(0);
  });

  it("Tham + Linh tam hợp → có cát × tamHopFactor", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [{ name: "Tham Lang", layer: "major", brightness: "Miếu" }],
    } as ChartPalace;
    const quan = {
      index: 8,
      branch: "Mão",
      name: "Quan Lộc",
      stars: [{ name: "Linh Tinh", layer: "tough", brightness: "Đắc" }],
    } as ChartPalace;

    const hits = detectPairRules(
      [
        { palace: menh, role: "focus" },
        { palace: quan, role: "tam-hop" },
      ],
      SCORING_WEIGHTS,
      true,
    );
    const thamHoa = hits.find((hit) => hit.id === "thamHoa");
    expect(thamHoa).toBeDefined();
    expect(thamHoa!.catPoints).toBe(
      Math.round(SCORING_WEIGHTS.thamHoaCat * SCORING_WEIGHTS.tamHopFactor),
    );
  });

  it("Tham + Hỏa + Hóa Kỵ trong khung → KHÔNG cộng cát, phá cách", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [
        { name: "Tham Lang", layer: "major", brightness: "Miếu" },
        { name: "Hỏa Tinh", layer: "tough", brightness: "Đắc" },
        { name: "Hóa Kỵ", source: "natal-mutagen", mutagen: "Kỵ" },
      ],
    } as ChartPalace;

    const hits = detectPairRules([{ palace: menh, role: "focus" }], SCORING_WEIGHTS, true);
    expect(hits.some((hit) => hit.id === "thamHoa")).toBe(false);
  });

  it("Tham + Hỏa + Kình Dương giao hội → phá cách", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [
        { name: "Tham Lang", layer: "major", brightness: "Miếu" },
        { name: "Hỏa Tinh", layer: "tough", brightness: "Đắc" },
      ],
    } as ChartPalace;
    const di = {
      index: 6,
      branch: "Sửu",
      name: "Thiên Di",
      stars: [{ name: "Kình Dương", layer: "tough", brightness: "Miếu" }],
    } as ChartPalace;

    const hits = detectPairRules(
      [
        { palace: menh, role: "focus" },
        { palace: di, role: "xung" },
      ],
      SCORING_WEIGHTS,
      true,
    );
    expect(hits.some((hit) => hit.id === "thamHoa")).toBe(false);
  });

  it("Hỏa không có Tham Lang → không thành cách", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [{ name: "Hỏa Tinh", layer: "tough", brightness: "Đắc" }],
    } as ChartPalace;

    const hits = detectPairRules([{ palace: menh, role: "focus" }], SCORING_WEIGHTS, true);
    expect(hits.some((hit) => hit.id === "thamHoa")).toBe(false);
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

    const hits = detectPairRules([{ palace: menh, role: "focus" }], SCORING_WEIGHTS, true);
    expect(hits.some((hit) => hit.id === "vuThamMo")).toBe(true);
  });

  it("Khung đủ Lộc+Quyền+Khoa → có tamKyCat", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [
        { name: "Hóa Lộc", source: "natal" },
        { name: "Hóa Quyền", source: "natal" },
        { name: "Hóa Khoa", source: "natal" },
      ],
    } as ChartPalace;

    const hits = detectPairRules([{ palace: menh, role: "focus" }], SCORING_WEIGHTS, true);
    expect(hits.some((hit) => hit.id === "tamKy")).toBe(true);
  });

  it("Khung đủ 3 nhưng có Hóa lưu (includeAnnual=false) → KHÔNG tính tamKyCat", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [
        { name: "Hóa Lộc", source: "natal" },
        { name: "Hóa Quyền", source: "natal" },
        { name: "Hóa Khoa", source: "annual-mutagen", mutagen: "Khoa" }, // Hóa Khoa lưu
      ],
    } as ChartPalace;

    const hits = detectPairRules([{ palace: menh, role: "focus" }], SCORING_WEIGHTS, false);
    expect(hits.some((hit) => hit.id === "tamKy")).toBe(false);
  });

  it("Chỉ 2 trong 3 → KHÔNG có bonus tamKyCat", () => {
    const menh = {
      index: 0,
      branch: "Mùi",
      name: "Mệnh",
      stars: [
        { name: "Hóa Lộc", source: "natal" },
        { name: "Hóa Khoa", source: "natal" },
      ],
    } as ChartPalace;

    const hits = detectPairRules([{ palace: menh, role: "focus" }], SCORING_WEIGHTS, true);
    expect(hits.some((hit) => hit.id === "tamKy")).toBe(false);
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
      true,
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
      true,
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
      true,
    );
    expect(hits.some((hit) => hit.id === "thaiToa")).toBe(true);
    expect(hits.some((hit) => hit.id === "quangQuy")).toBe(true);
  });
});
