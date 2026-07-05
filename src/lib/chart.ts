import type {
  ChartData,
  ChartDto,
  ChartEngine,
  ChartPalace,
  MutagenRecord,
  School,
} from "../types/chart";

export const SCHOOL_LABEL: Record<School, string> = {
  "nam-phai": "Nam phái",
  "trung-chau": "Trung Châu phái",
};

const PALACE_ORDER = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
];

export function getEngine(school: School): ChartEngine | undefined {
  return window.TuViEngines?.[school];
}

const pad2 = (value: number) => String(value).padStart(2, "0");

function mutagenText(records: MutagenRecord[] | undefined): string {
  const text = (records ?? [])
    .filter((record) => record.palace)
    .map((record) => `${record.mutagen}→${record.starName}`)
    .join(" · ");
  return text || "—";
}

function groupedStars(palace: ChartPalace) {
  const major = [];
  const supporting = [];
  const mutagens = [];
  const annual = [];

  for (const star of palace.stars ?? []) {
    if (star.layer === "major") major.push(star);
    else if (/-mutagen$/.test(star.source ?? "")) mutagens.push(star);
    else if (star.source === "annual") annual.push(star);
    else supporting.push(star);
  }
  return { major, supporting, mutagens, annual };
}

export function buildChartText(
  data: ChartData | null,
  school: School,
  gender: "male" | "female",
): string {
  if (!data) return "";
  const lines: string[] = [];
  const genderLabel = gender === "female" ? "Nữ" : "Nam";
  const thanName = data.palaces[data.thanIndex]?.name ?? "";
  const majorFortune = data.majorFortunePalace;

  lines.push(`LÁ SỐ TỬ VI — ${SCHOOL_LABEL[school]}`);
  lines.push("=".repeat(46));
  lines.push(
    `Dương lịch: ${pad2(data.solar.day)}/${pad2(data.solar.month)}/${data.solar.year} · giờ ${data.birthHourBranch}`,
  );
  lines.push(
    `Âm lịch: ${pad2(data.lunar.day)}/${pad2(data.lunar.month)}${data.lunar.leap ? " (nhuận)" : ""}/${data.lunar.year} · năm ${data.yearStem} ${data.yearBranch}`,
  );
  lines.push(
    `Can Chi sinh: năm ${data.yearStem} ${data.yearBranch} · tháng ${data.birthMonthStem} ${data.birthMonthBranch} · ngày ${data.birthDayStem} ${data.birthDayBranch} · giờ ${data.birthHourStem} ${data.birthHourBranch}`,
  );
  lines.push(
    `Giới tính: ${genderLabel} · ${data.yearPolarity} ${genderLabel} · đại vận ${data.direction}`,
  );
  lines.push(
    `Mệnh: ${data.menhBranch} (${data.menhElement}) · Thân: cung ${thanName} · Cục: ${data.cuc.name}`,
  );
  lines.push(`Quan hệ Mệnh–Cục: ${data.cucMenhRelation.label}`);
  if (majorFortune?.majorFortune) {
    lines.push(
      `Đại vận hiện hành: ${majorFortune.majorFortune.start}–${majorFortune.majorFortune.end} tuổi · cung ${majorFortune.name} (${majorFortune.branch})`,
    );
  }
  lines.push(
    `Năm xem: ${data.annualYear} ${data.annualStem} ${data.annualBranch} (${data.nominalAge} tuổi)`,
  );
  if (data.taiTuePalace) {
    lines.push(
      `Lưu Thái Tuế: cung ${data.taiTuePalace.name} (${data.taiTuePalace.branch})`,
    );
  }
  if (data.smallLimitPalace) {
    lines.push(
      `Tiểu Hạn: cung ${data.smallLimitPalace.name} (${data.smallLimitPalace.branch})`,
    );
  }
  lines.push("");
  lines.push(
    `Tứ Hóa năm sinh (${data.yearStem}): ${mutagenText(data.natalMutagens)}`,
  );
  if (data.majorMutagens?.length) {
    lines.push(`Tứ Hóa đại vận: ${mutagenText(data.majorMutagens)}`);
  }
  lines.push(
    `Tứ Hóa lưu niên (${data.annualStem}): ${mutagenText(data.annualMutagens)}`,
  );
  lines.push("", "── 12 CUNG ──");

  const ordered = [...data.palaces].sort(
    (a, b) => PALACE_ORDER.indexOf(a.name) - PALACE_ORDER.indexOf(b.name),
  );
  for (const palace of ordered) {
    const groups = groupedStars(palace);
    const tags = [];
    if (palace.isMenh) tags.push("Mệnh");
    if (palace.isThan) tags.push("Thân");
    if (palace.majorFortune?.active) tags.push("đại vận");
    if (palace.isTaiTuePalace) tags.push("Thái Tuế");
    lines.push(
      `[${palace.name}] ${palace.branch} (can ${palace.stem ?? ""})${tags.length ? ` «${tags.join(", ")}»` : ""}`,
    );
    const starLabel = (star: { name: string; brightness?: string }) =>
      `${star.name}${star.brightness ? `(${star.brightness})` : ""}`;
    if (groups.major.length) {
      lines.push(`  Chính tinh: ${groups.major.map(starLabel).join(", ")}`);
    }
    if (groups.supporting.length) {
      lines.push(
        `  Phụ tinh: ${groups.supporting.map(starLabel).join(", ")}`,
      );
    }
    if (groups.mutagens.length) {
      lines.push(
        `  Tứ hóa: ${groups.mutagens
          .map(
            (star) =>
              `${star.name}${star.targetStar ? `→${star.targetStar}` : ""}`,
          )
          .join(", ")}`,
      );
    }
    if (groups.annual.length) {
      lines.push(`  Sao lưu: ${groups.annual.map((star) => star.name).join(", ")}`);
    }
    if (palace.changSheng) {
      lines.push(`  Tràng sinh: ${palace.changSheng}`);
    }
  }
  lines.push(
    "",
    "(Lá số lập bởi Void Occult · Tử Vi Đẩu Số — dán vào trợ lý AI để luận giải)",
  );
  return lines.join("\n");
}

