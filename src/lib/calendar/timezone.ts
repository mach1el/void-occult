/**
 * Các hàm liên quan đến múi giờ, kinh độ và True Solar Time.
 */

import { BRANCHES } from "./sexagenary";

export interface ConfigOptions {
  /**
   * Nếu true, giờ Tý được chia đôi:
   * 23:00 - 00:00: Tý muộn (chi Tý, can giờ thuộc ngày hôm nay).
   * 00:00 - 01:00: Tý sớm (chi Tý, can giờ thuộc ngày mai).
   * Nếu false (mặc định), giờ Tý liền: ngày mới bắt đầu ngay từ 23:00.
   */
  splitZiHour: boolean;
}

const DEFAULT_CONFIG: ConfigOptions = {
  splitZiHour: false
};

/**
 * Tính True Solar Time (thời gian mặt trời thật) từ giờ địa phương.
 * 
 * @param date Thời điểm giờ địa phương.
 * @param longitude Kinh độ nơi sinh (độ).
 * @param timezoneOffset Múi giờ chuẩn của giờ địa phương đó (ví dụ +7 cho VN).
 * @returns Date chứa True Solar Time tương ứng.
 */
export function getTrueSolarTime(date: Date, longitude: number, timezoneOffset: number): Date {
  // Kinh tuyến chuẩn của múi giờ
  const standardLongitude = timezoneOffset * 15;
  
  // Hiệu số kinh độ (mỗi độ lệch = 4 phút)
  // Nếu ở đông hơn kinh tuyến chuẩn (longitude > standardLongitude), mặt trời mọc sớm hơn -> giờ mặt trời thật > giờ đồng hồ
  const longitudeCorrectionMinutes = (longitude - standardLongitude) * 4;
  
  // TODO: Equation of Time (EoT) - Chênh lệch do quỹ đạo elip của Trái Đất (±15 phút tuỳ ngày trong năm).
  // Vì Bát Tự thường ít khi đòi hỏi gắt gao EoT cho giờ sinh (đa phần chỉ tính kinh độ), tạm thời bỏ qua EoT hoặc bổ sung sau.
  const equationOfTimeMinutes = 0; // Để dành nếu cần độ chính xác siêu cao
  
  const totalCorrectionMs = (longitudeCorrectionMinutes + equationOfTimeMinutes) * 60 * 1000;
  
  return new Date(date.getTime() + totalCorrectionMs);
}

/**
 * Tìm chỉ số Địa Chi (0-11 tương ứng Tý-Hợi) của giờ.
 * Và xác định xem giờ này có được tính là ngày hôm sau hay không.
 */
export function getHourBranch(solarTime: Date, config: ConfigOptions = DEFAULT_CONFIG): { branchIndex: number, isNextDay: boolean } {
  const hours = solarTime.getHours();
  const minutes = solarTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Tính theo tổng phút:
  // 23:00 (1380) đến 01:00 (60) là giờ Tý (0)
  // 01:00 (60) đến 03:00 (180) là giờ Sửu (1)
  
  // Để dễ tính, cộng thêm 60 phút (1 giờ), lúc đó 23:00 thành 24:00, 00:00 thành 01:00.
  // Chia 120 phút (2 tiếng) để ra index.
  let branchIndex = Math.floor(((totalMinutes + 60) % 1440) / 120);
  
  let isNextDay = false;
  
  if (config.splitZiHour) {
    // Nếu chia giờ Tý: 
    // Từ 23:00 đến 23:59 là Tý muộn (Tý của ngày hôm nay)
    // Từ 00:00 đến 00:59 là Tý sớm (Tý của ngày mai)
    if (hours === 23) {
      isNextDay = false; // Vẫn tính ngày cũ
    } else if (hours === 0) {
      isNextDay = false; // Thực ra hệ thống ngày (getDayPillar) đã tự động coi 00:00 là ngày mới rồi. 
      // Do jd tính lúc 12h trưa, khi tính cho 0h, ngày tự động cộng dồn. Nên không cần ép isNextDay ở đây nếu ta gọi getDayPillar(jd_lúc_0h).
      // Nhưng để nhất quán, isNextDay là cờ để DỊCH can ngày tới.
      // Do ta thường truyền JDN của ngày dương lịch (ví dụ ngày 1), nếu hours >= 23 và không split, ta đổi ngày thành ngày 2.
    }
  } else {
    // Nếu Tý liền: 23:00 đến 01:00 đều là Tý của ngày mai.
    if (hours === 23) {
      isNextDay = true;
    }
  }
  
  return { branchIndex, isNextDay };
}
