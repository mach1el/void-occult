import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { getEngine, SCHOOL_LABEL } from "@/lib/ziwei/chart";
import compactChartCss from "./compact-chart.css?raw";
import {
  compareNatalBeforeAnnual,
  isAnnualStar,
  isBeneficStar,
  isStrongBrightness,
  starDisplayOpacity,
  starTier,
} from "@/lib/ziwei/star-classification";
import type {
  ChartData,
  ChartPhiFlow,
  ChartPalace,
  ChartStar,
  ChartVoidMarker,
  School,
} from "@/types/chart";

interface CompactChartProps {
  data: ChartData | null;
  school: School;
  gender: "male" | "female";
  showAnnual: boolean;
  showMutagens: boolean;
  showPhi: boolean;
  captureRef: RefObject<HTMLDivElement | null>;
  profileName?: string;
}

interface Position {
  x: number;
  y: number;
}

interface ChartGeometry {
  cellWidth: number;
  cellHeight: number;
  width: number;
  height: number;
  centerWidth: number;
  centerHeight: number;
  palaceFooterY: number;
  palacePhiY: number;
  positions: Record<string, Position>;
}

/** Desktop: rộng 880, cao vừa viewport (992). */
const DESKTOP_CELL_WIDTH = 220;
const DESKTOP_CELL_HEIGHT = 248;
/** Mobile/stack ≤1200: cùng bề rộng, cao hơn để width:100% không bị vuông thấp. */
const MOBILE_CELL_WIDTH = 220;
const MOBILE_CELL_HEIGHT = 300;
/** Khớp page shell tu-vi.css — stack layout. */
const STACKED_LAYOUT_QUERY = "(max-width: 1200px)";

function createGeometry(cellWidth: number, cellHeight: number): ChartGeometry {
  return {
    cellWidth,
    cellHeight,
    width: cellWidth * 4,
    height: cellHeight * 4,
    centerWidth: cellWidth * 2,
    centerHeight: cellHeight * 2,
    palaceFooterY: cellHeight - 9,
    palacePhiY: cellHeight - 22,
    positions: {
      Tỵ: { x: 0, y: 0 },
      Ngọ: { x: cellWidth, y: 0 },
      Mùi: { x: cellWidth * 2, y: 0 },
      Thân: { x: cellWidth * 3, y: 0 },
      Thìn: { x: 0, y: cellHeight },
      Dậu: { x: cellWidth * 3, y: cellHeight },
      Mão: { x: 0, y: cellHeight * 2 },
      Tuất: { x: cellWidth * 3, y: cellHeight * 2 },
      Dần: { x: 0, y: cellHeight * 3 },
      Sửu: { x: cellWidth, y: cellHeight * 3 },
      Tý: { x: cellWidth * 2, y: cellHeight * 3 },
      Hợi: { x: cellWidth * 3, y: cellHeight * 3 },
    },
  };
}

const DESKTOP_GEOMETRY = createGeometry(DESKTOP_CELL_WIDTH, DESKTOP_CELL_HEIGHT);
const MOBILE_GEOMETRY = createGeometry(MOBILE_CELL_WIDTH, MOBILE_CELL_HEIGHT);

const ChartGeometryContext = createContext<ChartGeometry>(DESKTOP_GEOMETRY);

function useChartGeometry(): ChartGeometry {
  return useContext(ChartGeometryContext);
}

