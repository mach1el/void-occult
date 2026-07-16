import type { CSSProperties } from "react";
import type {
  ChartData,
  ChartPhiFlow,
  ChartPalace,
  ChartStar,
  School,
} from "@/types/chart";
import { getEngine, SCHOOL_LABEL } from "@/lib/ziwei/chart";
import {
  compareNatalBeforeAnnual,
  isBeneficStar,
  isStrongBrightness,
  starDisplayOpacity,
  starTier,
} from "@/lib/ziwei/star-classification";

interface MobileChartProps {
  data: ChartData | null;
  school: School;
  showAnnual: boolean;
  showMutagens: boolean;
  showPhi: boolean;
  profileName?: string;
  gender: "male" | "female";
}

const BOUNDARY_VOID_STARS = new Set(["Tuần", "Triệt"]);

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

function starGroups(
  palace: ChartPalace,
  showAnnual: boolean,
  showMutagens: boolean,
) {
  const major: ChartStar[] = [];
  const supporting: ChartStar[] = [];
  const challenging: ChartStar[] = [];

  for (const star of palace.stars ?? []) {
    const source = star.source ?? "";
    if (BOUNDARY_VOID_STARS.has(star.name)) continue;
    if (!showAnnual && (source === "annual" || source === "annual-mutagen")) {
      continue;
    }
    if (!showMutagens && source.endsWith("-mutagen")) continue;
    if (star.layer === "major") major.push(star);
    else if (isBeneficStar(star)) supporting.push(star);
    else challenging.push(star);
  }
  supporting.sort(compareNatalBeforeAnnual);
  challenging.sort(compareNatalBeforeAnnual);
  return { major, supporting, challenging };
}

function elementClass(name: string, school: School): string {
  const element = getEngine(school)?.elementForStar(name);
  return element ? ` mobile-element-${element.toLowerCase()}` : "";
}

function tierClass(star: ChartStar): string {
  const tier = starTier(star);
  return tier === 1 ? "" : ` is-tier-${tier}`;
}

// Độ sáng miếu/vượng/hãm áp SAU màu ngũ hành (mobile-element-*) — chỉ đổi
// opacity (đã kết hợp tầng bậc) và độ đậm, không đổi màu. Nhãn chữ brightness
// giữ nguyên như cũ.
function starVisualStyle(star: ChartStar): CSSProperties {
  const style: CSSProperties = { opacity: starDisplayOpacity(star) };
  if (isStrongBrightness(star.brightness)) style.fontWeight = 800;
  return style;
}

function Stars({
  stars,
  school,
  tone = "neutral",
}: {
  stars: ChartStar[];
  school: School;
  tone?: "major" | "good" | "bad" | "annual" | "neutral";
}) {
  if (!stars.length) return <span className="mobile-empty">—</span>;
  return (
    <div className={`mobile-star-list is-${tone}`}>
      {stars.map((star, index) => (
        <span
          className={`mobile-star${elementClass(star.name, school)}${tierClass(star)}`}
          style={starVisualStyle(star)}
          key={`${star.name}-${star.source ?? ""}-${index}`}
        >
          {star.name}
          {star.brightness && (
            <small className="mobile-brightness">{star.brightness}</small>
          )}
          {star.targetStar && (
            <small className="mobile-target">→ {star.targetStar}</small>
          )}
        </span>
      ))}
    </div>
  );
}

