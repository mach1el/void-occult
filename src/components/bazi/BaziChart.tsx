import { useState, useMemo } from "react";
import { BaziFullChart, BaziPillarDetail, DerivedPillarDetail } from "@/lib/bazi/bazi-engine";
import { LuckPillar } from "@/lib/bazi/luck-pillars";
import { SymbolicStar } from "@/lib/bazi/symbolic-stars";
import { calculateElementStrength } from "@/lib/bazi/element-strength";
import { determineYongShen } from "@/lib/bazi/yong-shen";
import { ElementRadar } from "./ElementRadar";
import { AnnualYearsTable } from "./AnnualYearsTable";
import { useDragScroll } from "./useDragScroll";

function getElementColor(char: string) {
  const wood = ["Giáp", "Ất", "Dần", "Mão"];
  const fire = ["Bính", "Đinh", "Tị", "Ngọ"];
  const earth = ["Mậu", "Kỷ", "Thìn", "Tuất", "Sửu", "Mùi"];
  const metal = ["Canh", "Tân", "Thân", "Dậu"];
  const water = ["Nhâm", "Quý", "Hợi", "Tý"];

  if (wood.includes(char)) return "text-jade";
  if (fire.includes(char)) return "text-cinnabar";
  if (earth.includes(char)) return "text-earth";
  if (metal.includes(char)) return "text-metal";
  if (water.includes(char)) return "text-water";
  return "text-white";
}

const STAR_SOURCE_LABEL: Record<SymbolicStar["sourceType"], string> = {
  DayStem: "từ can ngày",
  YearStem: "từ can năm",
  DayBranch: "từ chi ngày",
  YearBranch: "từ chi năm",
};

function StarPill({ star }: { star: SymbolicStar }) {
  return (
    <span
      title={STAR_SOURCE_LABEL[star.sourceType]}
      className="inline-flex flex-col items-center text-[11px] bg-white/10 px-1.5 py-0.5 rounded text-paper/80 leading-tight"
    >
      <span>{star.name}</span>
      <span className="text-[8px] text-muted/50">{STAR_SOURCE_LABEL[star.sourceType]}</span>
    </span>
  );
}

interface HiddenStemStyle {
  stem: string;
  role: string;
  tenGod: string;
}

// Bản khí là khí chủ đạo của Chi, nên phải nổi bật hơn Trung khí và Dư khí.
const HIDDEN_STEM_STYLE: Record<string, HiddenStemStyle> = {
  "Bản khí": {
    stem: "text-base font-bold",
    role: "text-[10px] tracking-wide text-muted/70",
    tenGod: "text-xs text-muted/80",
  },
  "Trung khí": {
    stem: "text-sm font-medium opacity-80",
    role: "text-[9px] tracking-wide text-muted/50",
    tenGod: "text-[11px] text-muted/60",
  },
  "Dư khí": {
    stem: "text-xs font-normal opacity-60",
    role: "text-[9px] tracking-wide text-muted/40",
    tenGod: "text-[10px] text-muted/50",
  },
};
const FALLBACK_HIDDEN_STEM_STYLE = HIDDEN_STEM_STYLE["Dư khí"]!;