function useStackedLayout(): boolean {
  const [stacked, setStacked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia(STACKED_LAYOUT_QUERY);
    const sync = () => setStacked(media.matches);
    sync();
    if (media.addEventListener) {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  return stacked;
}

const MAX_STARS_PER_COLUMN = 10;
const BOUNDARY_VOID_STARS = new Set(["Tuần", "Triệt"]);

const TAM_HOP: Record<string, string[]> = {
  Dần: ["Dần", "Ngọ", "Tuất"],
  Ngọ: ["Dần", "Ngọ", "Tuất"],
  Tuất: ["Dần", "Ngọ", "Tuất"],
  Thân: ["Thân", "Tý", "Thìn"],
  Tý: ["Thân", "Tý", "Thìn"],
  Thìn: ["Thân", "Tý", "Thìn"],
  Tỵ: ["Tỵ", "Dậu", "Sửu"],
  Dậu: ["Tỵ", "Dậu", "Sửu"],
  Sửu: ["Tỵ", "Dậu", "Sửu"],
  Hợi: ["Hợi", "Mão", "Mùi"],
  Mão: ["Hợi", "Mão", "Mùi"],
  Mùi: ["Hợi", "Mão", "Mùi"],
};

const XUNG_CHIEU: Record<string, string> = {
  Tý: "Ngọ",
  Sửu: "Mùi",
  Dần: "Thân",
  Mão: "Dậu",
  Thìn: "Tuất",
  Tỵ: "Hợi",
  Ngọ: "Tý",
  Mùi: "Sửu",
  Thân: "Dần",
  Dậu: "Mão",
  Tuất: "Thìn",
  Hợi: "Tỵ",
};

const BRANCH_HAN: Record<string, string> = {
  Tý: "子",
  Sửu: "丑",
  Dần: "寅",
  Mão: "卯",
  Thìn: "辰",
  Tỵ: "巳",
  Ngọ: "午",
  Mùi: "未",
  Thân: "申",
  Dậu: "酉",
  Tuất: "戌",
  Hợi: "亥",
};

const HOUR_RANGES: Record<string, string> = {
  Tý: "23–01",
  Sửu: "01–03",
  Dần: "03–05",
  Mão: "05–07",
  Thìn: "07–09",
  Tỵ: "09–11",
  Ngọ: "11–13",
  Mùi: "13–15",
  Thân: "15–17",
  Dậu: "17–19",
  Tuất: "19–21",
  Hợi: "21–23",
};

function useDesktopTrineInteractions() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia(
      "(min-width: 961px) and (hover: hover) and (pointer: fine)",
    );
    const sync = () => setEnabled(query.matches);

    sync();
    if (query.addEventListener) {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }

    query.addListener(sync);
    return () => query.removeListener(sync);
  }, []);

  return enabled;
}

const STEM_ABBREVIATIONS: Record<string, string> = {
  Giáp: "G.",
  Ất: "Ấ.",
  Bính: "B.",
  Đinh: "Đ.",
  Mậu: "M.",
  Kỷ: "K.",
  Canh: "C.",
  Tân: "T.",
  Nhâm: "N.",
  Quý: "Q.",
};

const PALACE_ABBREVIATIONS: Record<string, string> = {
  Mệnh: "Mệnh",
  "Huynh Đệ": "Huynh",
  "Phu Thê": "Phu",
  "Tử Tức": "Tử",
  "Tài Bạch": "Tài",
  "Tật Ách": "Tật",
  "Thiên Di": "Di",
  "Nô Bộc": "Nô",
  "Quan Lộc": "Quan",
  "Điền Trạch": "Điền",
  "Phúc Đức": "Phúc",
  "Phụ Mẫu": "Phụ",
};

const MUTAGEN_ABBREVIATIONS: Record<string, string> = {
  Lộc: "L",
  Quyền: "Q",
  Khoa: "Kh",
  Kỵ: "Kỵ",
};

const IMPORTANT_LAYERS = new Set([
  "wealth",
  "helper",
  "tough",
  "harm",
  "void",
  "move",
  "romance",
]);

