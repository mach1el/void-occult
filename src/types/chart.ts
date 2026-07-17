export type School = "nam-phai" | "trung-chau";

export interface ChartStar {
  name: string;
  layer?: string;
  brightness?: string;
  source?: string;
  targetStar?: string | null;
  mutagen?: string;
}

export interface ZiweiStart {
  ziweiIndex: number;
  tianfuIndex: number;
  borrowed: number;
  quotient: number;
}

// palace ở đây trỏ ngược lại chính ChartPalace chứa nó (xem ChartPalace.flowMonths) —
// tham chiếu vòng có thật ở runtime (palace.flowMonths[i].palace === palace).
export interface FlowMonthEntry {
  month: number;
  label?: string;
  palace: ChartPalace;
  stem?: string;
  branch?: string;
}

export interface ChartPalace {
  index: number;
  branch: string;
  name: string;
  stem?: string;
  han?: string;
  isMenh?: boolean;
  isThan?: boolean;
  isTaiTuePalace?: boolean;
  isAnnualPalace?: boolean;
  isMonthStart?: boolean;
  isSmallLimitPalace?: boolean;
  isLuuNienDaiVan?: boolean;
  smallLimitBranch?: string;
  smallLimitAges?: number[];
  // Chỉ trung-chau tính: tên cung theo trùng bài đại hạn/lưu niên.
  majorPalaceName?: string | null;
  annualPalaceName?: string;
  changSheng?: string;
  flowMonths?: FlowMonthEntry[];
  stars?: ChartStar[];
  majorFortune?: {
    order?: number;
    active?: boolean;
    start: number;
    end: number;
  };
}

export interface ChartPhiFlow {
  source: ChartPalace;
  target?: ChartPalace | null;
  mutagen: string;
  starName: string;
  self?: boolean;
}

export interface ChartVoidMarker {
  type: "Tuần" | "Triệt" | string;
  branches: string[];
}

export interface MutagenRecord {
  mutagen: string;
  starName: string;
  palace?: ChartPalace | null;
}

export interface ChartData {
  solar: { day: number; month: number; year: number };
  // leap là 0|1 ở runtime (solarToLunar trả lunarLeap dạng number), không phải boolean thật.
  lunar: { day: number; month: number; year: number; leap?: number };
  timeZone: number;
  birthHourBranch: string;
  yearStem: string;
  yearBranch: string;
  birthMonthStem: string;
  birthMonthBranch: string;
  birthDayStem: string;
  birthDayBranch: string;
  birthHourStem: string;
  yearPolarity: string;
  direction: string;
  directionSign: 1 | -1;
  menhBranch: string;
  menhElement: string;
  menhIndex: number;
  thanIndex: number;
  month: number;
  day: number;
  cuc: { name: string; number: number; element?: string; stem?: string };
  cucMenhRelation: { label: string; detail?: string };
  starts: ZiweiStart;
  annualYear: number;
  annualStem: string;
  annualBranch: string;
  nominalAge: number;
  palaces: ChartPalace[];
  majorFortunePalace?: ChartPalace | null;
  taiTuePalace?: ChartPalace | null;
  smallLimitPalace?: ChartPalace | null;
  // Ý nghĩa khác nhau giữa 2 phái (tiểu hạn ở nam-phai, lưu Thái Tuế ở trung-chau) và
  // không có nơi tiêu thụ nào trong src/ hiện tại — giữ lại để khớp snapshot, không xoá.
  smallLimitStartPalace?: ChartPalace | null;
  smallLimitDirection?: string;
  annualPalace?: ChartPalace | null;
  monthStartPalace?: ChartPalace | null;
  monthlyPalaces?: FlowMonthEntry[];
  annualMonthSeed?: number;
  annualStars?: Array<ChartStar & { palace: ChartPalace }>;
  starCount?: number;
  natalMutagens?: MutagenRecord[];
  annualMutagens?: MutagenRecord[];
  majorMutagens?: MutagenRecord[];
  phiFlows?: ChartPhiFlow[];
  voidMarkers?: ChartVoidMarker[];
}

export interface BirthInput {
  solarDate: string;
  birthHour: string;
  gender: "male" | "female";
  timezone: string;
  annualYear: string;
  flowBase: string;
}

export interface UserContext {
  name: string;
  occupationStatus: string;
  relationshipStatus: string;
}

export interface ChartEngine {
  calculate(input: BirthInput): ChartData;
  getData(): ChartData | null;
  elementForStar(name: string): string;
  solarToLunar(
    day: number,
    month: number,
    year: number,
    timeZone: number,
  ): { day: number; month: number; year: number; leap: number };
  /** Bảng Tứ Hóa của một Thiên Can (theo phái). Dùng cho lưu nguyệt Tứ Hóa. */
  tuHoaTargets(stem: string): Array<{ mutagen: string; starName: string }>;
  /** Vị trí Lộc Tồn theo Thiên Can (bảng cố định, dùng chung 2 phái). Dùng cho Nguyệt Lộc Tồn/Kình/Đà. */
  locTonIndex(stem: string): number;
}

export interface ChartDto {
  school: School;
  menhElement: string;
  menhBranch: string;
  yearStem: string;
  yearBranch: string;
  birthMonthStem: string;
  birthMonthBranch: string;
  birthDayStem: string;
  birthDayBranch: string;
  birthHourStem: string;
  birthHourBranch: string;
  annualStem: string;
  annualBranch: string;
  annualYear: number | null;
  nominalAge: number | null;
  majorFortunePalace: PalaceRef | null;
  taiTuePalace: PalaceRef | null;
  smallLimitPalace: PalaceRef | null;
  palaces: PalaceDto[];
  natalMutagens: MutagenDto[];
  annualMutagens: MutagenDto[];
  majorMutagens: MutagenDto[];
}

interface PalaceRef {
  name: string;
  branch: string;
  start?: number;
  end?: number;
}

interface MutagenDto {
  mutagen: string;
  starName: string;
  palaceName: string | null;
}

interface PalaceDto {
  index: number;
  branch: string;
  name: string;
  stem: string;
  isMenh: boolean;
  isThan: boolean;
  changSheng: string;
  majorFortuneActive: boolean;
  flowMonths: number[];
  stars: Array<{
    name: string;
    layer: string;
    brightness: string;
    source: string;
    targetStar: string | null;
    element: string;
  }>;
}

declare global {
  interface Window {
    VOIDOCC_CONFIG?: {
      BACKEND_URL?: string;
    };
  }
}
