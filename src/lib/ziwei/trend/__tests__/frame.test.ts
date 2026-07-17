import { describe, expect, it } from "vitest";
import { getDaiVanTrend } from "../score";
import { makeChart, minimalFortune, palace } from "./fixtures";

describe("frame scoring (via getDaiVanTrend)", () => {
  it("Hóa Kỵ ở vùng mộ hung thấp hơn ở vùng mã", () => {
    const ky = {
      name: "Hóa Kỵ",
      source: "natal-mutagen" as const,
      mutagen: "Kỵ",
    };
    const mo = getDaiVanTrend(minimalFortune("Thìn", [ky]))[0]!;
    const ma = getDaiVanTrend(minimalFortune("Dần", [ky]))[0]!;
    expect(mo.hung).toBeLessThan(ma.hung);
    expect(mo.breakdown.hung.some((line) => line.reason.includes("vùng mộ"))).toBe(
      true,
    );
  });

  it("Thanh Long xung Hóa Kỵ: có cát cách, không trừ hung (Cát/Hung độc lập)", () => {
    const menh = palace({
      index: 0,
      branch: "Thìn",
      name: "Mệnh",
      isMenh: true,
      majorFortune: { order: 1, active: true, start: 10, end: 19 },
      stars: [{ name: "Thanh Long", layer: "misc" }],
    });
    const di = palace({
      index: 6,
      branch: "Tuất",
      name: "Thiên Di",
      majorFortune: { order: 2, active: false, start: 20, end: 29 },
      stars: [
        { name: "Hóa Kỵ", source: "natal-mutagen", mutagen: "Kỵ" },
      ],
    });
    const withPair = getDaiVanTrend(
      makeChart({
        palaces: [menh, di],
        menhBranch: "Thìn",
        menhIndex: 0,
        majorFortunePalace: menh,
        annualPalace: menh,
        voidMarkers: [],
        annualMutagens: [],
        natalMutagens: [],
      }),
    ).find((point) => point.isCurrent)!;

    expect(
      withPair.breakdown.cat.some((line) => line.source.includes("longKy")),
    ).toBe(true);
    expect(
      withPair.breakdown.hung.every(
        (line) =>
          line.points >= 0 ||
          line.source === "Ngũ Hành Vận" ||
          line.source === "Chuẩn hóa",
      ),
    ).toBe(true);
    expect(
      withPair.breakdown.hung.some((line) => line.source.includes("hóa giải")),
    ).toBe(false);
  });

  it("Sát Phá Tham Hãm + Kỵ → Combo Hung, không cộng Cát SPT", () => {
    const focus = palace({
      index: 0,
      branch: "Mão",
      name: "Điền Trạch",
      majorFortune: { order: 1, active: true, start: 35, end: 44 },
      stars: [
        { name: "Tham Lang", layer: "major", brightness: "Hãm" },
        { name: "Bạch Hổ", layer: "harm" },
      ],
    });
    const hop1 = palace({
      index: 4,
      branch: "Hợi",
      name: "Tật Ách",
      stars: [{ name: "Phá Quân", layer: "major", brightness: "Hãm" }],
    });
    const hop2 = palace({
      index: 8,
      branch: "Mùi",
      name: "Quan Lộc",
      stars: [
        { name: "Thất Sát", layer: "major", brightness: "Đắc" },
        { name: "Hóa Kỵ", source: "natal-mutagen", mutagen: "Kỵ" },
      ],
    });
    const point = getDaiVanTrend(
      makeChart({
        palaces: [focus, hop1, hop2],
        menhBranch: "Mùi",
        menhElement: "Lộ Bàng Thổ",
        menhIndex: 0,
        majorFortunePalace: focus,
        annualPalace: focus,
        voidMarkers: [],
        annualMutagens: [],
        natalMutagens: [],
      }),
    )[0]!;

    expect(
      point.breakdown.hung.some((line) => line.source.includes("satPhaThamHung")),
    ).toBe(true);
    expect(
      point.breakdown.cat.some((line) => line.source.includes("satPhaTham")),
    ).toBe(false);
  });

  it("Ngũ hành Cung khắc Mệnh: Cát ×0.75, Hung ×1.25 trên raw rồi clamp", () => {
    const focus = palace({
      index: 0,
      branch: "Mão", // Mộc
      name: "Điền Trạch",
      majorFortune: { order: 1, active: true, start: 35, end: 44 },
      stars: [
        { name: "Tả Phụ", layer: "helper" },
        { name: "Tham Lang", layer: "major", brightness: "Hãm" },
      ],
    });
    const point = getDaiVanTrend(
      makeChart({
        palaces: [focus],
        menhBranch: "Mùi",
        menhElement: "Lộ Bàng Thổ",
        menhIndex: 0,
        majorFortunePalace: focus,
        annualPalace: focus,
        voidMarkers: [],
        annualMutagens: [],
        natalMutagens: [],
      }),
    )[0]!;

    const catMul = point.breakdown.cat.find((line) => line.source === "Ngũ Hành Vận");
    const hungMul = point.breakdown.hung.find((line) => line.source === "Ngũ Hành Vận");
    expect(catMul?.reason).toContain("×0.75");
    expect(hungMul?.reason).toContain("×1.25");
    expect(point.breakdown.hung.every((line) => line.points >= 0 || line.source === "Ngũ Hành Vận" || line.source === "Chuẩn hóa")).toBe(true);
  });

  it("Chính tinh Đắc vào Cát; Mộ Trường Sinh vào Hung", () => {
    const focus = palace({
      index: 0,
      branch: "Ngọ",
      name: "Mệnh",
      isMenh: true,
      changSheng: "Mộ",
      majorFortune: { order: 1, active: true, start: 10, end: 19 },
      stars: [{ name: "Thiên Tướng", layer: "major", brightness: "Đắc" }],
    });
    const point = getDaiVanTrend(
      makeChart({
        palaces: [focus],
        menhBranch: "Ngọ",
        menhIndex: 0,
        majorFortunePalace: focus,
        annualPalace: focus,
        voidMarkers: [],
        annualMutagens: [],
        natalMutagens: [],
      }),
    )[0]!;
    expect(
      point.breakdown.cat.some(
        (line) => line.source.includes("Thiên Tướng") && line.points > 0,
      ),
    ).toBe(true);
    expect(
      point.breakdown.hung.some((line) => line.source.includes("Mộ")),
    ).toBe(true);
  });

  it("Vũ Tham trên mộ cộng cát cách vuThamMo", () => {
    const point = getDaiVanTrend(
      minimalFortune("Mùi", [
        { name: "Vũ Khúc", layer: "major", brightness: "Miếu" },
        { name: "Tham Lang", layer: "major", brightness: "Miếu" },
      ]),
    )[0]!;
    expect(
      point.breakdown.cat.some((line) => line.source.includes("vuThamMo")),
    ).toBe(true);
  });

  it("Song Hao đắc (Dần) hung thấp hơn Song Hao hãm (Tý) và có cát đắc", () => {
    const hao = { name: "Đại Hao", layer: "harm" as const };
    const dac = getDaiVanTrend(minimalFortune("Dần", [hao]))[0]!;
    const ham = getDaiVanTrend(minimalFortune("Tý", [hao]))[0]!;
    expect(dac.hung).toBeLessThan(ham.hung);
    expect(dac.breakdown.cat.some((line) => line.reason.includes("Song Hao đắc"))).toBe(
      true,
    );
  });

  it("phase 2: Bác Sĩ cát + Cô Quả hung + Đức cát vào breakdown", () => {
    const point = getDaiVanTrend(
      minimalFortune("Thìn", [
        { name: "Bác Sĩ", layer: "helper" },
        { name: "Quả Tú", layer: "harm" },
        { name: "Thiên Đức", layer: "helper" },
      ]),
    )[0]!;
    expect(point.breakdown.cat.some((line) => line.reason.includes("Bác Sĩ cát"))).toBe(
      true,
    );
    expect(point.breakdown.hung.some((line) => line.reason.includes("Cô Quả"))).toBe(
      true,
    );
    expect(point.breakdown.cat.some((line) => line.reason.includes("Đức tinh"))).toBe(
      true,
    );
  });

  it("phase 3: Thai Tọa + Quang Quý + Trường Sinh Đế Vượng", () => {
    const focus = palace({
      index: 0,
      branch: "Ngọ",
      name: "Mệnh",
      isMenh: true,
      changSheng: "Đế Vượng",
      majorFortune: { order: 1, active: true, start: 10, end: 19 },
      stars: [
        { name: "Tam Thai", layer: "helper" },
        { name: "Ân Quang", layer: "helper" },
        { name: "Quốc Ấn", layer: "helper" },
      ],
    });
    const point = getDaiVanTrend(
      makeChart({
        palaces: [focus],
        menhBranch: "Ngọ",
        menhIndex: 0,
        majorFortunePalace: focus,
        annualPalace: focus,
        voidMarkers: [],
        annualMutagens: [],
        natalMutagens: [],
      }),
    )[0]!;
    expect(point.breakdown.cat.some((line) => line.reason.includes("Thai Tọa"))).toBe(
      true,
    );
    expect(point.breakdown.cat.some((line) => line.reason.includes("Quang Quý"))).toBe(
      true,
    );
    expect(point.breakdown.cat.some((line) => line.source.includes("Đế Vượng"))).toBe(
      true,
    );
    expect(
      point.breakdown.cat.some((line) => line.reason.includes("Quan Ấn")),
    ).toBe(true);
  });

  it("phase 3: Trường Sinh Tuyệt tăng hung", () => {
    const focus = palace({
      index: 0,
      branch: "Hợi",
      name: "Mệnh",
      isMenh: true,
      changSheng: "Tuyệt",
      majorFortune: { order: 1, active: true, start: 10, end: 19 },
      stars: [],
    });
    const point = getDaiVanTrend(
      makeChart({
        palaces: [focus],
        menhBranch: "Hợi",
        menhIndex: 0,
        majorFortunePalace: focus,
        annualPalace: focus,
        voidMarkers: [],
        annualMutagens: [],
        natalMutagens: [],
      }),
    )[0]!;
    expect(point.breakdown.hung.some((line) => line.source.includes("Tuyệt"))).toBe(
      true,
    );
  });

  it("Đại vận chấm tam phương tứ chính: Hóa Kỵ gốc ở xung + chính tinh hãm ở tam hợp", () => {
    // Thìn xung Tuất; Thìn tam hợp Thân·Tý
    const menh = palace({
      index: 0,
      branch: "Thìn",
      name: "Mệnh",
      isMenh: true,
      majorFortune: { order: 1, active: true, start: 10, end: 19 },
      stars: [{ name: "Tử Vi", layer: "major", brightness: "Vượng" }],
    });
    const di = palace({
      index: 6,
      branch: "Tuất",
      name: "Thiên Di",
      stars: [
        { name: "Hóa Kỵ", source: "natal-mutagen", mutagen: "Kỵ" },
      ],
    });
    const quan = palace({
      index: 3,
      branch: "Thân",
      name: "Quan Lộc",
      stars: [{ name: "Cự Môn", layer: "major", brightness: "Hãm" }],
    });
    const point = getDaiVanTrend(
      makeChart({
        palaces: [menh, di, quan],
        menhBranch: "Thìn",
        menhIndex: 0,
        majorFortunePalace: menh,
        annualPalace: menh,
        voidMarkers: [],
        annualMutagens: [],
        natalMutagens: [
          { mutagen: "Kỵ", starName: "Cự Môn", palace: di },
        ],
        majorMutagens: [],
      }),
    )[0]!;

    expect(
      point.breakdown.hung.some(
        (line) =>
          line.reason.includes("xung chiếu") && line.reason.includes("Kỵ"),
      ),
    ).toBe(true);
    expect(
      point.breakdown.hung.some(
        (line) =>
          line.reason.includes("tam hợp") &&
          line.reason.includes("Hãm") &&
          line.source.includes("Cự Môn"),
      ),
    ).toBe(true);
    expect(
      point.breakdown.cat.some(
        (line) =>
          line.reason.includes("cung hạn") && line.source.includes("Tử Vi"),
      ),
    ).toBe(true);
  });
});