function PillarColumn({
  title,
  detail,
  isDayPillar,
  pillarKey,
  voids,
}: {
  title: string;
  detail: BaziPillarDetail;
  isDayPillar: boolean;
  pillarKey: "year" | "month" | "day" | "hour";
  voids: [string, string];
}) {
  return (
    <div
      data-testid={`pillar-column-${pillarKey}`}
      className={`flex flex-col border rounded-lg overflow-hidden bg-[#0d0b14] ${
        isDayPillar ? "border-gold/50 shadow-[0_0_15px_rgba(223,189,109,0.1)]" : "border-white/10"
      }`}
    >
      <div className={`py-1.5 text-center text-xs font-semibold tracking-wider uppercase ${
        isDayPillar ? "bg-gold/10 text-gold" : "bg-white/5 text-muted border-b border-white/10"
      }`}>
        {title}
      </div>

      {/* Can Chi */}
      <div className="flex flex-col items-center py-3 lg:py-4 gap-1">
        <div className="flex flex-col items-center">
          <div
            className={
              isDayPillar
                ? "text-[11px] font-bold text-gold tracking-widest mb-0.5 uppercase"
                : "text-[10px] text-muted/70 tracking-wider mb-0.5 uppercase"
            }
          >
            {detail.tenGod}
          </div>
          <div className={`text-2xl lg:text-3xl font-han font-bold leading-none ${getElementColor(detail.pillar.stem)}`}>
            {detail.pillar.stem}
          </div>
        </div>
        <div className="flex flex-col items-center mt-1.5">
          <div className={`text-2xl lg:text-3xl font-han font-bold leading-none ${getElementColor(detail.pillar.branch)}`}>
            {detail.pillar.branch}
          </div>
        </div>
      </div>

      <div className="h-px bg-white/10 mx-2" />

      {/* Tàng Can & Thập Thần, xếp theo trọng số Bản khí > Trung khí > Dư khí */}
      <div className="p-1.5 lg:p-2 text-center flex flex-col gap-1 lg:gap-1.5 bg-white/[0.02]">
        <div className="text-[10px] uppercase text-muted/50 tracking-widest pb-0.5">Tàng Can</div>
        {detail.hiddenStems.map((hidden, i) => {
          const style = HIDDEN_STEM_STYLE[hidden.type] ?? FALLBACK_HIDDEN_STEM_STYLE;
          return (
            <div key={i} className="flex justify-between items-center px-1">
              <span className="flex flex-col items-start leading-tight">
                <span className={`${getElementColor(hidden.stem)} ${style.stem}`}>{hidden.stem}</span>
                <span className={style.role}>{hidden.type}</span>
              </span>
              <span className={style.tenGod}>{hidden.tenGod}</span>
            </div>
          );
        })}
      </div>

      <div className="h-px bg-white/10 mx-2" />

      {/* Trường Sinh */}
      <div className="px-2 py-1 lg:px-3 lg:py-1.5 flex justify-between items-center text-xs bg-white/[0.02]">
        <span className="text-muted/50 uppercase tracking-widest text-[9px]">Trường Sinh</span>
        <span className="text-right text-paper/90 font-medium" data-testid="life-stage">
          {detail.lifeStage}
        </span>
      </div>

      <div className="h-px bg-white/10 mx-2" />

      {/* Thông tin phụ */}
      <div className="p-2 lg:p-2.5 text-xs flex flex-col gap-1 lg:gap-1.5 bg-black/20 flex-1">
        <div className="flex justify-between items-center">
          <span className="text-muted/50 uppercase tracking-widest text-[9px]">Nạp Âm</span>
          <span className="text-right text-paper/80">{detail.nayin}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted/50 uppercase tracking-widest text-[9px]">Tuần Không</span>
          <span className="text-right text-paper/80">{detail.isVoid ? voids.join(" · ") : "-"}</span>
        </div>
        {detail.stars.length > 0 && (
          <div className="pt-1.5 mt-0.5 border-t border-white/5">
            <div className="text-[9px] uppercase tracking-widest text-muted/50 mb-1">Thần Sát</div>
            <div className="flex flex-wrap gap-1">
              {detail.stars.map((s, i) => (
                <StarPill key={i} star={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VoidCard({ voids }: { voids: [string, string] }) {
  return (
    <div className="border border-white/10 rounded-lg p-3 bg-[#0d0b14]">
      <div className="text-xs uppercase text-muted tracking-wide border-b border-white/5 pb-1 mb-2">
        Không Vong (Tuần Không)
      </div>
      <div className="text-sm text-paper/80">
        Chi Không Vong: <strong className="text-paper">{voids[0]}</strong> ·{" "}
        <strong className="text-paper">{voids[1]}</strong>
      </div>
    </div>
  );
}

function DerivedInfoCard({ detail }: { detail: DerivedPillarDetail }) {
  return (
    <div className="border border-white/10 rounded-lg p-3 bg-[#0d0b14]">
      <div className="text-xs uppercase text-muted tracking-wide border-b border-white/5 pb-1 mb-2">
        {detail.name}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xl font-han font-bold ${getElementColor(detail.pillar.stem)}`}>
          {detail.pillar.stem}
        </span>
        <span className={`text-xl font-han font-bold ${getElementColor(detail.pillar.branch)}`}>
          {detail.pillar.branch}
        </span>
      </div>
      <div className="text-sm text-paper/80 mb-2">Nạp Âm: {detail.nayin}</div>
      {detail.stars.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {detail.stars.map((s, i) => (
            <StarPill key={i} star={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// Trước khi bước vào Đại Vận đầu tiên, chưa có ô nào "đang chạy" - đây là kết quả
// đúng theo tuổi khởi vận, không phải lỗi cần mặc định về ô đầu tiên.
function isLuckPillarActive(pillars: LuckPillar[], index: number, now: Date): boolean {
  const current = pillars[index];
  if (!current || now < current.startDate) return false;
  const next = pillars[index + 1];
  if (next && now >= next.startDate) return false;
  return true;
}

export function BaziChart({ chart }: { chart: BaziFullChart }) {
  const now = new Date();
  const [showLuck, setShowLuck] = useState(true);
  const [showYongShenCalc, setShowYongShenCalc] = useState(false);

  const strength = useMemo(() => calculateElementStrength(chart), [chart]);
  const yongShen = useMemo(() => determineYongShen(strength, chart.month.branch), [strength, chart.month.branch]);
  
  const dragScroll = useDragScroll();

  // Bát Tự đọc từ phải sang trái
  const pillars: { title: string; detail: BaziPillarDetail; isDayPillar: boolean; key: "year" | "month" | "day" | "hour" }[] = [
    { title: "Trụ Năm", detail: chart.details.year, isDayPillar: false, key: "year" },
    { title: "Trụ Tháng", detail: chart.details.month, isDayPillar: false, key: "month" },
    { title: "Trụ Ngày", detail: chart.details.day, isDayPillar: true, key: "day" },
    { title: "Trụ Giờ", detail: chart.details.hour, isDayPillar: false, key: "hour" },
  ];

  return (
    <div className="space-y-8">
      {/* Tứ Trụ, Đặt dưới Khối Dụng Thần như yêu cầu hoặc trên? Thường để Tứ Trụ ở trên cho dễ nhìn */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Tứ Trụ (Bát Tự)</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4 pb-4">
          {pillars.map((p) => (
            <div key={p.title} className="min-w-0">
              <PillarColumn title={p.title} detail={p.detail} isDayPillar={p.isDayPillar} pillarKey={p.key} voids={chart.voids} />
            </div>
          ))}
        </div>
      </section>

      {/* Dụng Thần & Radar */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Phân Tích Ngũ Hành & Dụng Thần</h2>
        <div className="border border-white/10 rounded-lg p-5 lg:p-6 bg-ink flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          <div className="flex-1 space-y-5 w-full">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs uppercase tracking-wide font-medium
                ${yongShen.dayMasterVerdict === "vượng" ? "bg-cinnabar/20 text-cinnabar" : 
                  yongShen.dayMasterVerdict === "nhược" ? "bg-water/20 text-water" : "bg-gold/20 text-gold"}`}
              >
                Nhật Chủ: {yongShen.dayMasterVerdict}
              </span>
              <span className="text-sm text-muted">
                {yongShen.dayMasterVerdict === "trung hòa"
                  ? `Nhật Chủ trung hòa — tham chiếu Pháp Điều Hậu: thiên về ${yongShen.dungThan.join(", ")}`
                  : `Theo ${yongShen.methodLabel}`}
              </span>
            </div>

            <div className="text-paper leading-relaxed">
              Dụng Thần thiên về <strong className="text-gold">{yongShen.dungThan.join(", ") || "Không rõ"}</strong> · 
              Hỷ Thần: <strong className="text-jade">{yongShen.hyThan.join(", ") || "-"}</strong> · 
              Kỵ Thần: <strong className="text-cinnabar">{yongShen.kyThan.join(", ") || "-"}</strong>
            </div>

            {yongShen.confidence === "cần cân nhắc" && (
              <div className="text-sm text-gold/80 bg-gold/10 p-2 rounded border border-gold/20">
                ⚠ Cục diện gần trung hòa, dụng thần chưa rõ ràng — nên tham chiếu thêm.
              </div>
            )}

            <div className="mt-4 border-t border-white/10 pt-4">
              <button 
                onClick={() => setShowYongShenCalc(!showYongShenCalc)}
                className="text-xs text-muted hover:text-paper flex items-center gap-1"
              >
                {showYongShenCalc ? "▼ Thu gọn cách tính" : "▶ Xem cách tính (Minh Bạch)"}
              </button>
              
              {showYongShenCalc && (
                <div className="mt-3 space-y-4 bg-black/20 p-3 rounded text-sm text-muted">
                  <div>
                    <strong className="text-paper block mb-1">Cách tính điểm Ngũ Hành:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      {strength.breakdown.map((item, idx) => (
                        <li key={idx}>
                          <span className={`${getElementColor(item.element)} font-medium`}>{item.element}</span> từ {item.source}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-paper block mb-1">Lý luận tìm Dụng Thần:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      {yongShen.reasoning.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:w-auto flex justify-center py-4 lg:py-0">
            <div className="max-w-full overflow-visible">
              <ElementRadar strength={strength} size={280} />
            </div>
          </div>
        </div>
      </section>

      {/* Thông Tin Bổ Sung */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Thông Tin Bổ Sung</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <VoidCard voids={chart.voids} />
          <DerivedInfoCard detail={chart.derived.conception} />
          <DerivedInfoCard detail={chart.derived.lifePalace} />
        </div>
      </section>

      {/* Đại Vận */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-display text-paper m-0">Đại Vận (10 Năm)</h2>
          <button 
            onClick={() => setShowLuck(!showLuck)}
            className="text-xs text-gold/80 hover:text-gold border border-gold/20 hover:border-gold/50 rounded px-2 py-1 transition-colors bg-gold/5"
          >
            {showLuck ? "Thu gọn" : "Hiển thị"}
          </button>
        </div>
        
        {showLuck && (
          <div 
            className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 px-1 pt-2 pb-4 overflow-x-auto custom-scrollbar ${dragScroll.className}`}
            onPointerDown={dragScroll.onPointerDown}
            onPointerMove={dragScroll.onPointerMove}
            onPointerUp={dragScroll.onPointerUp}
            onPointerCancel={dragScroll.onPointerCancel}
            onWheel={dragScroll.onWheel}
          >
            {chart.luck.pillars.map((lp, i) => {
              const active = isLuckPillarActive(chart.luck.pillars, i, now);
              return (
                <div
                  key={i}
                  data-testid="luck-pillar-tile"
                  onClickCapture={dragScroll.onClickCapture}
                  className={`flex flex-col border rounded-lg overflow-hidden text-center transition-all ${
                    active ? "border-gold/80 ring-2 ring-gold/40 bg-gold/10 scale-105 z-10 shadow-lg" : "border-white/10 bg-black/30 hover:bg-black/10"
                  }`}
                >
                  <div className={`py-1.5 px-1 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap ${
                    active ? "bg-gold/20 text-gold" : "bg-white/5 text-muted border-b border-white/10"
                  }`}>
                    Tuổi {lp.startAgeYear} {lp.startAgeMonth ? `${lp.startAgeMonth} tháng` : ""}
                  </div>
                  <div className="py-3 px-1 flex flex-col gap-1">
                    <div className="text-[10px] text-muted/60 uppercase tracking-widest">{lp.tenGod}</div>
                    <div className={`text-2xl font-han font-bold leading-none ${getElementColor(lp.pillar.stem)}`}>
                      {lp.pillar.stem}
                    </div>
                    <div className={`text-2xl font-han font-bold leading-none mt-1 ${getElementColor(lp.pillar.branch)}`}>
                      {lp.pillar.branch}
                    </div>
                    <div className="text-[10px] text-muted/60 uppercase tracking-widest mt-1">{lp.lifeStage}</div>
                  </div>
                  <div className={`py-1.5 text-[11px] font-mono ${
                    active ? "bg-gold/10 text-gold font-bold" : "bg-white/5 text-muted/60 border-t border-white/10"
                  }`}>
                    {lp.startDate.getFullYear()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Lưu Niên */}
      {chart.luck.annualYears && chart.luck.annualYears.length > 0 && (
        <AnnualYearsTable annualYears={chart.luck.annualYears} getElementColor={getElementColor} />
      )}
    </div>
  );
}