function visibleStars(
  palace: ChartPalace,
  showAnnual: boolean,
  showMutagens: boolean,
) {
  const major: ChartStar[] = [];
  const minor: ChartStar[] = [];
  const seen = new Set<string>();

  for (const star of palace.stars ?? []) {
    const source = star.source ?? "";
    if (BOUNDARY_VOID_STARS.has(star.name)) continue;
    if (!showAnnual && (source === "annual" || source === "annual-mutagen")) {
      continue;
    }
    if (!showMutagens && source.endsWith("-mutagen")) continue;
    const key = `${star.name}|${source}|${star.targetStar ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (star.layer === "major") major.push(star);
    else minor.push(star);
  }

  const priority = (star: ChartStar) => {
    const source = star.source ?? "";
    if (source.endsWith("-mutagen")) return 0;
    if (star.layer === "void") return 1;
    if (IMPORTANT_LAYERS.has(star.layer ?? "")) return 2;
    if (source === "annual") return 4;
    return 3;
  };
  minor.sort(
    (a, b) =>
      compareNatalBeforeAnnual(a, b) || priority(a) - priority(b),
  );
  const benefic = minor.filter(isBeneficStar);
  const malefic = minor.filter((star) => !isBeneficStar(star));
  return {
    major,
    minor,
    benefic,
    malefic,
    compactBenefic: benefic.slice(0, MAX_STARS_PER_COLUMN),
    compactMalefic: malefic.slice(0, MAX_STARS_PER_COLUMN),
  };
}

function compactName(star: ChartStar): string {
  let name = star.name;
  // Tứ Hóa ghi RÕ loại: "Hóa Kỵ" (gốc) / "L.Hóa Kỵ" (lưu) — không rút gọn
  // phần "Hóa" (tránh H.Kỵ/L.H.Kỵ khó đọc, dễ tưởng thiếu sao). Mọi sao lưu
  // niên (kể cả lưu Tứ Hóa) giữ tiền tố "L." cho đồng bộ với sao lưu khác.
  if (isAnnualStar(star)) {
    name = name.replace(/^Lưu\s+/, "L.");
  }
  const characters = Array.from(name);
  if (characters.length > 14) name = `${characters.slice(0, 13).join("")}…`;
  return name;
}

export function starColor(star: ChartStar, school: School): string {
  const source = star.source ?? "";
  if (source.endsWith("-mutagen")) {
    if (star.name.includes("Kỵ")) return "var(--mutagen-ky)";
    if (star.name.includes("Lộc")) return "var(--mutagen-loc)";
    if (star.name.includes("Quyền")) return "var(--mutagen-quyen)";
    return "var(--mutagen-khoa)";
  }
  const element = getEngine(school)?.elementForStar(star.name);
  return (
    {
      Kim: "var(--element-kim)",
      Mộc: "var(--element-moc)",
      Thủy: "var(--element-thuy)",
      Hỏa: "var(--element-hoa)",
      Thổ: "var(--element-tho)",
    }[element ?? ""] ?? "var(--ash)"
  );
}

function starTierClass(star: ChartStar): string {
  const tier = starTier(star);
  return tier === 1 ? "" : ` is-tier-${tier}`;
}

// Độ sáng miếu/vượng/hãm áp SAU màu ngũ hành — không đổi fill, chỉ đổi
// opacity (kết hợp sẵn với tầng bậc) và độ đậm. Nhãn chữ (M/V/Đ/B/H) giữ
// nguyên như cũ, đây chỉ là tín hiệu thị giác bổ sung.
function starVisualStyle(star: ChartStar): CSSProperties {
  const style: CSSProperties = { opacity: starDisplayOpacity(star) };
  if (isStrongBrightness(star.brightness)) style.fontWeight = 900;
  return style;
}

function Palace({
  palace,
  school,
  showAnnual,
  showMutagens,
  showPhi,
  phiFlows,
  trineState,
  onTrineEnter,
  onTrineLeave,
  onSelect,
}: {
  palace: ChartPalace;
  school: School;
  showAnnual: boolean;
  showMutagens: boolean;
  showPhi: boolean;
  phiFlows: ChartPhiFlow[];
  trineState: "active" | "dim" | null;
  onTrineEnter(branch: string): void;
  onTrineLeave(): void;
  onSelect(palace: ChartPalace): void;
}) {
  const {
    cellWidth,
    cellHeight,
    palaceFooterY,
    palacePhiY,
    positions,
  } = useChartGeometry();
  const position = positions[palace.branch];
  if (!position) return null;
  const stars = visibleStars(palace, showAnnual, showMutagens);
  const columns = [
    stars.compactBenefic,
    stars.compactMalefic,
  ];
  const fortune = palace.majorFortune;
  const marks = [palace.isThan ? "Thân" : ""].filter(Boolean);
  const flowMonth = showAnnual ? palace.flowMonths?.[0] : undefined;
  const minorStartY = (stars.major.length > 1 ? (marks.length ? 68 : 56) : (marks.length ? 51 : 40)) + 16;
  const centerX = cellWidth / 2;
  const endX = cellWidth - 10;
  const maleficX = centerX + 10;

  function keyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(palace);
    }
  }

  return (
    <g
      className={`compact-palace${palace.isMenh ? " is-menh" : ""}${palace.isThan ? " is-than" : ""}${trineState ? ` is-trine-${trineState}` : ""}`}
      transform={`translate(${position.x} ${position.y})`}
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết cung ${palace.name}`}
      onClick={() => onSelect(palace)}
      onKeyDown={keyDown}
      onPointerEnter={() => onTrineEnter(palace.branch)}
      onPointerLeave={onTrineLeave}
      onMouseEnter={() => onTrineEnter(palace.branch)}
      onMouseLeave={onTrineLeave}
      onFocus={() => onTrineEnter(palace.branch)}
      onBlur={onTrineLeave}
    >
      <rect
        width={cellWidth}
        height={cellHeight}
        className="compact-palace-bg"
        pointerEvents="all"
      />
      <text x="9" y="18" className="compact-palace-stem">
        {STEM_ABBREVIATIONS[palace.stem ?? ""] ?? palace.stem} {palace.branch}
      </text>
      <text x={centerX} y="18" textAnchor="middle" className="compact-palace-name">
        {palace.name.toUpperCase()}
      </text>
      <text x={endX} y="18" textAnchor="end" className="compact-palace-age">
        {fortune ? fortune.start : ""}
      </text>
      {marks.length > 0 && (
        <text x={centerX} y="33" textAnchor="middle" className="compact-palace-mark">
          {marks.join(" · ")}
        </text>
      )}
      {stars.major.length ? (
        stars.major.slice(0, 2).map((star, index) => (
          <text
            x={centerX}
            y={marks.length ? 51 + index * 17 : 39 + index * 17}
            textAnchor="middle"
            className={`compact-major-star${starTierClass(star)}`}
            fill={starColor(star, school)}
            style={starVisualStyle(star)}
            key={`${star.name}-${index}`}
          >
            {star.name}
            {star.brightness ? ` (${star.brightness[0]})` : ""}
          </text>
        ))
      ) : (
        <text
          x={centerX}
          y={marks.length ? 51 : 40}
          textAnchor="middle"
          className="compact-empty-major"
        >
          Vô chính diệu
        </text>
      )}

      {columns.map((column, columnIndex) =>
        column.map((star, rowIndex) => (
          <text
            x={columnIndex === 0 ? 9 : maleficX}
            y={minorStartY + rowIndex * 13}
            className={`compact-minor-star${starTierClass(star)}`}
            fill={starColor(star, school)}
            style={starVisualStyle(star)}
            key={`${star.name}-${star.source ?? ""}-${columnIndex}-${rowIndex}`}
          >
            {compactName(star)}
            {star.brightness ? ` (${star.brightness[0]})` : ""}
          </text>
        )),
      )}
      {showPhi && phiFlows.length > 0 && (
        <g className="compact-phi-flows" aria-label={`Phi Hóa cung ${palace.name}`}>
          <title>
            {phiFlows
              .map(
                (flow) =>
                  `Hóa ${flow.mutagen} ${flow.starName} → ${flow.target?.name ?? "chưa an"}`,
              )
              .join(" · ")}
          </title>
          <text x={centerX} y={palacePhiY} textAnchor="middle">
            {phiFlows.slice(0, 4).map((flow, index) => (
              <tspan
                key={`${flow.mutagen}-${flow.starName}`}
                className={`compact-phi-flow is-${flow.mutagen.toLowerCase()}`}
                dx={index === 0 ? 0 : 8}
              >
                {MUTAGEN_ABBREVIATIONS[flow.mutagen] ?? flow.mutagen}→{flow.self ? "Tự" : PALACE_ABBREVIATIONS[flow.target?.name ?? ""] ?? "?"}
              </tspan>
            ))}
          </text>
        </g>
      )}

      <text x="9" y={palaceFooterY} className="compact-palace-footer">
        {flowMonth?.branch || ""}
      </text>
      <text x={centerX} y={palaceFooterY} textAnchor="middle" className="compact-palace-footer">
        {palace.changSheng || ""}
      </text>
      {flowMonth && (
        <text
          x={endX}
          y={palaceFooterY}
          textAnchor="end"
          className="compact-flow-month"
        >
          <title>
            Lưu nguyệt tháng {flowMonth.month}
            {flowMonth.label ? ` (${flowMonth.label})` : ""}
          </title>
          T{flowMonth.month}
        </text>
      )}


      <rect
        width={cellWidth}
        height={cellHeight}
        className="compact-palace-hit"
      />
    </g>
  );
}

