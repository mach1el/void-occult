import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toBlob } from "html-to-image";
import chartCss from "../../../pages/purple-star/tu-vi-nam-phai.css?raw";
import compactChartCss from "./compact-chart.css?raw";
import mobileChartCss from "./mobile-chart.css?raw";
import {
  buildChartText,
  getEngine,
  serializeChart,
} from "../../lib/chart";
import type { ChartData, School } from "../../types/chart";
import { AiChat } from "./AiChat";
import { CompactChart } from "./CompactChart";
import { MobileChart } from "./MobileChart";

const HOUR_BRANCHES = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;
const BRANCH_HAN: Record<(typeof HOUR_BRANCHES)[number], string> = {
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
const HOUR_RANGES = [
  "23-01",
  "01-03",
  "03-05",
  "05-07",
  "07-09",
  "09-11",
  "11-13",
  "13-15",
  "15-17",
  "17-19",
  "19-21",
  "21-23",
];

interface FormState {
  solarDate: string;
  birthHour: string;
  gender: "male" | "female";
  annualYear: string;
  timezone: string;
  showMutagens: boolean;
  showPhi: boolean;
  showAnnual: boolean;
}

type Notice = "idle" | "working" | "success" | "error";
type MobileChartMode = "compact" | "reading";

function initialSchool(): School {
  const saved = localStorage.getItem("tuvi.school");
  return saved === "trung-chau" ? saved : "nam-phai";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ChartPage() {
  const [school, setSchool] = useState<School>(initialSchool);
  const [form, setForm] = useState<FormState>({
    solarDate: "21/09/1991",
    birthHour: "Dậu",
    gender: "female",
    annualYear: String(new Date().getFullYear()),
    timezone: "7",
    showMutagens: true,
    showPhi: false,
    showAnnual: true,
  });
  const [enginesReady, setEnginesReady] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [mobileMode, setMobileMode] = useState<MobileChartMode>("compact");
  const [copyState, setCopyState] = useState<Notice>("idle");
  const [imageState, setImageState] = useState<Notice>("idle");
  const compactChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Lá Số Tử Vi · Void Occult";
    let active = true;
    Promise.all([
      // @ts-expect-error Legacy IIFE is intentionally imported for side effects.
      import("../../../pages/purple-star/tu-vi-engine-nam-phai.js"),
      // @ts-expect-error Legacy IIFE is intentionally imported for side effects.
      import("../../../pages/purple-star/tu-vi-engine-trung-chau.js"),
    ])
      .then(() => {
        if (active) setEnginesReady(true);
      })
      .catch((error: unknown) => {
        console.error("Không thể nạp engine Tử Vi", error);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!enginesReady) return;
    const engine = getEngine(school);
    engine?.render();
    setChartData(engine?.getData() ?? null);
  }, [enginesReady, form, school]);

  const context = useCallback(() => {
    const data = getEngine(school)?.getData() ?? null;
    return {
      chartText: buildChartText(data, school, form.gender),
      chart: serializeChart(data, school),
    };
  }, [form.gender, school]);

  const fileStamp = useMemo(
    () => form.solarDate.replace(/\D/g, "") || "laso",
    [form.solarDate],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeSchool(next: School) {
    localStorage.setItem("tuvi.school", next);
    setSchool(next);
  }

  async function copyChart() {
    const text = context().chartText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 1_500);
  }

  function downloadText() {
    const text = context().chartText;
    if (!text) return;
    downloadBlob(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
      `la-so-tu-vi-${school}-${fileStamp}.txt`,
    );
  }

  async function downloadImage() {
    const chart = compactChartRef.current;
    if (!chart?.children.length) return;
    setImageState("working");
    try {
      const blob = await toBlob(chart, {
        backgroundColor: "#f3f3e9",
        pixelRatio: 2,
      });
      if (!blob) throw new Error("Không tạo được dữ liệu ảnh");
      downloadBlob(blob, `la-so-tu-vi-${school}-${fileStamp}.png`);
      setImageState("success");
    } catch (error) {
      console.error("Export ảnh lỗi", error);
      setImageState("error");
    }
    window.setTimeout(() => setImageState("idle"), 1_800);
  }

  function fieldChange(
    key: keyof Pick<
      FormState,
      "solarDate" | "birthHour" | "gender" | "annualYear" | "timezone"
    >,
  ) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      update(key, event.target.value as never);
  }

  const copyLabel =
    copyState === "success"
      ? "✓"
      : copyState === "error"
        ? "⚠"
        : "⧉ Copy";
  const imageLabel =
    imageState === "working"
      ? "…"
      : imageState === "success"
        ? "✓"
        : imageState === "error"
          ? "⚠"
          : "⛶ Ảnh";

  return (
    <>
      <style>{`${chartCss}
        ${compactChartCss}
        ${mobileChartCss}
        .ai-backend-badge { display:block; margin-top:3px; color:var(--paper-dim); font-size:.7rem; font-weight:500; }
        .ai-plain-text { white-space:pre-wrap; line-height:1.65; }
        .engine-loading { min-height:420px; display:grid; place-items:center; color:var(--paper-dim); }
      `}</style>
      <div className="galaxy-fx" aria-hidden="true" />
      <div className="wrap">
        <nav className="topbar">
          <a href="/">← Void Occult</a>
        </nav>

        <header>
          <div>
            <div className="eyebrow">Tử Vi Đẩu Số</div>
            <h1>
              Lá Số <em>Tử Vi</em>
            </h1>
          </div>
          <div className="seal han">紫微</div>
        </header>

        <main className="shell">
          <aside className="panel">
            <div className="panel-head">
              <h2>Dữ liệu sinh</h2>
            </div>
            <div className="panel-body">
              <div
                className="school-tabs"
                role="radiogroup"
                aria-label="Trường phái"
              >
                {(
                  [
                    ["nam-phai", "Nam phái"],
                    ["trung-chau", "Trung Châu phái"],
                  ] as const
                ).map(([value, label]) => (
                  <label className="school-tab" key={value}>
                    <input
                      type="radio"
                      name="school"
                      value={value}
                      checked={school === value}
                      onChange={() => changeSchool(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
                <div className="field">
                  <label htmlFor="solarDate">Ngày DL</label>
                  <input
                    id="solarDate"
                    name="solarDate"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Ngày/Tháng/Năm"
                    value={form.solarDate}
                    onChange={fieldChange("solarDate")}
                  />
                </div>
                <div className="field">
                  <label htmlFor="birthHour">Giờ sinh</label>
                  <select
                    id="birthHour"
                    name="birthHour"
                    value={form.birthHour}
                    onChange={fieldChange("birthHour")}
                  >
                    {HOUR_BRANCHES.map((branch, index) => (
                      <option value={branch} key={branch}>
                        {branch} {BRANCH_HAN[branch]} · {HOUR_RANGES[index]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="gender">Giới tính</label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={fieldChange("gender")}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="annualYear">Lưu niên</label>
                  <input
                    id="annualYear"
                    name="annualYear"
                    type="number"
                    min="1900"
                    max="2100"
                    value={form.annualYear}
                    onChange={fieldChange("annualYear")}
                  />
                </div>
                <div className="field">
                  <label htmlFor="timezone">Múi giờ</label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={form.timezone}
                    onChange={fieldChange("timezone")}
                  >
                    <option value="7">Việt Nam +7</option>
                    <option value="8">Trung Quốc +8</option>
                    <option value="0">Giờ gốc +0</option>
                  </select>
                </div>
              </form>

              <div className="toggles">
                <label className="toggle">
                  <input
                    id="showMutagens"
                    type="checkbox"
                    checked={form.showMutagens}
                    onChange={(event) =>
                      update("showMutagens", event.target.checked)
                    }
                  />{" "}
                  Tứ Hóa
                </label>
                <label className="toggle">
                  <input
                    id="showPhi"
                    type="checkbox"
                    checked={form.showPhi}
                    onChange={(event) => update("showPhi", event.target.checked)}
                  />{" "}
                  Phi Hóa
                </label>
                <label className="toggle">
                  <input
                    id="showAnnual"
                    type="checkbox"
                    checked={form.showAnnual}
                    onChange={(event) =>
                      update("showAnnual", event.target.checked)
                    }
                  />{" "}
                  Sao lưu
                </label>
              </div>
            </div>
          </aside>

          <section className="chart-section">
            <div className="chart-panel chart-workspace">
              <div className="panel-head">
                <h2>Lá số 12 cung</h2>
                <div className="chart-actions" style={{ flexWrap: 'nowrap' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={copyChart}
                    disabled={!enginesReady}
                    title="Sao chép văn bản"
                    aria-label="Sao chép văn bản"
                  >
                    {copyLabel}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={downloadText}
                    disabled={!enginesReady}
                    title="Tải file .txt"
                    aria-label="Tải file .txt"
                  >
                    ⭳ TXT
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={downloadImage}
                    disabled={!enginesReady || imageState === "working"}
                    title="Tải ảnh PNG"
                    aria-label="Tải ảnh PNG"
                  >
                    {imageLabel}
                  </button>
                </div>
              </div>
              <div
                className="mobile-chart-switch"
                role="group"
                aria-label="Kiểu hiển thị lá số trên mobile"
              >
                <button
                  type="button"
                  className={mobileMode === "compact" ? "is-active" : ""}
                  aria-pressed={mobileMode === "compact"}
                  onClick={() => setMobileMode("compact")}
                >
                  ◫ Lá số
                </button>
                <button
                  type="button"
                  className={mobileMode === "reading" ? "is-active" : ""}
                  aria-pressed={mobileMode === "reading"}
                  onClick={() => setMobileMode("reading")}
                >
                  ☰ Dạng đọc
                </button>
              </div>
              <div
                className={`compact-chart-stage${mobileMode === "reading" ? " is-reading" : ""}`}
              >
                <CompactChart
                  data={chartData}
                  school={school}
                  gender={form.gender}
                  showAnnual={form.showAnnual}
                  showMutagens={form.showMutagens}
                  showPhi={form.showPhi}
                  captureRef={compactChartRef}
                />
              </div>
              <div hidden={mobileMode !== "reading"}>
                <MobileChart
                  data={chartData}
                  school={school}
                  showAnnual={form.showAnnual}
                  showMutagens={form.showMutagens}
                  showPhi={form.showPhi}
                />
              </div>
              <div className="legacy-chart-host" aria-hidden="true">
                <div id="chartGrid" className="chart-grid" />
              </div>
            </div>
          </section>

          <AiChat getContext={context} />
        </main>

        <footer>
          <div className="han">斗數</div>
          Void Occult · Tử Vi Đẩu Số
        </footer>
      </div>
    </>
  );
}
