import type { ScoreLine, TrendPoint } from "@/lib/ziwei/trend";

interface TrendPointPanelProps {
  point: TrendPoint | null;
  onClose: () => void;
}

function BreakdownList({
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

  return (
    <div className={`trend-breakdown is-${tone}`}>
      <h4>{title}</h4>
      <ul>
        {lines.map((line, index) => (
          <li key={`${line.source}-${index}`}>
            <span className="trend-breakdown-source">{line.source}</span>
            <span className="trend-breakdown-points">
              {line.points > 0 ? `+${line.points}` : line.points}
            </span>
            <small>{line.reason}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendPointPanel({ point, onClose }: TrendPointPanelProps) {
  if (!point) return null;

  return (
    <aside className="trend-point-panel" aria-live="polite">
      <header className="trend-point-panel-head">
        <div>
          <p className="trend-point-kicker">Bài làm engine (tất định)</p>
          <h3>Mốc {point.label}</h3>
          <p className="trend-point-scores">
            Cát <strong>{point.cat}</strong>
            <span aria-hidden="true"> · </span>
            Hung <strong>{point.hung}</strong>
            {point.isCurrent ? <span className="trend-point-current"> · Hiện hành</span> : null}
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} aria-label="Đóng panel">
          Đóng
        </button>
      </header>

      <div className="trend-point-panel-body">
        <BreakdownList title="Cát" lines={point.breakdown.cat} tone="cat" />
        <BreakdownList title="Hung" lines={point.breakdown.hung} tone="hung" />
      </div>
    </aside>
  );
}
