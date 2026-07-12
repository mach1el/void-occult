import { useState, useMemo } from "react";
import { generateBaziChart, BaziFullChart, BaziPillarDetail } from "../../lib/bazi/bazi-engine";
import { BaziChart as BaziChartComponent } from "./BaziChart";

export function BaziPage() {
  const [dateInput, setDateInput] = useState("01/01/1990");
  const [timeInput, setTimeInput] = useState("12:00");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [longitude, setLongitude] = useState(105.8);
  const [timezone, setTimezone] = useState(7);

  const chart = useMemo(() => {
    try {
      const dParts = dateInput.split(/[-/]/);
      if (dParts.length < 3) return null;
      const tParts = timeInput.split(":");
      if (tParts.length < 2) return null;

      const yearStr = dParts[2]!.length === 4 ? dParts[2]! : dParts[0]!;
      const monthStr = dParts[1]!;
      const dayStr = dParts[2]!.length === 4 ? dParts[0]! : dParts[2]!;
      
      const hourStr = tParts[0]!;
      const minStr = tParts[1]!;

      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const day = parseInt(dayStr, 10);
      
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minStr, 10);

      const d = new Date(year, month, day, hour, minute);
      if (isNaN(d.getTime())) return null;
      // Convert timezone hours to minutes
      return generateBaziChart(d, longitude, timezone * 60, gender);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [dateInput, timeInput, gender, longitude, timezone]);

  return (
    <div className="min-h-screen bg-void text-paper font-sans p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-display text-gold">Lá Số Bát Tự</h1>
          <p className="text-sm text-muted">Hệ thống an lá số Tứ Trụ (Bát Tự) dựa trên thuật toán thiên văn chính xác.</p>
        </header>

        <section className="bg-ink rounded-lg p-4 lg:p-6 border border-white/5 grid gap-4 lg:grid-cols-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 lg:col-span-2">
            <label className="text-xs text-muted uppercase tracking-wider">Ngày Giờ Sinh (Dương Lịch)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ngày/Tháng/Năm"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-void border border-white/10 rounded px-3 py-2 text-sm focus:border-gold outline-none flex-1 min-w-0"
              />
              <input 
                type="text" 
                placeholder="HH:MM"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="bg-void border border-white/10 rounded px-3 py-2 text-sm focus:border-gold outline-none w-24 flex-shrink-0 text-center"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted uppercase tracking-wider">Giới Tính</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value as "M" | "F")}
              className="bg-void border border-white/10 rounded px-3 py-2 text-sm focus:border-gold outline-none"
            >
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted uppercase tracking-wider">Kinh Độ</label>
            <input 
              type="number" 
              step="0.1"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              className="bg-void border border-white/10 rounded px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted uppercase tracking-wider">Múi Giờ (UTC+)</label>
            <input 
              type="number" 
              value={timezone}
              onChange={(e) => setTimezone(parseInt(e.target.value))}
              className="bg-void border border-white/10 rounded px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
        </section>

        {chart ? (
          <BaziChartComponent chart={chart} />
        ) : (
          <div className="text-center py-12 text-muted">Vui lòng nhập ngày giờ sinh hợp lệ.</div>
        )}
      </div>
    </div>
  );
}
