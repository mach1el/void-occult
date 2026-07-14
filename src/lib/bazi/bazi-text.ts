import { BaziFullChart } from "./bazi-engine";
import { calculateElementStrength } from "./element-strength";
import { determineYongShen } from "./yong-shen";

/**
 * Xuất toàn bộ lá số Bát Tự ra text tiếng Việt để copy (telegram, notes,...)
 */
export function buildBaziText(chart: BaziFullChart): string {
  const strength = calculateElementStrength(chart);
  const yongShen = determineYongShen(strength);

  const out: string[] = [];
  
  // 1. Tiêu đề
  out.push(`============================`);
  out.push(`LÁ SỐ BÁT TỰ (TỨ TRỤ)`);
  out.push(`Giờ sinh thực tế: ${chart.metadata.trueSolarTime.toLocaleString('vi-VN')}`);
  out.push(`Giới tính: ${chart.isYangGender ? "Dương" : "Âm"} ${chart.gender === "M" ? "Nam" : "Nữ"}`);
  out.push(`============================\n`);

  // 2. Dụng Thần & Phân Tích
  out.push(`PHÂN TÍCH THEO: ${yongShen.methodLabel.toUpperCase()}`);
  out.push(`- Nhật Chủ: ${yongShen.dayMasterVerdict.toUpperCase()} (${strength.dayMasterStrength.scorePercentage}% trợ lực)`);
  out.push(`- Dụng Thần: ${yongShen.dungThan.join(", ") || "Không rõ"}`);
  out.push(`- Hỷ Thần: ${yongShen.hyThan.join(", ") || "-"}`);
  out.push(`- Kỵ Thần: ${yongShen.kyThan.join(", ") || "-"}`);
  if (yongShen.confidence === "cần cân nhắc") {
    out.push(`* Lưu ý: Cục diện gần trung hòa, dụng thần có thể chưa rạch ròi.`);
  }
  
  // Điểm Ngũ Hành
  const pts = strength.scores;
  const pcp = strength.normalized;
  out.push(`\nĐIỂM NGŨ HÀNH:`);
  out.push(`- Mộc: ${pts.Mộc.toFixed(1)} (${pcp.Mộc}%)`);
  out.push(`- Hỏa: ${pts.Hỏa.toFixed(1)} (${pcp.Hỏa}%)`);
  out.push(`- Thổ: ${pts.Thổ.toFixed(1)} (${pcp.Thổ}%)`);
  out.push(`- Kim: ${pts.Kim.toFixed(1)} (${pcp.Kim}%)`);
  out.push(`- Thủy: ${pts.Thủy.toFixed(1)} (${pcp.Thủy}%)\n`);

  // 3. Tứ Trụ
  out.push(`TỨ TRỤ (Giờ - Ngày - Tháng - Năm)`);
  const pt = chart.details;
  
  out.push(`[Trụ Giờ] ${pt.hour.pillar.stem} ${pt.hour.pillar.branch} (Nạp âm: ${pt.hour.nayin})`);
  out.push(`- Thập Thần: ${pt.hour.tenGod}`);
  out.push(`- Trường Sinh: ${pt.hour.lifeStage}`);
  if (pt.hour.isVoid) out.push(`- Tuần Không`);
  out.push(`- Tàng Can: ${pt.hour.hiddenStems.map(h => `${h.stem}(${h.tenGod})`).join(", ")}`);
  out.push(`- Thần Sát: ${pt.hour.stars.map(s => s.name).join(", ")}\n`);

  out.push(`[Trụ Ngày] ${pt.day.pillar.stem} ${pt.day.pillar.branch} (Nạp âm: ${pt.day.nayin})`);
  out.push(`- Thập Thần: ${pt.day.tenGod}`);
  out.push(`- Trường Sinh: ${pt.day.lifeStage}`);
  out.push(`- Tàng Can: ${pt.day.hiddenStems.map(h => `${h.stem}(${h.tenGod})`).join(", ")}`);
  out.push(`- Thần Sát: ${pt.day.stars.map(s => s.name).join(", ")}\n`);

  out.push(`[Trụ Tháng] ${pt.month.pillar.stem} ${pt.month.pillar.branch} (Nạp âm: ${pt.month.nayin})`);
  out.push(`- Thập Thần: ${pt.month.tenGod}`);
  out.push(`- Trường Sinh: ${pt.month.lifeStage}`);
  if (pt.month.isVoid) out.push(`- Tuần Không`);
  out.push(`- Tàng Can: ${pt.month.hiddenStems.map(h => `${h.stem}(${h.tenGod})`).join(", ")}`);
  out.push(`- Thần Sát: ${pt.month.stars.map(s => s.name).join(", ")}\n`);

  out.push(`[Trụ Năm] ${pt.year.pillar.stem} ${pt.year.pillar.branch} (Nạp âm: ${pt.year.nayin})`);
  out.push(`- Thập Thần: ${pt.year.tenGod}`);
  out.push(`- Trường Sinh: ${pt.year.lifeStage}`);
  if (pt.year.isVoid) out.push(`- Tuần Không`);
  out.push(`- Tàng Can: ${pt.year.hiddenStems.map(h => `${h.stem}(${h.tenGod})`).join(", ")}`);
  out.push(`- Thần Sát: ${pt.year.stars.map(s => s.name).join(", ")}\n`);

  // 4. Thông tin phụ
  out.push(`THÔNG TIN PHỤ`);
  out.push(`- Không Vong: ${chart.voids.join(", ")}`);
  out.push(`- Mệnh Cung: ${chart.derived.lifePalace.pillar.stem} ${chart.derived.lifePalace.pillar.branch} (${chart.derived.lifePalace.nayin})`);
  out.push(`- Thai Nguyên: ${chart.derived.conception.pillar.stem} ${chart.derived.conception.pillar.branch} (${chart.derived.conception.nayin})\n`);

  // 5. Đại Vận
  out.push(`ĐẠI VẬN (10 NĂM)`);
  for (const lp of chart.luck.pillars) {
    const ageStr = `Tuổi ${lp.startAgeYear}${lp.startAgeMonth ? ` ${lp.startAgeMonth}t` : ""}`;
    const yearStr = lp.startDate.getFullYear();
    out.push(`- [${yearStr}] ${ageStr}: ${lp.pillar.stem} ${lp.pillar.branch} (${lp.tenGod}) - ${lp.lifeStage}`);
  }

  out.push(`\n---\n* Tạo bởi hệ thống Apexvoid Occult`);

  return out.join('\n');
}
