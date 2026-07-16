import type { ScoreLine, TrendPoint } from "@/lib/ziwei/trend-score";

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
  tone: "tai" | "thach";
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
            Tài lộc <strong>{point.taiLoc}</strong>
            <span aria-hidden="true"> · </span>
            Thách thức <strong>{point.thachThuc}</strong>
            {point.isCurrent ? <span className="trend-point-current"> · Hiện hành</span> : null}
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose} aria-label="Đóng panel">
          Đóng
        </button>
      </header>

      <div className="trend-point-panel-body">
        <BreakdownList title="Tài lộc" lines={point.breakdown.taiLoc} tone="tai" />
        <BreakdownList
          title="Thách thức"
          lines={point.breakdown.thachThuc}
          tone="thach"
        />
      </div>

      <footer className="trend-point-panel-foot">
        <button type="button" className="btn-ghost" disabled title="Sắp có">
          Luận chi tiết mốc này
        </button>
        <small>Sắp có — LLM chỉ diễn giải tổ hợp sẵn có, không tạo số.</small>
      </footer>
    </aside>
  );
}
