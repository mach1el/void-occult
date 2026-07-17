import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "../../engine-nam-phai";
import {
  getPalaceStrengths,
  RADAR_WEIGHTS,
  type RadarWeights,
} from "../palace-radar";
import { birthInput, makeChart, palace } from "./fixtures";

/** 12 cung đủ nhánh, chỉ khác nhau ở sao — dùng để so tương quan. */
function twelvePalaceChart(
  menhStars: NonNullable<ReturnType<typeof palace>>["stars"],
  phuMauStars: NonNullable<ReturnType<typeof palace>>["stars"],
) {
  const branches = [
    "Mùi", "Ngọ", "Tỵ", "Thìn", "Mão", "Dần",
    "Sửu", "Tý", "Hợi", "Tuất", "Dậu", "Thân",
  ];
  const names = [
    "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
    "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ",
  ];
  return makeChart({
    palaces: branches.map((branch, index) =>
      palace({
        index,
        branch,
        name: names[index]!,
        isMenh: index === 0,
        stars: index === 0 ? menhStars : index === 1 ? phuMauStars : [],
      }),
    ),
    menhIndex: 0,
    thanIndex: 1,
    voidMarkers: [],
    natalMutagens: [],
    annualMutagens: [],
    majorMutagens: [],
  });
}

describe("getPalaceStrengths (radar vận khí)", () => {
  it("trả đúng 12 cung, tất định, rollup khớp điểm thô, khởi từ Mệnh", () => {
    const chart = calculateNamPhai(birthInput);
    const first = getPalaceStrengths(chart, { school: "nam-phai" });
    expect(first).toEqual(getPalaceStrengths(chart, { school: "nam-phai" }));
    expect(first).toHaveLength(12);
    expect(first[0]?.palace).toBe("Mệnh");
    for (const item of first) {
      // Rollup (bản cung + đối cung + tam hợp) phải cộng đúng bằng điểm thô —
      // sai số ≤0.1 chỉ do làm tròn hiển thị từng dòng, KHÔNG trôi dạt.
      const sum = item.breakdown.reduce((acc, line) => acc + line.points, 0);
      expect(Math.abs(sum - item.raw)).toBeLessThanOrEqual(0.15);
    }
  });

  it("điểm nằm trong thang tuyệt đối 0–100", () => {
    const chart = calculateNamPhai(birthInput);
    for (const item of getPalaceStrengths(chart, { school: "nam-phai" })) {
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(100);
    }
  });

  it("cung chính tinh Miếu + lục cát vững hơn cung toàn sát tinh", () => {
    const chart = twelvePalaceChart(
      [
        { name: "Tử Vi", layer: "major", brightness: "Miếu" },
        { name: "Tả Phụ", layer: "helper" },
        { name: "Hữu Bật", layer: "helper" },
      ],
      [
        { name: "Thất Sát", layer: "major", brightness: "Hãm" },
        { name: "Kình Dương", layer: "tough" },
        { name: "Đà La", layer: "tough" },
      ],
    );
    const s = getPalaceStrengths(chart, { school: "nam-phai" });
    expect(s.find((i) => i.palace === "Mệnh")!.score).toBeGreaterThan(
      s.find((i) => i.palace === "Phụ Mẫu")!.score,
    );
  });

  it("đổi RadarWeights → radar đổi", () => {
    const chart = calculateNamPhai(birthInput);
    const boosted: RadarWeights = {
      ...RADAR_WEIGHTS,
      mThuan: RADAR_WEIGHTS.mThuan + 1,
    };
    expect(
      getPalaceStrengths(chart, { school: "nam-phai", weights: boosted }),
    ).not.toEqual(getPalaceStrengths(chart, { school: "nam-phai" }));
  });

  it("Tam Phương Tứ Chính: cung trống hưởng lây từ tam hợp/xung chiếu", () => {
    // Mệnh (Mùi) trống; tam hợp Mùi = Hợi·Mão. Đặt sao tốt ở Tài Bạch (Hợi).
    const weak = twelvePalaceChart([], []);
    const strongTamHop = twelvePalaceChart([], []);
    const taiBach = strongTamHop.palaces.find((p) => p.branch === "Hợi")!;
    taiBach.stars = [
      { name: "Tử Vi", layer: "major", brightness: "Miếu" },
      { name: "Thiên Khôi", layer: "helper" },
    ];

    const a = getPalaceStrengths(weak, { school: "nam-phai" }).find(
      (i) => i.palace === "Mệnh",
    )!;
    const b = getPalaceStrengths(strongTamHop, { school: "nam-phai" }).find(
      (i) => i.palace === "Mệnh",
    )!;
    expect(b.score).toBeGreaterThan(a.score);
  });

  it("Vô chính diệu mượn chính tinh đối cung", () => {
    // Mệnh (Mùi) VCD; đối cung Thiên Di (Sửu) có Tử Vi Miếu → phải mượn.
    const chart = twelvePalaceChart([], []);
    const thienDi = chart.palaces.find((p) => p.branch === "Sửu")!;
    thienDi.stars = [{ name: "Tử Vi", layer: "major", brightness: "Miếu" }];

    const menh = getPalaceStrengths(chart, { school: "nam-phai" }).find(
      (i) => i.palace === "Mệnh",
    )!;
    expect(
      menh.detail.some((line) => line.reason.includes("mượn")),
    ).toBe(true);
  });

  it("VCD 3 tầng: ≥2 Không →1.3+bonus · 1 Tuần/Triệt →1.0 · không có →0.7", () => {
    const mk = (
      stars: NonNullable<ReturnType<typeof palace>>["stars"],
      voids: { type: string; branches: string[] }[],
    ) => {
      const c = twelvePalaceChart(stars ?? [], []);
      // Mệnh (Mùi) VCD; đối cung Thiên Di (Sửu) có chính tinh để mượn.
      const thienDi = c.palaces.find((p) => p.branch === "Sửu")!;
      thienDi.stars = [{ name: "Tử Vi", layer: "major", brightness: "Miếu" }];
      return { ...c, voidMarkers: voids };
    };
    const env = (chart: ReturnType<typeof mk>) =>
      getPalaceStrengths(chart, { school: "nam-phai" })
        .find((i) => i.palace === "Mệnh")!
        .detail.find((l) => l.source === "Hệ số môi trường")?.reason ?? "";
    const detail = (chart: ReturnType<typeof mk>) =>
      getPalaceStrengths(chart, { school: "nam-phai" }).find(
        (i) => i.palace === "Mệnh",
      )!.detail;

    // Tier 1: Tuần + Địa Không = 2 sao Không → ×1.3 + bonus +10.
    const tier1 = mk([{ name: "Địa Không", layer: "harm" }], [
      { type: "Tuần", branches: ["Mùi"] },
    ]);
    expect(env(tier1)).toContain("×1.3");
    expect(detail(tier1).some((l) => l.reason.includes("Đắc Tam Không"))).toBe(true);

    // Tier 2: chỉ 1 Tuần → nhà có nóc → ×1.0 (không có dòng hệ số vì t === 1).
    const tier2 = mk([], [{ type: "Tuần", branches: ["Mùi"] }]);
    expect(detail(tier2).some((l) => l.reason.includes("Đắc Tam Không"))).toBe(false);
    expect(env(tier2)).toBe(""); // t = 1.0 → không phát sinh dòng điều chỉnh
    // Vẫn phải mượn được chính tinh đối cung.
    expect(detail(tier2).some((l) => l.reason.includes("mượn"))).toBe(true);

    // Tier 3: không Tuần/Triệt → nhà không nóc → ×0.7.
    expect(env(mk([], []))).toContain("×0.7");
  });

  it("M_nh đồng nhất: cùng quan hệ ngũ hành → cùng hệ số, dù sao cát hay hãm", () => {
    // Regression: trước đây hệ số key theo DẤU điểm nên Thái Âm (chính tinh
    // Thủy, hãm → điểm âm) bị gán "mệnh chế được sát ×0.7", trong khi sao Thủy
    // điểm dương lại ×0.9 — cùng quan hệ mà ra hai hệ số.
    // Cả hai đều Tier ≤2 để cùng chịu ngũ hành.
    const chart = {
      ...twelvePalaceChart(
        [
          { name: "Thái Âm", layer: "major", brightness: "Hãm" }, // Tier 1, Thủy, âm
          { name: "Hữu Bật", layer: "helper" }, // Tier 2, Thủy, dương
        ],
        [],
      ),
      menhElement: "Thổ", // Thổ khắc Thủy → cả hai đều là "mệnh khắc sao"
    };
    const menh = getPalaceStrengths(chart, { school: "nam-phai" }).find(
      (i) => i.palace === "Mệnh",
    )!;
    const thaiAm = menh.detail.find((l) => l.source === "Thái Âm")!;
    const huuBat = menh.detail.find((l) => l.source === "Hữu Bật")!;

    expect(thaiAm.reason).toContain("mệnh khắc sao (khắc xuất)×0.9");
    expect(huuBat.reason).toContain("mệnh khắc sao (khắc xuất)×0.9");
    // Chính tinh hãm KHÔNG được gán nhãn sát tinh.
    expect(thaiAm.reason).not.toContain("sát");
  });

  it("Ngũ hành CHỈ áp Tier 1 & 2 — Tier 3/4 giữ nguyên điểm gốc", () => {
    const chart = {
      ...twelvePalaceChart(
        [
          { name: "Thái Âm", layer: "major", brightness: "Hãm" }, // Tier 1 Thủy
          { name: "Thiên Việt", layer: "helper" }, // Tier 2 Hỏa
          { name: "Thiên Hỷ", layer: "romance" }, // Tier 3 Thủy
          { name: "Long Đức", layer: "helper" }, // Tier 4 Thủy
        ],
        [],
      ),
      menhElement: "Thổ",
    };
    const menh = getPalaceStrengths(chart, { school: "nam-phai" }).find(
      (i) => i.palace === "Mệnh",
    )!;
    const line = (n: string) => menh.detail.find((l) => l.source === n)!;

    // Tier 1 & 2 → CÓ ngũ hành
    expect(line("Thái Âm").reason).toContain("×0.9");
    expect(line("Thiên Việt").reason).toContain("×1.2");
    // Tier 3 & 4 → KHÔNG ngũ hành, giữ nguyên điểm CSV
    expect(line("Thiên Hỷ").reason).not.toContain("×");
    expect(line("Thiên Hỷ").points).toBe(2.5);
    expect(line("Long Đức").reason).not.toContain("×");
    expect(line("Long Đức").points).toBe(1.5);
  });

  it("Tuần/Triệt: Miếu→0.6 · Bình→0.5 · Hãm→0.35", () => {
    const mk = (brightness: string) => {
      const c = twelvePalaceChart(
        [{ name: "Tử Vi", layer: "major", brightness }],
        [],
      );
      return { ...c, voidMarkers: [{ type: "Tuần", branches: ["Mùi"] }] };
    };
    const note = (b: string) =>
      getPalaceStrengths(mk(b), { school: "nam-phai" })
        .find((i) => i.palace === "Mệnh")!
        .detail.find((l) => l.source === "Hệ số môi trường")!.reason;

    expect(note("Miếu")).toContain("×0.6");
    expect(note("Bình")).toContain("×0.5");
    expect(note("Hãm")).toContain("×0.35");
  });

  it("Tuần/Triệt: ≥3 lục sát HÃM override cung hung dù chính tinh Miếu", () => {
    // Mùi KHÔNG thuộc vùng đắc của Kình/Đà (tứ mộ có Mùi) → chọn sao hãm ở Mùi:
    // Địa Không/Địa Kiếp đắc ở tứ sinh nên ở Mùi là hãm; Hỏa/Linh đắc ở
    // Dần·Mão·Thìn·Tỵ·Ngọ·Tuất nên ở Mùi cũng hãm.
    const c = twelvePalaceChart(
      [
        { name: "Tử Vi", layer: "major", brightness: "Miếu" },
        { name: "Địa Không", layer: "harm" },
        { name: "Địa Kiếp", layer: "harm" },
        { name: "Hỏa Tinh", layer: "harm" },
      ],
      [],
    );
    const chart = { ...c, voidMarkers: [{ type: "Tuần", branches: ["Mùi"] }] };
    const note = getPalaceStrengths(chart, { school: "nam-phai" })
      .find((i) => i.palace === "Mệnh")!
      .detail.find((l) => l.source === "Hệ số môi trường")!.reason;

    // Có Tử Vi Miếu nhưng 3 lục sát hãm → phải override về 0.35, không phải 0.6.
    expect(note).toContain("override cung hung");
    expect(note).toContain("×0.35");
  });

  it("làm tròn đối xứng quanh 0", () => {
    // Math.round(-1.75*10)/10 = -1.7 (lệch), helper phải cho -1.8.
    const chart = calculateNamPhai(birthInput);
    for (const item of getPalaceStrengths(chart, { school: "nam-phai" })) {
      for (const line of [...item.detail, ...item.breakdown]) {
        expect(Math.abs(line.points * 10 - Math.round(line.points * 10))).toBeLessThan(1e-6);
      }
    }
  });
});
