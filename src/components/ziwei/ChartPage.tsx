import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toBlob } from "html-to-image";
import chartCss from "@/styles/tu-vi.css?raw";
import compactChartCss from "./chart/compact-chart.css?raw";
import mobileChartCss from "./chart/mobile-chart.css?raw";
import {
  buildChartText,
  getEngine,
  serializeChart,
} from "@/lib/ziwei/chart";
import type {
  BirthInput,
  ChartData,
  School,
  UserContext,
} from "@/types/chart";
import { AiChat } from "./ai-chat/AiChat";
import { CompactChart } from "./chart/CompactChart";
import { MobileChart } from "./chart/MobileChart";
import { ZiweiAnalysisRebuilding } from "./analysis/ZiweiAnalysisRebuilding";
import { PalaceOverviewRadar } from "./analysis/PalaceOverviewRadar";
import { getAnalysisStatus } from "@/lib/ziwei/analysis";

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
  name: string;
  solarDate: string;
  birthHour: string;
  gender: "male" | "female";
  occupationStatus: string;
  relationshipStatus: string;
  annualYear: string;
  timezone: string;
  flowBase: string;
  showMutagens: boolean;
  showPhi: boolean;
  showAnnual: boolean;
}

type Notice = "idle" | "working" | "success" | "error";
type MobileChartMode = "compact" | "reading";
type FieldIconName =
  | "user"
  | "calendar"
  | "clock"
  | "gender"
  | "work"
  | "relationship";

function FieldIcon({ name }: { name: FieldIconName }) {
  const paths: Record<FieldIconName, ReactNode> = {
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M8 3v4M16 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l-2.5 2.5" />
      </>
    ),
    gender: (
      <>
        <circle cx="8.5" cy="9" r="4" />
        <circle cx="15.5" cy="15" r="4" />
        <path d="M11.5 6h5V1M15.5 2l4 4M8.5 13v8M5.5 18h6" />
      </>
    ),
    work: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="3" />
        <path d="M9 7V4.5h6V7M3 12h18M10 12v2h4v-2" />
      </>
    ),
    relationship: (
      <>
        <path d="M12 20S4 15.6 4 9.5C4 6.7 5.8 5 8.2 5c1.7 0 3 1 3.8 2.2C12.8 6 14.1 5 15.8 5 18.2 5 20 6.7 20 9.5 20 15.6 12 20 12 20Z" />
      </>
    ),
  };

  return (
    <span className="field-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        {paths[name]}
      </svg>
    </span>
  );
}

function initialSchool(): School {
  try {
    const saved = window.localStorage?.getItem("tuvi.school");
    return saved === "trung-chau" ? saved : "nam-phai";
  } catch {
    return "nam-phai";
  }
}

