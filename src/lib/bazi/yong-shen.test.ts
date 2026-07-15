import { expect, test } from "vitest";
import { generateBaziChart } from "./bazi-engine";
import { calculateElementStrength, ElementStrength } from "./element-strength";
import { determineYongShen } from "./yong-shen";

test("YongShen PhuUc logic", () => {
  const chart = generateBaziChart(new Date("1990-01-01T12:00:00Z"), 105.8, 420, "M");
  const strength = calculateElementStrength(chart);
  const result = determineYongShen(strength, chart.month.branch);

  expect(["vượng", "nhược", "trung hòa"]).toContain(result.dayMasterVerdict);
  expect(result.reasoning.length).toBeGreaterThan(0);
  expect(result.dungThan.length).toBeGreaterThan(0);

  if (result.dayMasterVerdict !== "trung hòa") {
    expect(result.method).toBe("phu-uc");
    expect(result.hyThan.length).toBeGreaterThan(0);
  } else {
    expect(result.method).toBe("dieu-hau");
  }
});

function mockStrength(verdict: "vượng" | "trung hòa" | "nhược", scorePercentage: number): ElementStrength {
  return {
    method: "mock",
    scores: { Mộc: 0, Hỏa: 0, Thổ: 0, Kim: 0, Thủy: 0 },
    normalized: { Mộc: 0, Hỏa: 0, Thổ: 0, Kim: 0, Thủy: 0 },
    dayMasterElement: "Mộc",
    dayMasterStrength: { score: 0, verdict, threshold: 50, scorePercentage },
    breakdown: [],
  };
}

test("Trung hòa: Dụng Thần không rỗng, tham chiếu Điều Hậu", () => {
  const strength = mockStrength("trung hòa", 50);
  const result = determineYongShen(strength, "Tý");

  expect(result.dungThan.length).toBeGreaterThan(0);
  expect(result.confidence).toBe("cần cân nhắc");
  expect(result.method).toBe("dieu-hau");
});

test("Trung hòa, sinh mùa Đông (Hợi/Tý/Sửu) → tham chiếu Hỏa", () => {
  const strength = mockStrength("trung hòa", 50);
  for (const branch of ["Hợi", "Tý", "Sửu"]) {
    const result = determineYongShen(strength, branch);
    expect(result.dungThan).toEqual(["Hỏa"]);
  }
});

test("Trung hòa, sinh mùa Hạ (Tỵ/Ngọ/Mùi) → tham chiếu Thủy", () => {
  const strength = mockStrength("trung hòa", 50);
  for (const branch of ["Tỵ", "Ngọ", "Mùi"]) {
    const result = determineYongShen(strength, branch);
    expect(result.dungThan).toEqual(["Thủy"]);
  }
});

test("Nhật Chủ vượng/nhược rõ ràng vẫn dùng Phù Ức như cũ (không hồi quy)", () => {
  const weak = determineYongShen(mockStrength("nhược", 30), "Tý");
  expect(weak.method).toBe("phu-uc");
  expect(weak.methodLabel).toBe("Pháp Phù Ức");
  expect(weak.dungThan.length).toBeGreaterThan(0);

  const strong = determineYongShen(mockStrength("vượng", 70), "Ngọ");
  expect(strong.method).toBe("phu-uc");
  expect(strong.methodLabel).toBe("Pháp Phù Ức");
  expect(strong.dungThan.length).toBeGreaterThan(0);
});
