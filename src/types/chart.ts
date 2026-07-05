export type School = "nam-phai" | "trung-chau";

export interface ChartStar {
  name: string;
  layer?: string;
  brightness?: string;
  source?: string;
  targetStar?: string | null;
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
  smallLimitBranch?: string;
  changSheng?: string;
  flowMonths?: Array<{ month: number; label?: string; stem?: string; branch?: string }>;
  stars?: ChartStar[];
  majorFortune?: {
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
  lunar: { day: number; month: number; year: number; leap?: boolean };
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
  menhBranch: string;
  menhElement: string;
  thanIndex: number;
  cuc: { name: string; number: number };
  cucMenhRelation: { label: string };
  annualYear: number;
  annualStem: string;
  annualBranch: string;
  nominalAge: number;
  palaces: ChartPalace[];
  majorFortunePalace?: ChartPalace | null;
  taiTuePalace?: ChartPalace | null;
  smallLimitPalace?: ChartPalace | null;
  natalMutagens?: MutagenRecord[];
  annualMutagens?: MutagenRecord[];
  majorMutagens?: MutagenRecord[];
  phiFlows?: ChartPhiFlow[];
  voidMarkers?: ChartVoidMarker[];
}

export interface ChartEngine {
  calculate(): ChartData;
  getData(): ChartData | null;
  elementForStar(name: string): string;
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
    TuViEngines?: Partial<Record<School, ChartEngine>>;
    VOIDOCC_CONFIG?: {
      BACKEND_URL?: string;
    };
  }
}
