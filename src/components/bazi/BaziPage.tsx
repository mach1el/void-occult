import { useEffect, useMemo, useState } from "react";
import { generateBaziChart } from "@/lib/bazi/bazi-engine";
import { buildBaziText } from "@/lib/bazi/bazi-text";
import {
  DEFAULT_MANUAL_LONGITUDE,
  DEFAULT_PROVINCE_CODE,
  MANUAL_PROVINCE_CODE,
  MANUAL_PROVINCE_LABEL,
  PROVINCES,
  getProvinceByCode,
  resolveLongitude,
} from "@/lib/bazi/provinces";
import { BaziChart as BaziChartComponent } from "./BaziChart";

const BAZI_FORM_STORAGE_KEY = "bazi.form";

interface StoredBaziForm {
  dateInput: string;
  timeInput: string;
  gender: "M" | "F";
  provinceCode: string;
  manualLongitude: number;
  timezone: number;
}

function loadStoredBaziForm(): Partial<StoredBaziForm> {
  try {
    const raw = localStorage.getItem(BAZI_FORM_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function BaziPage() {
  const stored = loadStoredBaziForm();

  const [dateInput, setDateInput] = useState(() => stored.dateInput ?? "01/01/1990");
  const [timeInput, setTimeInput] = useState(() => stored.timeInput ?? "12:00");
  const [gender, setGender] = useState<"M" | "F">(() => stored.gender ?? "M");
  const [provinceCode, setProvinceCode] = useState(() => {
    const code = stored.provinceCode;
    if (code === MANUAL_PROVINCE_CODE || (code && getProvinceByCode(code))) return code;
    return DEFAULT_PROVINCE_CODE;
  });
  const [manualLongitude, setManualLongitude] = useState(
    () => stored.manualLongitude ?? DEFAULT_MANUAL_LONGITUDE
  );
  const [timezone, setTimezone] = useState(() => stored.timezone ?? 7);
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");

  const longitude = resolveLongitude(provinceCode, manualLongitude);

  useEffect(() => {
    const payload: StoredBaziForm = {
      dateInput,
      timeInput,
      gender,
      provinceCode,
      manualLongitude,
      timezone,
    };
    try {
      localStorage.setItem(BAZI_FORM_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // bỏ qua lỗi quota/private-mode
    }
  }, [dateInput, timeInput, gender, provinceCode, manualLongitude, timezone]);

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

  async function copyChart() {
    if (!chart) return;
    const text = buildBaziText(chart);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 1500);
  }

  const copyLabel =
    copyState === "success"
      ? "✓ Đã chép"
      : copyState === "error"
        ? "⚠ Lỗi"
        : "⧉ Copy Lá Số";

  return (
    <div className="min-h-screen bg-void text-paper font-sans p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-display text-gold">Lá Số Bát Tự</h1>
            <p className="text-sm text-muted">Hệ thống an lá số Tứ Trụ (Bát Tự) dựa trên thuật toán thiên văn chính xác.</p>
          </div>
          {chart && (
            <button
              onClick={copyChart}
              className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded px-3 py-1.5 transition-colors whitespace-nowrap text-paper"
            >
              {copyLabel}
            </button>
          )}
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
            <label className="text-xs text-muted uppercase tracking-wider">Nơi Sinh (Tỉnh/Thành)</label>
            <select
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              className="bg-void border border-white/10 rounded px-3 py-2 text-sm focus:border-gold outline-none"
            >
              {PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
              <option value={MANUAL_PROVINCE_CODE}>{MANUAL_PROVINCE_LABEL}</option>
            </select>
            {provinceCode === MANUAL_PROVINCE_CODE && (
              <input
                type="number"
                step="0.1"
                value={manualLongitude}
                onChange={(e) => setManualLongitude(parseFloat(e.target.value))}
                placeholder="Kinh độ (độ)"
                className="mt-1 bg-void border border-white/10 rounded px-3 py-2 text-sm focus:border-gold outline-none"
              />
            )}
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
