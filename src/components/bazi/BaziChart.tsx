import { useState, useMemo } from "react";
import { BaziFullChart, BaziPillarDetail, DerivedPillarDetail } from "@/lib/bazi/bazi-engine";
import { LuckPillar } from "@/lib/bazi/luck-pillars";
import { SymbolicStar } from "@/lib/bazi/symbolic-stars";
import { calculateElementStrength } from "@/lib/bazi/element-strength";
import { determineYongShen } from "@/lib/bazi/yong-shen";
import { ElementRadar } from "./ElementRadar";

function getElementColor(char: string) {
  const wood = ["Giáp", "Ất", "Dần", "Mão"];
  const fire = ["Bính", "Đinh", "Tị", "Ngọ"];
  const earth = ["Mậu", "Kỷ", "Thìn", "Tuất", "Sửu", "Mùi"];
  const metal = ["Canh", "Tân", "Thân", "Dậu"];
  const water = ["Nhâm", "Quý", "Hợi", "Tý"];

  if (wood.includes(char)) return "text-jade";
  if (fire.includes(char)) return "text-cinnabar";
  if (earth.includes(char)) return "text-earth";
  if (metal.includes(char)) return "text-gold";
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
}: {
  title: string;
  detail: BaziPillarDetail;
  isDayPillar: boolean;
  pillarKey: "year" | "month" | "day" | "hour";
}) {
  return (
    <div
      data-testid={`pillar-column-${pillarKey}`}
      className="flex flex-col border border-white/10 rounded-lg overflow-hidden bg-[#0d0b14]"
    >
      <div className="bg-white/5 py-2 text-center text-sm font-semibold tracking-wide border-b border-white/10 text-muted uppercase">
        {title}
      </div>

      {/* Can Chi */}
      <div className="flex flex-col items-center py-6 gap-2">
        <div className="flex flex-col items-center">
          <div
            className={
              isDayPillar
                ? "text-sm font-bold text-gold tracking-wide mb-1"
                : "text-xs text-muted/70 mb-1"
            }
          >
            {detail.tenGod}
          </div>
          <div className={`text-4xl font-han font-bold ${getElementColor(detail.pillar.stem)}`}>
            {detail.pillar.stem}
          </div>
        </div>
        <div className="flex flex-col items-center mt-2">
          <div className={`text-4xl font-han font-bold ${getElementColor(detail.pillar.branch)}`}>
            {detail.pillar.branch}
          </div>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Tàng Can & Thập Thần, xếp theo trọng số Bản khí > Trung khí > Dư khí */}
      <div className="p-3 text-center flex flex-col gap-2 bg-white/[0.02]">
        <div className="text-xs uppercase text-muted tracking-wide border-b border-white/5 pb-1">Tàng Can</div>
        {detail.hiddenStems.map((hidden, i) => {
          const style = HIDDEN_STEM_STYLE[hidden.type] ?? FALLBACK_HIDDEN_STEM_STYLE;
          return (
            <div key={i} className="flex justify-between items-center px-2">
              <span className="flex flex-col items-start">
                <span className={`${getElementColor(hidden.stem)} ${style.stem}`}>{hidden.stem}</span>
                <span className={style.role}>{hidden.type}</span>
              </span>
              <span className={style.tenGod}>{hidden.tenGod}</span>
            </div>
          );
        })}
      </div>

      <div className="h-px bg-white/10" />

      {/* Trường Sinh */}
      <div className="px-3 py-2 flex justify-between items-center text-sm bg-white/[0.02] border-b border-white/5">
        <span className="text-muted/60">Trường Sinh</span>
        <span className="text-right text-paper/80" data-testid="life-stage">
          {detail.lifeStage}
        </span>
      </div>

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
  const yongShen = useMemo(() => determineYongShen(strength), [strength]);

  // Bát Tự đọc từ phải sang trái
  const pillars: { title: string; detail: BaziPillarDetail; isDayPillar: boolean; key: "year" | "month" | "day" | "hour" }[] = [
    { title: "Trụ Giờ", detail: chart.details.hour, isDayPillar: false, key: "hour" },
    { title: "Trụ Ngày", detail: chart.details.day, isDayPillar: true, key: "day" },
    { title: "Trụ Tháng", detail: chart.details.month, isDayPillar: false, key: "month" },
    { title: "Trụ Năm", detail: chart.details.year, isDayPillar: false, key: "year" },
  ];

  return (
    <div className="space-y-8">
      {/* Tứ Trụ, Đặt dưới Khối Dụng Thần như yêu cầu hoặc trên? Thường để Tứ Trụ ở trên cho dễ nhìn */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Tứ Trụ (Bát Tự)</h2>
        <div className="flex flex-col-reverse md:flex-row gap-4">
          {pillars.map((p) => (
            <div key={p.title} className="flex-1">
              <PillarColumn title={p.title} detail={p.detail} isDayPillar={p.isDayPillar} pillarKey={p.key} />
            </div>
          ))}
        </div>
      </section>

      {/* Dụng Thần & Radar */}
      <section>
        <h2 className="text-xl font-display text-paper mb-4">Phân Tích Ngũ Hành & Dụng Thần</h2>
        <div className="border border-white/10 rounded-lg p-4 bg-ink flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs uppercase tracking-wide font-medium
                ${yongShen.dayMasterVerdict === "vượng" ? "bg-cinnabar/20 text-cinnabar" : 
                  yongShen.dayMasterVerdict === "nhược" ? "bg-water/20 text-water" : "bg-gold/20 text-gold"}`}
              >
                Nhật Chủ: {yongShen.dayMasterVerdict}
              </span>
              <span className="text-sm text-muted">
                Theo {yongShen.methodLabel}
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
          <div className="w-full md:w-auto flex justify-center py-2 md:py-0 md:px-4">
            <ElementRadar strength={strength} />
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
          <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 custom-scrollbar">
            {chart.luck.pillars.map((lp, i) => {
              const active = isLuckPillarActive(chart.luck.pillars, i, now);
              return (
                <div
                  key={i}
                  data-testid="luck-pillar-tile"
                  className={`min-w-[90px] flex-shrink-0 flex flex-col border rounded overflow-hidden text-center ${
                    active ? "border-gold ring-1 ring-gold/40 bg-gold/5" : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="bg-white/5 py-1 px-1 text-[10px] text-muted border-b border-white/10 whitespace-nowrap">
                    Tuổi {lp.startAgeYear} {lp.startAgeMonth ? `${lp.startAgeMonth}th` : ""}
                  </div>
                  <div className="py-2 px-1 flex flex-col gap-0.5">
                    <div className="text-[10px] text-muted/70">{lp.tenGod}</div>
                    <div className={`text-lg font-han font-medium ${getElementColor(lp.pillar.stem)}`}>
                      {lp.pillar.stem}
                    </div>
                    <div className={`text-lg font-han font-medium ${getElementColor(lp.pillar.branch)}`}>
                      {lp.pillar.branch}
                    </div>
                    <div className="text-[10px] text-muted/70">{lp.lifeStage}</div>
                  </div>
                  <div className="bg-white/5 py-1 text-[10px] text-muted/60 border-t border-white/10">
                    {lp.startDate.getFullYear()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dụng Thần (Placeholder) */}

    </div>
  );
}
