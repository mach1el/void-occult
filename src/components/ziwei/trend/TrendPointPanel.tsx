import type { ScoreLine, TrendPoint } from "@/lib/ziwei/trend";
import { roundTo1Decimal } from "@/lib/ziwei/trend";
import {
  flattenGroupedLines,
  groupScoreLines,
  layerBadgeLabel,
  lunarMonthHeaderLabel,
  roleBadgeLabel,
  type BreakdownGroup,
} from "./breakdown-groups";

interface TrendPointPanelProps {
  point: TrendPoint | null;
  onClose: () => void;
}

function formatPoints(points: number): string {
  const rounded = roundTo1Decimal(points);
  if (rounded === 0) return "·";
  const text =
    Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return rounded > 0 ? `+${text}` : text;
}

function lineTitle(line: ScoreLine): string {
  if (line.category === "mutagen") {
    const layer = layerBadgeLabel(line.layer) ?? line.source;
    const kind = line.transform ?? "";
    return kind ? `${layer} Hóa ${kind}` : line.source;
  }
  if (line.brightness) return `${line.source} (${line.brightness})`;
  return line.source;
}

function lineSubtitle(line: ScoreLine): string {
  if (line.category === "mutagen") {
    const target = line.targetStar ?? "?";
    const at =
      line.palaceName && line.palaceBranch
        ? ` tại ${line.palaceName}`
        : line.palaceName
          ? ` tại ${line.palaceName}`
          : "";
    const layerHint =
      line.layer === "natal"
        ? `Hóa ${line.transform ?? ""} gốc`
        : line.layer === "annual"
          ? `Lưu niên hóa ${line.transform ?? ""}`
          : line.layer === "monthly"
            ? `Lưu nguyệt hóa ${line.transform ?? ""}`
            : line.reason;
    return `${layerHint} → ${target}${at}`.replace(/\s+/g, " ").trim();
  }

  if (line.category === "major-star" || line.category === "minor-star") {
    if (line.palaceRole === "focus" && line.palaceName && line.palaceBranch) {
      return `Chính cung ${line.palaceName} tại ${line.palaceBranch}`;
    }
    if (line.palaceRole === "xung" && line.palaceName && line.palaceBranch) {
      return `Xung chiếu từ ${line.palaceName} tại ${line.palaceBranch}`;
    }
    if (line.palaceRole === "tam-hop" && line.palaceName && line.palaceBranch) {
      return `Tam hợp từ ${line.palaceName} tại ${line.palaceBranch}`;
    }
  }

  return line.reason;
}

function LineBadges({ line }: { line: ScoreLine }) {
  const badges: string[] = [];
  if (line.category === "major-star" || line.category === "minor-star") {
    const role = roleBadgeLabel(line.palaceRole);
    if (role) badges.push(role);
  }
  if (line.category === "mutagen") {
    const layer = layerBadgeLabel(line.layer);
    if (layer) badges.push(layer);
  }
  if (!badges.length) return null;
  return (
    <span className="trend-breakdown-badges">
      {badges.map((badge) => (
        <span className="trend-breakdown-badge" key={badge}>
          {badge}
        </span>
      ))}
    </span>
  );
}

function GroupedBreakdownList({
  title,
  lines,
  tone,
}: {
  title: string;
  lines: ScoreLine[];
  tone: "cat" | "hung";
}) {
  if (!lines.length) {
    return (
      <div className={`trend-breakdown is-${tone}`}>
        <h4>{title}</h4>
        <p className="trend-breakdown-empty">Không có đóng góp được ghi nhận.</p>
      </div>
    );
  }

  const groups: BreakdownGroup[] = groupScoreLines(lines);
  // Invariant: không nhân đôi / mất dòng khi nhóm.
  if (flattenGroupedLines(groups).length !== lines.length) {
    // Fallback an toàn — không bao giờ làm lệch WYSIWYG.
    return (
      <div className={`trend-breakdown is-${tone}`}>
        <h4>{title}</h4>
        <ul>
          {lines.map((line, index) => (
            <li key={`${line.source}-${index}`}>
              <span className="trend-breakdown-source">{lineTitle(line)}</span>
              <span className="trend-breakdown-points">
                {formatPoints(line.points)}
              </span>
              <small>{lineSubtitle(line)}</small>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={`trend-breakdown is-${tone}`}>
      <h4>{title}</h4>
      {groups.map((group) => (
        <section
          key={group.id}
          className={`trend-breakdown-group${group.id === "technical" ? " is-technical" : ""}${group.id === "major-focus" ? " is-major-focus" : ""}`}
        >
          <h5>{group.title}</h5>
          <ul>
            {group.lines.map((line, index) => (
              <li key={`${group.id}-${line.source}-${index}`}>
                <span className="trend-breakdown-source">
                  {lineTitle(line)}
                  <LineBadges line={line} />
                </span>
                <span className="trend-breakdown-points">
                  {formatPoints(line.points)}
                </span>
                <small title={line.reason}>{lineSubtitle(line)}</small>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PanelHeader({ point }: { point: TrendPoint }) {
  const isMonthly =
    typeof point.monthNumber === "number" &&
    point.calendarStem &&
    point.calendarBranch;

  if (isMonthly) {
    return (
      <div>
        <p className="trend-point-kicker">Bài làm engine (tất định)</p>
        <h3>
          {lunarMonthHeaderLabel(point.monthNumber!)} · {point.calendarStem}{" "}
          {point.calendarBranch}
        </h3>
        {point.focusPalaceName && point.focusPalaceBranch ? (
          <p className="trend-point-focus">
            Lưu Nguyệt Mệnh: {point.focusPalaceName} tại {point.focusPalaceBranch}
          </p>
        ) : null}
        <p className="trend-point-scores">
          Cát <strong>{point.cat}</strong>
          <span aria-hidden="true"> · </span>
          Hung <strong>{point.hung}</strong>
          {point.isCurrent ? (
            <span className="trend-point-current"> · Hiện hành</span>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="trend-point-kicker">Bài làm engine (tất định)</p>
      <h3>Mốc {point.label}</h3>
      <p className="trend-point-scores">
        Cát <strong>{point.cat}</strong>
        <span aria-hidden="true"> · </span>
        Hung <strong>{point.hung}</strong>
        {point.isCurrent ? (
          <span className="trend-point-current"> · Hiện hành</span>
        ) : null}
      </p>
    </div>
  );
}

export function TrendPointPanel({ point, onClose }: TrendPointPanelProps) {
  if (!point) return null;

  const voids = point.majorStarContext?.voidMajorPalaces ?? [];

  return (
    <aside className="trend-point-panel" aria-live="polite">
      <header className="trend-point-panel-head">
        <PanelHeader point={point} />
        <button type="button" className="btn-ghost" onClick={onClose} aria-label="Đóng panel">
          Đóng
        </button>
      </header>

      {voids.length > 0 ? (
        <div className="trend-void-callout">
          <p className="trend-void-callout-title">Vô chính diệu trong TP4C:</p>
          <ul>
            {voids.map((item) => (
              <li key={`${item.palaceRole}-${item.palaceName}-${item.palaceBranch}`}>
                {roleBadgeLabel(item.palaceRole) ?? item.palaceRole} {item.palaceName}{" "}
                tại {item.palaceBranch}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="trend-point-panel-body">
        <GroupedBreakdownList title="Cát" lines={point.breakdown.cat} tone="cat" />
        <GroupedBreakdownList title="Hung" lines={point.breakdown.hung} tone="hung" />
      </div>
    </aside>
  );
}