function palaceCenter(branch: string, geo: ChartGeometry): Position | null {
  const position = geo.positions[branch];
  return position
    ? {
        x: position.x + geo.cellWidth / 2,
        y: position.y + geo.cellHeight / 2,
      }
    : null;
}

function RelationLines({ branch }: { branch: string | null }) {
  const geo = useChartGeometry();
  if (!branch) return null;
  const center = palaceCenter(branch, geo);
  if (!center) return null;

  const tamHop = (TAM_HOP[branch] ?? []).filter((b) => b !== branch);
  const xungChieu = XUNG_CHIEU[branch];

  const targets = [...tamHop, xungChieu]
    .filter((b): b is string => Boolean(b))
    .map((item) => palaceCenter(item, geo))
    .filter((point): point is Position => Boolean(point));

  const path = targets
    .map((target) => `M ${center.x} ${center.y} L ${target.x} ${target.y}`)
    .join(" ");

  return (
    <g className="compact-tam-hop" aria-hidden="true">
      <path d={path} />
      <circle cx={center.x} cy={center.y} r="4" />
      {targets.map((point, index) => (
        <circle cx={point.x} cy={point.y} r="4" key={index} />
      ))}
    </g>
  );
}

function VoidMarkers({ markers }: { markers: ChartVoidMarker[] }) {
  const geo = useChartGeometry();
  const occupied = new Map<string, number>();

  return (
    <g className="compact-void-markers" aria-label="Vị trí Tuần Triệt">
      {markers.map((marker) => {
        const points = marker.branches
          .slice(0, 2)
          .map((branch) => palaceCenter(branch, geo))
          .filter((point): point is Position => Boolean(point));
        if (points.length !== 2) return null;
        const baseX = (points[0]!.x + points[1]!.x) / 2;
        const sameRow = points[0]!.y === points[1]!.y;
        const middleY = (points[0]!.y + points[1]!.y) / 2;
        // Kabala đặt nhãn của hai cung nằm ngang ở đầu đường biên hướng vào
        // trung cung; với hai cung xếp dọc, nhãn nằm giữa đường biên ngang.
        const baseY = sameRow
          ? middleY < geo.height / 2
            ? geo.cellHeight
            : geo.height - geo.cellHeight
          : middleY;
        const key = `${baseX}:${baseY}`;
        const overlap = occupied.get(key) ?? 0;
        occupied.set(key, overlap + 1);
        const y = baseY + overlap * 17;
        return (
          <g
            className={`compact-void-marker is-${marker.type.toLowerCase()}`}
            transform={`translate(${baseX} ${y})`}
            key={`${marker.type}-${marker.branches.join("-")}`}
          >
            <title>
              {marker.type}: {marker.branches.join(" – ")}
            </title>
            <rect x="-20" y="-8" width="40" height="16" rx="1.5" />
            <text y="3" textAnchor="middle">
              {marker.type}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Center({
  data,
  school,
  gender,
  profileName,
}: {
  data: ChartData;
  school: School;
  gender: "male" | "female";
  profileName?: string;
}) {
  const than = data.palaces[data.thanIndex];
  const activeFortune = data.majorFortunePalace;
  const pillars = [
    [
      "Năm",
      `${data.solar.year}`,
      `${data.yearStem} ${data.yearBranch}`,
    ],
    [
      "Tháng",
      `${data.solar.month} (${data.lunar.month}${data.lunar.leap ? " nhuận" : ""})`,
      `${data.birthMonthStem} ${data.birthMonthBranch}`,
    ],
    [
      "Ngày",
      `${data.solar.day} (${data.lunar.day})`,
      `${data.birthDayStem} ${data.birthDayBranch}`,
    ],
    [
      "Giờ",
      HOUR_RANGES[data.birthHourBranch] ?? "—",
      `${data.birthHourStem} ${data.birthHourBranch}`,
    ],
  ];
  const details = [
    ["Giới tính", gender === "male" ? "Nam" : "Nữ"],
    ["Mệnh", `${data.menhBranch} · ${data.menhElement}`],
    ["Thân cư", than?.name ?? "—"],
    ["Cục", data.cuc.name],
    ["Mệnh–Cục", data.cucMenhRelation.label],
    [
      "Đại vận",
      activeFortune?.majorFortune
        ? `${activeFortune.name} ${activeFortune.majorFortune.start}–${activeFortune.majorFortune.end}`
        : "—",
    ],
    [
      "Lưu niên",
      `${data.annualYear} ${data.annualStem} ${data.annualBranch}`,
    ],
    ["Tuổi mụ", `${data.nominalAge} tuổi`],
  ];

  const { cellWidth, cellHeight, centerWidth, centerHeight } = useChartGeometry();

  return (
    <g transform={`translate(${cellWidth} ${cellHeight})`} className="compact-center">
      <rect width={centerWidth} height={centerHeight} className="compact-center-bg" />
      <text x={centerWidth / 2} y="52" textAnchor="middle" className="compact-center-kicker">
        VOID OCCULT · {SCHOOL_LABEL[school].toUpperCase()}
      </text>
      <text x={centerWidth / 2} y="84" textAnchor="middle" className="compact-center-title">
        {profileName ? profileName.toUpperCase() : "VÔ DANH"}
      </text>
      <text x={centerWidth / 2} y="111" textAnchor="middle" className="compact-center-year">
        {data.yearStem} {data.yearBranch} · {data.yearPolarity}{" "}
        {gender === "male" ? "Nam Mệnh" : "Nữ Mệnh"}
      </text>
      <text x={centerWidth / 2} y="250" textAnchor="middle" className="compact-center-seal">
        紫微
      </text>
      <line
        x1={centerWidth / 2}
        y1="127"
        x2={centerWidth / 2}
        y2="198"
        className="compact-center-divider"
      />
      {pillars.map(([label, value, pillar], index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = column === 0 ? 46 : cellWidth + 30;
        const y = 148 + row * 34;
        return (
          <g className="compact-center-pillar-cell" key={label}>
            <line x1={x} y1={y + 10} x2={x + 154} y2={y + 10} />
            <text x={x} y={y} className="compact-center-label">
              {label}
            </text>
            <text x={x + 34} y={y} className="compact-center-value">
              {value}
            </text>
            <text x={x + 78} y={y} className="compact-center-pillar">
              {pillar}
            </text>
          </g>
        );
      })}
      <line
        x1={centerWidth / 2}
        y1="217"
        x2={centerWidth / 2}
        y2="363"
        className="compact-center-divider"
      />
      {details.map(([label, value], index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = column === 0 ? 46 : cellWidth + 30;
        const y = 238 + row * 40;
        return (
          <g className="compact-center-detail-cell" key={label}>
            <line x1={x} y1={y + 18} x2={x + 154} y2={y + 18} />
            <text x={x} y={y} className="compact-center-label">
              {label}
            </text>
            <text x={x} y={y + 14} className="compact-center-value">
              {value}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function DetailSheet({
  palace,
  school,
  showAnnual,
  showMutagens,
  onClose,
}: {
  palace: ChartPalace;
  school: School;
  showAnnual: boolean;
  showMutagens: boolean;
  onClose(): void;
}) {
  const stars = visibleStars(palace, showAnnual, showMutagens);
  const voidMarks = (palace.stars ?? [])
    .filter((star) => BOUNDARY_VOID_STARS.has(star.name))
    .map((star) => star.name);
  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const sections = [
    ["Chính tinh", stars.major],
    ["Cát tinh · trợ tinh", stars.benefic],
    ["Sát tinh · bại tinh", stars.malefic],
  ] as const;

  return (
    <div
      className="compact-detail-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <aside
        className="compact-detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compact-detail-title"
      >
        <div className="compact-detail-handle" aria-hidden="true" />
        <header className="compact-detail-head">
          <div>
            <span className="han">{palace.han}</span>
            <div>
              <h3 id="compact-detail-title">{palace.name}</h3>
              <p>
                {palace.stem} {palace.branch}
                {palace.isMenh ? " · Cung Mệnh" : ""}
                {palace.isThan ? " · Cung Thân" : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết cung"
            autoFocus
          >
            ✕
          </button>
        </header>
        <div className="compact-detail-body">
          {sections.map(([title, sectionStars]) =>
            sectionStars.length ? (
              <section key={title}>
                <h4>{title}</h4>
                <div className="compact-detail-star-list">
                  {sectionStars.map((star, index) => (
                    <span
                      style={{ color: starColor(star, school) }}
                      key={`${star.name}-${star.source ?? ""}-${index}`}
                    >
                      <b>{star.name}</b>
                      {star.brightness && <small>{star.brightness}</small>}
                      {star.targetStar && <small>→ {star.targetStar}</small>}
                    </span>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
        <footer className="compact-detail-meta">
          {voidMarks.map((mark) => (
            <span className="is-void-marker" key={mark}>
              {mark}
            </span>
          ))}
          {palace.changSheng && <span>{palace.changSheng}</span>}
          {palace.majorFortune && (
            <span>
              Đại vận {palace.majorFortune.start}–{palace.majorFortune.end}
            </span>
          )}
          {(palace.flowMonths ?? []).length > 0 && (
            <span>
              Lưu nguyệt{" "}
              {(palace.flowMonths ?? []).map((month) => month.month).join(", ")}
            </span>
          )}
        </footer>
      </aside>
    </div>
  );
}

export function CompactChart({
  data,
  school,
  gender,
  showAnnual,
  showMutagens,
  showPhi,
  captureRef,
  profileName,
}: CompactChartProps) {
  const stacked = useStackedLayout();
  const geometry = stacked ? MOBILE_GEOMETRY : DESKTOP_GEOMETRY;
  const [selectedPalace, setSelectedPalace] = useState<ChartPalace | null>(null);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const canUseRelationLines = useDesktopTrineInteractions();
  const palaces = useMemo(
    () =>
      data
        ? data.palaces
            .filter((palace) => geometry.positions[palace.branch])
            .sort(
              (a, b) =>
                geometry.positions[a.branch]!.y - geometry.positions[b.branch]!.y ||
                geometry.positions[a.branch]!.x - geometry.positions[b.branch]!.x,
            )
        : [],
    [data, geometry],
  );
  const phiFlowsByPalace = useMemo(() => {
    const flows = new Map<number, ChartPhiFlow[]>();
    for (const flow of data?.phiFlows ?? []) {
      const items = flows.get(flow.source.index) ?? [];
      items.push(flow);
      flows.set(flow.source.index, items);
    }
    return flows;
  }, [data]);
  useEffect(() => {
    if (!canUseRelationLines && hoveredBranch) setHoveredBranch(null);
  }, [canUseRelationLines, hoveredBranch]);

  const activeRelationBranch = canUseRelationLines ? hoveredBranch : null;

  if (!data) {
    return <div className="compact-chart-loading">Đang lập lá số…</div>;
  }

  return (
    <ChartGeometryContext.Provider value={geometry}>
      <div className="compact-chart-capture" ref={captureRef}>
        <svg
          className="compact-chart-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          width={geometry.width}
          height={geometry.height}
          role="img"
          aria-label={`Lá số Tử Vi ${SCHOOL_LABEL[school]}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <style>{compactChartCss}</style>
          <title>Lá số Tử Vi {SCHOOL_LABEL[school]}</title>
          <rect
            width={geometry.width}
            height={geometry.height}
            className="compact-sheet-bg"
          />
          {palaces.map((palace) => (
            <Palace
              palace={palace}
              school={school}
              showAnnual={showAnnual}
              showMutagens={showMutagens}
              showPhi={showPhi}
              phiFlows={phiFlowsByPalace.get(palace.index) ?? []}
              trineState={
                activeRelationBranch
                  ? palace.branch === activeRelationBranch ||
                    TAM_HOP[activeRelationBranch]?.includes(palace.branch) ||
                    XUNG_CHIEU[activeRelationBranch] === palace.branch
                    ? "active"
                    : "dim"
                  : null
              }
              onTrineEnter={(branch) => {
                if (canUseRelationLines) setHoveredBranch(branch);
              }}
              onTrineLeave={() => {
                if (canUseRelationLines) setHoveredBranch(null);
              }}
              onSelect={setSelectedPalace}
              key={`${palace.name}-${palace.branch}`}
            />
          ))}
          <Center data={data} school={school} gender={gender} profileName={profileName} />
          <RelationLines branch={activeRelationBranch} />
          <VoidMarkers markers={data.voidMarkers ?? []} />
          <rect
            x="1"
            y="1"
            width={geometry.width - 2}
            height={geometry.height - 2}
            className="compact-sheet-outline"
            pointerEvents="none"
          />
        </svg>
      </div>
      {selectedPalace && (
        <DetailSheet
          palace={selectedPalace}
          school={school}
          showAnnual={showAnnual}
          showMutagens={showMutagens}
          onClose={() => setSelectedPalace(null)}
        />
      )}
    </ChartGeometryContext.Provider>
  );
}