function buildBirthInput(form: FormState): BirthInput {
  return {
    solarDate: form.solarDate,
    birthHour: form.birthHour,
    gender: form.gender,
    timezone: form.timezone,
    annualYear: form.annualYear,
    flowBase: form.flowBase,
  };
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
    name: "",
    solarDate: "21/09/1991",
    birthHour: "Dậu",
    gender: "female",
    occupationStatus: "",
    relationshipStatus: "",
    annualYear: String(new Date().getFullYear()),
    timezone: "7",
    flowBase: "luu-nien",
    showMutagens: true,
    showPhi: false,
    showAnnual: true,
  });
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [mobileMode, setMobileMode] = useState<MobileChartMode>("compact");
  const [copyState, setCopyState] = useState<Notice>("idle");
  const [imageState, setImageState] = useState<Notice>("idle");
  const compactChartRef = useRef<HTMLDivElement>(null);
  const birthInput = useMemo(
    () => buildBirthInput(form),
    [
      form.annualYear,
      form.birthHour,
      form.flowBase,
      form.gender,
      form.solarDate,
      form.timezone,
    ],
  );

  useEffect(() => {
    document.title = "Lá Số Tử Vi · Void Occult";
  }, []);

  useEffect(() => {
    const engine = getEngine(school);
    setChartData(engine?.calculate(birthInput) ?? null);
  }, [birthInput, school]);

  const context = useCallback(() => {
    const data = getEngine(school)?.getData() ?? null;
    const profile: UserContext = {
      name: form.name.trim(),
      occupationStatus: form.occupationStatus,
      relationshipStatus: form.relationshipStatus,
    };
    return {
      chartText: buildChartText(data, school, form.gender),
      chart: serializeChart(data, school),
      profile,
    };
  }, [
    form.gender,
    form.name,
    form.occupationStatus,
    form.relationshipStatus,
    school,
  ]);

  const fileStamp = useMemo(
    () => form.solarDate.replace(/\D/g, "") || "laso",
    [form.solarDate],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeSchool(next: School) {
    try {
      window.localStorage?.setItem("tuvi.school", next);
    } catch {
      // Trình duyệt có thể chặn storage; lựa chọn vẫn hoạt động trong phiên.
    }
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
        backgroundColor: "#090714",
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
      | "name"
      | "solarDate"
      | "birthHour"
      | "gender"
      | "occupationStatus"
      | "relationshipStatus"
      | "annualYear"
      | "timezone"
      | "flowBase"
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
          <aside className="panel birth-panel">
            <div className="birth-panel-body">
              <div className="birth-intro">
                <span className="birth-kicker">Tử Vi Đẩu Số</span>
                <h1>Lập lá số Tử Vi</h1>
              </div>

              <form
                className="profile-form"
                onSubmit={(event) => event.preventDefault()}
              >
                <div className="profile-row profile-row-primary">
                  <label className="profile-field profile-name">
                    <FieldIcon name="user" />
                    <span className="sr-only">Họ và tên</span>
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      maxLength={80}
                      placeholder="Họ và tên"
                      value={form.name}
                      onChange={fieldChange("name")}
                    />
                  </label>

                  <label className="profile-field profile-date">
                    <FieldIcon name="calendar" />
                    <span className="sr-only">Ngày sinh dương lịch</span>
                    <input
                      name="solarDate"
                      type="text"
                      inputMode="numeric"
                      autoComplete="bday"
                      placeholder="Ngày/Tháng/Năm"
                      value={form.solarDate}
                      onChange={fieldChange("solarDate")}
                    />
                  </label>

                  <div
                    className="school-tabs profile-school"
                    role="radiogroup"
                    aria-label="Trường phái"
                  >
                    {(
                      [
                        ["nam-phai", "Nam phái"],
                        ["trung-chau", "Trung Châu"],
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

                  <label className="profile-field profile-field-plain profile-field-compact profile-flow">
                    <span className="sr-only">Cách xem vận</span>
                    <select
                      name="flowBase"
                      aria-label="Cách xem vận"
                      value={form.flowBase}
                      onChange={fieldChange("flowBase")}
                    >
                      <option value="luu-nien">Lưu Niên</option>
                      <option value="tieu-han">Tiểu Hạn</option>
                    </select>
                  </label>

                  <label className="profile-field profile-field-plain profile-field-compact profile-timezone">
                    <span className="sr-only">Múi giờ</span>
                    <select
                      name="timezone"
                      aria-label="Múi giờ"
                      value={form.timezone}
                      onChange={fieldChange("timezone")}
                    >
                      <option value="7">UTC+7</option>
                      <option value="8">UTC+8</option>
                      <option value="0">UTC+0</option>
                    </select>
                  </label>
                </div>

                <div className="profile-row profile-row-meta">
                  <label className="profile-field profile-hour">
                    <FieldIcon name="clock" />
                    <span className="sr-only">Giờ sinh</span>
                    <select
                      name="birthHour"
                      aria-label="Giờ sinh"
                      value={form.birthHour}
                      onChange={fieldChange("birthHour")}
                    >
                      {HOUR_BRANCHES.map((branch, index) => (
                        <option value={branch} key={branch}>
                          {branch} {BRANCH_HAN[branch]} · {HOUR_RANGES[index]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="profile-field profile-gender">
                    <FieldIcon name="gender" />
                    <span className="sr-only">Giới tính</span>
                    <select
                      name="gender"
                      aria-label="Giới tính"
                      value={form.gender}
                      onChange={fieldChange("gender")}
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </label>

                  <label className="profile-field profile-year">
                    <FieldIcon name="calendar" />
                    <span className="sr-only">Năm xem</span>
                    <select
                      name="annualYear"
                      aria-label="Năm xem"
                      value={form.annualYear}
                      onChange={fieldChange("annualYear")}
                    >
                      {Array.from({ length: 11 }, (_, index) => {
                        const year = new Date().getFullYear() - 5 + index;
                        return (
                          <option value={year} key={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="profile-field profile-work">
                    <FieldIcon name="work" />
                    <span className="sr-only">Tình trạng công việc</span>
                    <select
                      name="occupationStatus"
                      aria-label="Tình trạng công việc"
                      value={form.occupationStatus}
                      onChange={fieldChange("occupationStatus")}
                    >
                      <option value="">Công việc</option>
                      <option value="Đang đi học">Đang đi học</option>
                      <option value="Đang làm việc">Đang làm việc</option>
                      <option value="Tự doanh">Tự doanh</option>
                      <option value="Tạm nghỉ việc">Tạm nghỉ việc</option>
                      <option value="Đã nghỉ hưu">Đã nghỉ hưu</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </label>

                  <label className="profile-field profile-relationship">
                    <FieldIcon name="relationship" />
                    <span className="sr-only">Tình trạng mối quan hệ</span>
                    <select
                      name="relationshipStatus"
                      aria-label="Tình trạng mối quan hệ"
                      value={form.relationshipStatus}
                      onChange={fieldChange("relationshipStatus")}
                    >
                      <option value="">Mối quan hệ</option>
                      <option value="Độc thân">Độc thân</option>
                      <option value="Đang hẹn hò">Đang hẹn hò</option>
                      <option value="Đã kết hôn">Đã kết hôn</option>
                      <option value="Ly thân hoặc ly hôn">
                        Ly thân / ly hôn
                      </option>
                      <option value="Góa">Góa</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </label>

                  <div className="profile-toggles" aria-label="Lớp sao hiển thị">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={form.showMutagens}
                        onChange={(event) =>
                          update("showMutagens", event.target.checked)
                        }
                      />
                      Tứ Hóa
                    </label>
                    <label className="toggle is-phi-toggle">
                      <input
                        type="checkbox"
                        checked={form.showPhi}
                        onChange={(event) =>
                          update("showPhi", event.target.checked)
                        }
                      />
                      Phi Hóa
                    </label>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={form.showAnnual}
                        onChange={(event) =>
                          update("showAnnual", event.target.checked)
                        }
                      />
                      Sao lưu
                    </label>
                  </div>

                  <div
                    className="chart-actions profile-chart-actions"
                    role="group"
                    aria-label="Xuất lá số"
                  >
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={copyChart}
                      title="Sao chép văn bản"
                      aria-label="Sao chép văn bản"
                    >
                      {copyLabel}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={downloadText}
                      title="Tải file .txt"
                      aria-label="Tải file .txt"
                    >
                      ⭳ TXT
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={downloadImage}
                      disabled={imageState === "working"}
                      title="Tải ảnh PNG"
                      aria-label="Tải ảnh PNG"
                    >
                      {imageLabel}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </aside>

          <section className="chart-section" aria-label="Lá số 12 cung">
            <div className="chart-panel chart-workspace">
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
                  profileName={form.name}
                />
              </div>
              <div hidden={mobileMode !== "reading"}>
                <MobileChart
                  data={chartData}
                  school={school}
                  showAnnual={form.showAnnual}
                  showMutagens={form.showMutagens}
                  showPhi={form.showPhi}
                  profileName={form.name}
                  gender={form.gender}
                />
              </div>

            </div>
            <div className="palace-overview-slot">
              {chartData &&
              getAnalysisStatus("palace-overview").status === "available" ? (
                <PalaceOverviewRadar chart={chartData} school={school} />
              ) : (
                <ZiweiAnalysisRebuilding module="palace-overview" />
              )}
            </div>
          </section>

          <AiChat getContext={context} />

          <section
            className="trend-section"
            aria-label="Module vận khí"
          >
            <div className="trend-analysis-grid">
              <ZiweiAnalysisRebuilding module="annual-axes" />
              <ZiweiAnalysisRebuilding module="major-fortune" />
              <ZiweiAnalysisRebuilding module="monthly-flow" />
            </div>
          </section>
        </main>

        <footer>
          <div className="han">斗數</div>
          Void Occult · Tử Vi Đẩu Số
        </footer>
      </div>
    </>
  );
}
