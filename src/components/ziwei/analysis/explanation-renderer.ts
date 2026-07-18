import type { PalaceEvidenceAxes } from "@/lib/ziwei/analysis/modules/palace-overview";

/** Map explanationKey → Vietnamese copy (no free-form reason parsing). */

/**
 * Family id → label, copied verbatim from
 * knowledge/palace-overview/v1/minor-star-families.json (18 families).
 * Used as a deterministic fallback for the 91 per-star minor explanation
 * keys (shape `minor.<familyId>.<slug>`) instead of hardcoding all 92.
 */
const MINOR_FAMILY_LABELS: Record<string, string> = {
  "strong-support": "Phụ tá và quý nhân mạnh",
  "standard-support": "Hỗ trợ, giải trợ và danh vị",
  "academic-literary": "Học thuật, văn thư và biểu đạt",
  "wealth-resource": "Nguồn lực và tích lũy",
  "soft-support": "Hỗ trợ nhẹ",
  "authority-action": "Quyết đoán, tổ chức và hành động",
  "movement-action": "Di chuyển và nhịp hành động",
  "joy-social": "Hỷ khí và khả năng kết nối",
  "attraction-visibility": "Sức hút và độ lộ diện",
  "symbolic-prestige": "Biểu tượng, danh dự và khuynh hướng tinh thần",
  "major-malefic": "Lục sát và áp lực mạnh",
  "strong-pressure": "Áp lực cấu trúc mạnh",
  "standard-pressure": "Trở lực và nhiễu động",
  "resource-dispersion": "Hao tán và luân chuyển nguồn lực",
  "isolation-pressure": "Tách biệt và giảm liên kết",
  "administrative-pressure": "Quy định, tranh luận và áp lực thủ tục",
  "strain-context": "Sức bền và áp lực duy trì",
  "context-only": "Ngữ cảnh chưa chấm trực tiếp",
};

const LABELS: Record<string, string> = {
  "major.borrowed-from-opposite": "Chính tinh mượn từ đối cung (VCD)",
  "void.borrow-context": "Bối cảnh vô chính diệu",
  "void.double-empty": "Vô chính diệu — đối cung cũng trống",
  "void.local-attenuation": "Suy giảm cục bộ Tuần/Triệt",
  "transform.Lộc": "Hóa Lộc gốc",
  "transform.Quyền": "Hóa Quyền gốc",
  "transform.Khoa": "Hóa Khoa gốc",
  "transform.Kỵ": "Hóa Kỵ gốc",
  "minor.strong-support": "Phụ tinh hỗ trợ mạnh",
  "minor.standard-support": "Phụ tinh hỗ trợ",
  "minor.academic-literary": "Nhóm văn học",
  "minor.wealth-resource": "Nhóm tài nguyên",
  "minor.movement-action": "Nhóm hành động",
  "minor.romance-visibility": "Nhóm duyên/hiển lộ",
  "minor.major-malefic": "Sát tinh chính",
  "minor.standard-pressure": "Áp lực phụ",
  "rule.rule-tu-phu-vu-tuong": "Cách cục Tử Phủ Vũ Tướng",
  "rule.rule-co-nguyet-dong-luong": "Cách cục Cơ Nguyệt Đồng Lương",
  "rule.rule-sat-pha-tham": "Cách cục Sát Phá Tham",
  // V1.2 semantic — Mệnh–Thân context (annotation-only, no score effect).
  "context.menh.core": "Cung an Mệnh của lá số",
  "context.than.emphasis": "Cung an Thân — trọng tâm biểu hiện",
  "context.menh-than.same-palace": "Mệnh và Thân cùng một cung",
  "context.menh-void.than-reference":
    "Mệnh Vô chính diệu — tham chiếu cung Thân",
  // V1.2 semantic — Tứ Hóa target-trait semantics (annotation-only).
  "transform-target.loc.resource":
    "Lộc rơi vào sao mang đặc tính nguồn lực — mở ra cơ hội tài nguyên",
  "transform-target.loc.visibility":
    "Lộc rơi vào sao mang đặc tính lộ diện — thuận lợi về sự chú ý, hiển lộ",
  "transform-target.loc.communication":
    "Lộc rơi vào sao mang đặc tính giao tiếp — thuận lợi biểu đạt, trao đổi",
  "transform-target.quyen.authority":
    "Quyền rơi vào sao mang đặc tính quyền hạn — tăng trách nhiệm, quyền kiểm soát",
  "transform-target.quyen.planning":
    "Quyền rơi vào sao mang đặc tính hoạch định — áp lực ra quyết định, chủ động thích nghi",
  "transform-target.quyen.communication":
    "Quyền rơi vào sao mang đặc tính giao tiếp — biểu đạt quyết đoán, kiểm soát tiếng nói",
  "transform-target.khoa.learning":
    "Khoa rơi vào sao mang đặc tính học tập — rõ ràng, có phương pháp, được ghi nhận",
  "transform-target.khoa.protection":
    "Khoa rơi vào sao mang đặc tính bảo hộ — bảo vệ danh tiếng, hỗ trợ có cấu trúc",
  "transform-target.ky.communication":
    "Kỵ rơi vào sao mang đặc tính giao tiếp — ma sát biểu đạt, áp lực văn thư",
  "transform-target.ky.visibility":
    "Kỵ rơi vào sao mang đặc tính lộ diện — áp lực danh tiếng, ma sát được chú ý",
  "transform-target.ky.resource":
    "Kỵ rơi vào sao mang đặc tính nguồn lực — ma sát phân bổ, áp lực tài chính",
  "transform-target.ky.desire":
    "Kỵ rơi vào sao mang đặc tính ham muốn — phức tạp trong gắn kết, ma sát quan hệ",
  "transform-target.ky.planning":
    "Kỵ rơi vào sao mang đặc tính hoạch định — cản trở kế hoạch, áp lực thích nghi",
  "transform-target.ky.disruption":
    "Kỵ rơi vào sao mang đặc tính đột phá — xung đột gia tăng, áp lực thay đổi",
};

