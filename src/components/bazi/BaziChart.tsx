import { BaziFullChart, BaziPillarDetail } from "../../lib/bazi/bazi-engine";
import { LuckPillar } from "../../lib/bazi/luck-pillars";

function getElementColor(char: string) {
  const wood = ["Giáp", "Ất", "Dần", "Mão"];
  const fire = ["Bính", "Đinh", "Tị", "Ngọ"];
  const earth = ["Mậu", "Kỷ", "Thìn", "Tuất", "Sửu", "Mùi"];
  const metal = ["Canh", "Tân", "Thân", "Dậu"];
  const water = ["Nhâm", "Quý", "Hợi", "Tý"];

  if (wood.includes(char)) return "text-jade";
  if (fire.includes(char)) return "text-cinnabar";
  if (earth.includes(char)) return "text-[#b47a46]"; // Nâu đất
  if (metal.includes(char)) return "text-gold";
  if (water.includes(char)) return "text-blue-400";
  return "text-white";
}

function PillarColumn({ title, detail }: { title: string; detail: BaziPillarDetail }) {
  return (
    <div className="flex flex-col border border-white/10 rounded-lg overflow-hidden bg-[#0d0b14]">
      <div className="bg-white/5 py-2 text-center text-sm font-semibold tracking-wide border-b border-white/10 text-muted uppercase">
        {title}
      </div>
      
      {/* Can Chi */}
      <div className="flex flex-col items-center py-6 gap-2">
        <div className="flex flex-col items-center">
          <div className="text-xs text-muted/70 mb-1">{detail.tenGod}</div>
          <div className={`text-4xl font-han font-bold ${getElementColor(detail.pillar.stem)}`}>
            {detail.pillar.stem}
          </div>
        </div>
        <div className="flex flex-col items-center mt-2">
          <div className={`text-4xl font-han font-bold ${getElementColor(detail.pillar.branch)}`}>
            {detail.pillar.branch}
          </div>
          <div className="text-xs text-muted/70 mt-1">{detail.lifeStage}</div>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Tàng Can & Thập Thần */}
      <div className="p-3 text-center flex flex-col gap-2 bg-white/[0.02]">
        <div className="text-xs uppercase text-muted tracking-wide border-b border-white/5 pb-1">Tàng Can</div>
        {detail.hiddenStems.map((hidden, i) => (
          <div key={i} className="flex justify-between items-center text-sm px-2">
            <span className={`${getElementColor(hidden.stem)} font-medium`}>{hidden.stem}</span>
            <span className="text-muted/70 text-xs">{hidden.tenGod}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/10" />

      {/* Thông tin phụ */}
      <div className="p-3 text-sm flex flex-col gap-1.5 bg-black/20 flex-1">
        <div className="flex justify-between">
          <span className="text-muted/60">Nạp Âm</span>
          <span className="text-right text-paper/80">{detail.nayin}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted/60">Không Vong</span>
          <span className="text-right text-paper/80">{detail.isVoid ? "Có" : "-"}</span>
        </div>
        {detail.stars.length > 0 && (
          <div className="pt-2 mt-1 border-t border-white/5">
            <div className="text-xs text-muted/60 mb-1">Thần Sát</div>
            <div className="flex flex-wrap gap-1">
              {detail.stars.map((s, i) => (
                <span key={i} className="text-[11px] bg-white/10 px-1.5 py-0.5 rounded text-paper/80">{s.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BaziChart({ chart }: { chart: BaziFullChart }) {
  // Bát Tự đọc từ phải sang trái
  const pillars = [
    { title: "Trụ Giờ", detail: chart.details.hour },
    { title: "Trụ Ngày", detail: chart.details.day },
    { title: "Trụ Tháng", detail: chart.details.month },
    { title: "Trụ Năm", detail: chart.details.year },
  ];

  return (
    <div className="space-y-8">
      {/* 4 Cột Bát Tự */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-paper">Tứ Trụ (Bát Tự)</h2>
          <div className="text-sm text-muted">
            <span className="mr-4">Tuần Không: <strong className="text-paper">{chart.voids.join(", ")}</strong></span>
            <span>Mệnh Cung: <strong className="text-paper">{chart.derived.lifePalace.pillar.stem} {chart.derived.lifePalace.pillar.branch}</strong></span>
          </div>
        </div>
        <div className="flex flex-col-reverse md:flex-row gap-4">
          {pillars.map((p) => (
            <div key={p.title} className="flex-1">
              <PillarColumn title={p.title} detail={p.detail} />
            </div>
          ))}
        </div>
      </section>

      {/* Đại Vận */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Đại Vận (10 Năm)</h2>
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 custom-scrollbar">
          {chart.luck.pillars.map((lp, i) => (
            <div key={i} className="min-w-[80px] flex-shrink-0 flex flex-col border border-white/10 rounded overflow-hidden text-center bg-black/20">
              <div className="bg-white/5 py-1 text-xs text-muted border-b border-white/10">Tuổi {lp.startAgeYear}</div>
              <div className="py-3 px-2 flex flex-col gap-1">
                <div className={`text-xl font-han font-medium ${getElementColor(lp.pillar.stem)}`}>{lp.pillar.stem}</div>
                <div className={`text-xl font-han font-medium ${getElementColor(lp.pillar.branch)}`}>{lp.pillar.branch}</div>
              </div>
              <div className="bg-white/5 py-1 text-[10px] text-muted/60 border-t border-white/10">{lp.startDate.getFullYear()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dụng Thần (Placeholder) */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Phân Tích Dụng Thần</h2>
        <div className="border border-dashed border-white/20 rounded-lg p-8 text-center bg-white/[0.01]">
          <p className="text-muted text-sm">Hệ thống LLM sẽ tự động luận giải và phân tích Dụng Thần tại đây.</p>
        </div>
      </section>
    </div>
  );
}
