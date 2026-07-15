import { BaziConventions, DEFAULT_CONVENTIONS } from "./conventions";
import { ElementStrength } from "./element-strength";
import { Element, getGeneratedByElement, getGeneratingElement, getOvercomeByElement, getOvercomingElement } from "./elements";

export type YongShenMethod = "phu-uc" | "dieu-hau" | "thong-quan";

export interface YongShenResult {
  method: YongShenMethod;
  methodLabel: string;
  dayMasterVerdict: "vượng" | "trung hòa" | "nhược";
  dungThan: Element[];
  hyThan: Element[];
  kyThan: Element[];
  reasoning: string[];
  confidence: "rõ ràng" | "cần cân nhắc";
}

export function determineYongShen(
  strength: ElementStrength,
  monthBranch: string,
  conventions: BaziConventions = DEFAULT_CONVENTIONS
): YongShenResult {
  const method = conventions.baziYongShenMethod;

  if (method === "phu-uc") {
    return determineYongShenPhuUc(strength, monthBranch);
  }

  // Fallback hoặc các phương pháp khác nếu implement sau
  return determineYongShenPhuUc(strength, monthBranch);
}

const WINTER_BRANCHES = ["Hợi", "Tý", "Sửu"];
const SUMMER_BRANCHES = ["Tỵ", "Ngọ", "Mùi"];

/**
 * Điều Hậu (Hàn Noãn) — dùng làm nguồn tham chiếu khi Phù Ức không kết luận
 * được (trung hòa). Nguồn: quy tắc cổ điển "Đông sinh dụng Hỏa, Hạ sinh dụng
 * Thủy" (điều hòa khí hậu lạnh/nóng của tháng sinh).
 * Xuân (Dần/Mão/Thìn) và Thu (Thân/Dậu/Tuất): quy tắc đầy đủ phụ thuộc Can
 * Nhật Chủ (khô/ẩm) nhưng hệ thống này chưa có bảng đối chiếu đáng tin cho
 * từng Can — không bịa, nên liệt kê cả Thủy và Hỏa làm hướng tham khảo.
 */
function determineDieuHauFallback(monthBranch: string): { dungThan: Element[]; reasoning: string[] } {
  if (WINTER_BRANCHES.includes(monthBranch)) {
    return {
      dungThan: ["Hỏa"],
      reasoning: [`Điều Hậu: tháng sinh (chi ${monthBranch}) thuộc mùa Đông, khí hậu hàn lạnh — tham chiếu thiên về Hỏa để sưởi ấm cục diện.`],
    };
  }
  if (SUMMER_BRANCHES.includes(monthBranch)) {
    return {
      dungThan: ["Thủy"],
      reasoning: [`Điều Hậu: tháng sinh (chi ${monthBranch}) thuộc mùa Hạ, khí hậu viêm nhiệt — tham chiếu thiên về Thủy để giải nhiệt cục diện.`],
    };
  }
  return {
    dungThan: ["Thủy", "Hỏa"],
    reasoning: [
      `Điều Hậu: tháng sinh (chi ${monthBranch}) thuộc mùa Xuân/Thu. Quy tắc đầy đủ ở hai mùa này phụ thuộc chi tiết vào Can Nhật Chủ (khô/ẩm), hệ thống chưa có bảng đối chiếu đáng tin nên tạm liệt kê cả Thủy và Hỏa, cần thầy xác nhận quy tắc cụ thể.`,
    ],
  };
}

function determineYongShenPhuUc(strength: ElementStrength, monthBranch: string): YongShenResult {
  const dm = strength.dayMasterElement;
  const verdict = strength.dayMasterStrength.verdict;
  const reasoning: string[] = [];
  
  const generating = getGeneratedByElement(dm); // Hành sinh ra Nhật Chủ (Ấn)
  const overcoming = getOvercomingElement(dm);  // Nhật Chủ khắc (Tài)
  const overcomeBy = getOvercomeByElement(dm);  // Khắc Nhật Chủ (Quan/Sát)
  const generated = getGeneratingElement(dm);   // Nhật Chủ sinh ra (Thực/Thương)

  reasoning.push(`Nhật Chủ là ${dm}, điểm số sinh trợ (Tỷ Kiếp + Ấn) đạt ${strength.dayMasterStrength.scorePercentage}%.`);
  
  let dungThan: Element[] = [];
  let hyThan: Element[] = [];
  let kyThan: Element[] = [];
  let confidence: "rõ ràng" | "cần cân nhắc" = "rõ ràng";

  if (verdict === "nhược") {
    reasoning.push("Cục diện Nhật Chủ Nhược, cần sinh trợ (Phù) để cân bằng.");
    dungThan = [generating]; // Ấn
    hyThan = [dm]; // Tỷ Kiếp
    kyThan = [generated, overcoming, overcomeBy]; // Thực/Thương, Tài, Quan/Sát
    reasoning.push(`Dụng Thần (Hành sinh trợ chính): ${generating} (Ấn).`);
    reasoning.push(`Hỷ Thần (Hành tương trợ phụ): ${dm} (Tỷ/Kiếp).`);
    reasoning.push(`Kỵ Thần (Hành làm hao tổn hoặc khắc chế): ${generated} (Thực/Thương), ${overcoming} (Tài), ${overcomeBy} (Quan/Sát).`);
  } else if (verdict === "vượng") {
    reasoning.push("Cục diện Nhật Chủ Vượng, cần tiết chế (Ức) để cân bằng.");
    dungThan = [generated, overcoming]; // Thực/Thương, Tài
    hyThan = [overcomeBy]; // Quan/Sát
    kyThan = [generating, dm]; // Ấn, Tỷ Kiếp
    reasoning.push(`Dụng Thần (Hành làm hao tổn Nhật Chủ): ${generated} (Thực/Thương), ${overcoming} (Tài).`);
    reasoning.push(`Hỷ Thần (Hành chế ngự Nhật Chủ): ${overcomeBy} (Quan/Sát).`);
    reasoning.push(`Kỵ Thần (Hành sinh trợ thêm): ${generating} (Ấn), ${dm} (Tỷ/Kiếp).`);
  } else {
    reasoning.push("Cục diện Nhật Chủ Trung Hòa, chưa lệch hẳn về bên nào.");
    reasoning.push("Dụng Thần theo pháp Phù Ức không thật sự rõ ràng ở trạng thái này. Chuyển sang tham chiếu Điều Hậu.");
    confidence = "cần cân nhắc";

    const dieuHau = determineDieuHauFallback(monthBranch);
    dungThan = dieuHau.dungThan;
    reasoning.push(...dieuHau.reasoning);
  }

  // Tinh chỉnh confidence nếu sát mép
  const p = strength.dayMasterStrength.scorePercentage;
  if ((p >= 35 && p < 45) || (p > 55 && p <= 65)) {
    confidence = "cần cân nhắc";
    reasoning.push(`Lưu ý: Tỷ lệ ${p}% khá gần ngưỡng trung hòa (40-60%), cần cân nhắc kỹ lưỡng.`);
  }

  const usingDieuHau = verdict === "trung hòa";

  return {
    method: usingDieuHau ? "dieu-hau" : "phu-uc",
    methodLabel: usingDieuHau ? "Pháp Điều Hậu (tham chiếu)" : "Pháp Phù Ức",
    dayMasterVerdict: verdict,
    dungThan,
    hyThan,
    kyThan,
    reasoning,
    confidence
  };
}