function PalaceCard({
  palace,
  school,
  order,
  showAnnual,
  showMutagens,
  showPhi,
  phiFlows,
}: {
  palace: ChartPalace;
  school: School;
  order: number;
  showAnnual: boolean;
  showMutagens: boolean;
  showPhi: boolean;
  phiFlows: ChartPhiFlow[];
}) {
  const groups = starGroups(palace, showAnnual, showMutagens);
  const voidMarks = (palace.stars ?? [])
    .filter((star) => BOUNDARY_VOID_STARS.has(star.name))
    .map((star) => star.name);
  const marks = [
    palace.isMenh ? "Mệnh" : "",
    palace.isThan ? "Thân" : "",
    palace.majorFortune?.active ? "Đại vận" : "",
    palace.isTaiTuePalace ? "Thái Tuế" : "",
    ...voidMarks,
  ].filter(Boolean);

  return (
    <article
      id={`mobile-palace-${order}`}
      className={`mobile-palace-card${palace.isMenh ? " is-menh" : ""}${palace.isThan ? " is-than" : ""}`}
    >
      <header className="mobile-palace-head">
        <div>
          <span className="mobile-palace-han han">{palace.han}</span>
          <h3>{palace.name}</h3>
          <span className="mobile-palace-branch">
            {palace.branch} · can {palace.stem}
          </span>
        </div>
        {marks.length > 0 && (
          <div className="mobile-palace-marks">
            {marks.map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </div>
        )}
      </header>

      <section className="mobile-star-section is-major">
        <h4>Chính tinh</h4>
        <Stars stars={groups.major} school={school} tone="major" />
      </section>

      <div className="mobile-star-columns">
        <section className="mobile-star-section">
          <h4>Cát tinh · phụ tinh</h4>
          <Stars stars={groups.supporting} school={school} tone="good" />
        </section>
        <section className="mobile-star-section">
          <h4>Sát tinh · bại tinh</h4>
          <Stars stars={groups.challenging} school={school} tone="bad" />
        </section>
      </div>

      {showPhi && phiFlows.length > 0 && (
        <section className="mobile-phi-section">
          <h4>Phi Hóa từ cung này</h4>
          <div>
            {phiFlows.map((flow) => (
              <span key={`${flow.mutagen}-${flow.starName}`}>
                Hóa {flow.mutagen} → {flow.self ? "tự hóa" : flow.target?.name ?? "?"}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="mobile-palace-meta">
        {palace.changSheng && <span>{palace.changSheng}</span>}
        {palace.majorFortune && (
          <span>
            Đại vận {palace.majorFortune.start}–{palace.majorFortune.end}
          </span>
        )}
        {showAnnual && (palace.flowMonths ?? []).length > 0 && (
          <span>
            Lưu nguyệt:{" "}
            {(palace.flowMonths ?? []).map((month) => month.month).join(", ")}
          </span>
        )}
      </footer>
    </article>
  );
}

export function MobileChart({
  data,
  school,
  showAnnual,
  showMutagens,
  showPhi,
  profileName,
  gender,
}: MobileChartProps) {
  if (!data) {
    return <div className="mobile-chart-loading">Đang lập lá số…</div>;
  }

  const ordered = [...data.palaces].sort(
    (a, b) => PALACE_ORDER.indexOf(a.name) - PALACE_ORDER.indexOf(b.name),
  );
  const thanPalace = data.palaces[data.thanIndex];

  return (
    <div className="mobile-chart-reader">
      <section className="mobile-chart-summary">
        <div className="mobile-summary-title">
          <span>{SCHOOL_LABEL[school]}</span>
          <strong>
            {profileName ? profileName.toUpperCase() : "VÔ DANH"}
          </strong>
        </div>
        <div className="mobile-summary-subtitle">
          {data.yearStem} {data.yearBranch} · Giờ {data.birthHourBranch} · {data.yearPolarity} {gender === "male" ? "Nam Mệnh" : "Nữ Mệnh"}
        </div>
        <div className="mobile-summary-grid">
          <div>
            <small>Mệnh</small>
            <b>
              {data.menhBranch} · {data.menhElement}
            </b>
          </div>
          <div>
            <small>Thân</small>
            <b>{thanPalace?.name ?? "—"}</b>
          </div>
          <div>
            <small>Cục</small>
            <b>{data.cuc.name}</b>
          </div>
          <div>
            <small>Lưu niên</small>
            <b>
              {data.annualYear} {data.annualStem} {data.annualBranch}
            </b>
          </div>
        </div>
      </section>

      <nav className="mobile-palace-nav" aria-label="Đi nhanh tới cung">
        {ordered.map((palace, index) => (
          <a href={`#mobile-palace-${index}`} key={palace.name}>
            {palace.name}
          </a>
        ))}
      </nav>

      <div className="mobile-palace-list">
        {ordered.map((palace, index) => (
          <PalaceCard
            palace={palace}
            school={school}
            order={index}
            showAnnual={showAnnual}
            showMutagens={showMutagens}
            showPhi={showPhi}
            phiFlows={(data.phiFlows ?? []).filter(
              (flow) => flow.source.index === palace.index,
            )}
            key={`${palace.name}-${palace.branch}`}
          />
        ))}
      </div>
    </div>
  );
}