const PALACE_DOMAIN: Record<string, string> = {
  Mệnh: "bản thân, khí chất, khả năng tự chủ",
  "Phụ Mẫu": "nền hỗ trợ, cấp trên, giấy tờ",
  "Phúc Đức": "nội tâm, nền tinh thần, phúc khí",
  "Điền Trạch": "nền tảng, nhà cửa, tài sản cố định",
  "Quan Lộc": "công việc, vai trò, nghề nghiệp",
  "Nô Bộc": "mạng lưới, cộng sự, quan hệ xã hội",
  "Thiên Di": "môi trường ngoài, di chuyển, tương tác bên ngoài",
  "Tật Ách": "sức bền, áp lực, khả năng phục hồi",
  "Tài Bạch": "tài nguyên, thu nhập, quản trị tiền",
  "Tử Tức": "sản phẩm, sáng tạo, hậu thế",
  "Phu Thê": "quan hệ một-một, hợp tác",
  "Huynh Đệ": "người ngang hàng, nguồn lực gần",
};

export function renderExplanationKey(key: string, fallbackLabel: string): string {
  if (LABELS[key]) return LABELS[key]!;
  if (key.startsWith("major.")) {
    return `Chính tinh ${key.slice("major.".length)}`;
  }
  if (key.startsWith("chang-sheng.")) {
    return `Trường Sinh · ${key.slice("chang-sheng.".length)}`;
  }
  if (key.startsWith("minor.")) {
    const familyId = key.slice("minor.".length).split(".")[0];
    const familyLabel = familyId ? MINOR_FAMILY_LABELS[familyId] : undefined;
    return familyLabel ? `${fallbackLabel} · ${familyLabel}` : fallbackLabel;
  }
  return fallbackLabel;
}

export function palaceDomainHint(palaceName: string): string | null {
  return PALACE_DOMAIN[palaceName] ?? null;
}

const AXIS_LABELS: Array<[keyof PalaceEvidenceAxes, string]> = [
  ["support", "hỗ trợ"],
  ["pressure", "áp lực"],
  ["stability", "ổn định"],
  ["activation", "kích hoạt"],
];

/** Localized, compact summary of an evidence/palace's axis contribution. */
export function formatContribution(axes: PalaceEvidenceAxes): string {
  const parts: string[] = [];
  for (const [key, label] of AXIS_LABELS) {
    const value = axes[key];
    if (Math.abs(value) < 0.05) continue;
    const sign = value > 0 ? "+" : "−";
    parts.push(`${sign}${Math.abs(value).toFixed(1)} ${label}`);
  }
  return parts.length ? parts.join(", ") : "—";
}

const AXIS_LABEL_BY_KEY: Record<"support" | "pressure", string> = {
  support: "hỗ trợ",
  pressure: "áp lực",
};

/**
 * V1.2.1 — single-axis contribution for the independent support/pressure
 * minor-star rows (a star can appear in both sections; each row must only
 * show the axis relevant to that section, not all four).
 */
export function formatAxisContribution(
  axis: "support" | "pressure",
  value: number,
): string {
  if (Math.abs(value) < 0.05) return "—";
  const sign = value > 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(1)} ${AXIS_LABEL_BY_KEY[axis]}`;
}