export function serializeChart(
  data: ChartData | null,
  school: School,
): ChartDto | null {
  if (!data) return null;
  const elementForStar = getEngine(school)?.elementForStar ?? (() => "");
  const palaceRef = (palace: ChartPalace | null | undefined) =>
    palace
      ? {
          name: palace.name,
          branch: palace.branch,
          ...(palace.majorFortune
            ? {
                start: palace.majorFortune.start,
                end: palace.majorFortune.end,
              }
            : {}),
        }
      : null;
  const mutagens = (records: MutagenRecord[] | undefined) =>
    (records ?? []).map((record) => ({
      mutagen: record.mutagen,
      starName: record.starName,
      palaceName: record.palace?.name ?? null,
    }));

  return {
    school,
    menhElement: data.menhElement ?? "",
    menhBranch: data.menhBranch ?? "",
    yearStem: data.yearStem ?? "",
    yearBranch: data.yearBranch ?? "",
    birthMonthStem: data.birthMonthStem ?? "",
    birthMonthBranch: data.birthMonthBranch ?? "",
    birthDayStem: data.birthDayStem ?? "",
    birthDayBranch: data.birthDayBranch ?? "",
    birthHourStem: data.birthHourStem ?? "",
    birthHourBranch: data.birthHourBranch ?? "",
    annualStem: data.annualStem ?? "",
    annualBranch: data.annualBranch ?? "",
    annualYear: data.annualYear ?? null,
    nominalAge: data.nominalAge ?? null,
    majorFortunePalace: palaceRef(data.majorFortunePalace),
    taiTuePalace: palaceRef(data.taiTuePalace),
    smallLimitPalace: palaceRef(data.smallLimitPalace),
    palaces: data.palaces.map((palace) => ({
      index: palace.index,
      branch: palace.branch,
      name: palace.name,
      stem: palace.stem ?? "",
      isMenh: Boolean(palace.isMenh),
      isThan: Boolean(palace.isThan),
      changSheng: palace.changSheng ?? "",
      majorFortuneActive: Boolean(palace.majorFortune?.active),
      flowMonths: (palace.flowMonths ?? []).map((month) => month.month),
      stars: (palace.stars ?? []).map((star) => ({
        name: star.name,
        layer: star.layer ?? "",
        brightness: star.brightness ?? "",
        source: star.source ?? "",
        targetStar: star.targetStar ?? null,
        element: elementForStar(star.name),
      })),
    })),
    natalMutagens: mutagens(data.natalMutagens),
    annualMutagens: mutagens(data.annualMutagens),
    majorMutagens: mutagens(data.majorMutagens),
  };
}
