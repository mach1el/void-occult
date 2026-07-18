import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ScoreLine, TrendPoint } from "@/lib/ziwei/trend";
import {
  flattenGroupedLines,
  groupScoreLines,
} from "./breakdown-groups";
import { TrendPointPanel } from "./TrendPointPanel";

function line(partial: ScoreLine): ScoreLine {
  return partial;
}

const MONTH5: TrendPoint = {
  label: "Năm",
  cat: 38,
  hung: 41,
  isCurrent: true,
  monthNumber: 5,
  calendarStem: "Giáp",
  calendarBranch: "Ngọ",
  focusPalaceName: "Mệnh",
  focusPalaceBranch: "Tý",
  majorStarContext: {
    voidMajorPalaces: [
      {
        palaceRole: "tam-hop",
        palaceName: "Tài Bạch",
        palaceBranch: "Thân",
      },
    ],
  },
  breakdown: {
    cat: [
      line({
        source: "Thiên Lương",
        points: 3.6,
        reason: "Miếu · base tại xung chiếu Thiên Di",
        category: "major-star",
        palaceRole: "xung",
        palaceName: "Thiên Di",
        palaceBranch: "Ngọ",
        starTier: 1,
        brightness: "Miếu",
        layer: "natal",
      }),
      line({
        source: "Tiểu Hao",
        points: 1.2,
        reason: "base",
        category: "minor-star",
        palaceRole: "focus",
        palaceName: "Mệnh",
        palaceBranch: "Tý",
        starTier: 3,
        layer: "natal",
      }),
    ],
    hung: [
      line({
        source: "Tiểu Hao",
        points: 0.9,
        reason: "base hung",
        category: "minor-star",
        palaceRole: "tam-hop",
        palaceName: "Quan Lộc",
        palaceBranch: "Thìn",
        starTier: 3,
        layer: "natal",
      }),
      line({
        source: "Thái Dương",
        points: 5,
        reason: "Hãm · base tại cung hạn Mệnh",
        category: "major-star",
        palaceRole: "focus",
        palaceName: "Mệnh",
        palaceBranch: "Tý",
        starTier: 1,
        brightness: "Hãm",
        layer: "natal",
      }),
      line({
        source: "Cự Môn",
        points: 2.4,
        reason: "Hãm · base tại tam hợp Quan Lộc",
        category: "major-star",
        palaceRole: "tam-hop",
        palaceName: "Quan Lộc",
        palaceBranch: "Thìn",
        starTier: 1,
        brightness: "Hãm",
        layer: "natal",
      }),
      line({
        source: "Lưu nguyệt Hóa Kỵ",
        points: 15,
        reason: "Lưu nguyệt Hóa Kỵ→Thái Dương",
        category: "mutagen",
        layer: "monthly",
        transform: "Kỵ",
        targetStar: "Thái Dương",
        palaceRole: "focus",
        palaceName: "Mệnh",
        palaceBranch: "Tý",
      }),
    ],
  },
};

describe("groupScoreLines", () => {
  it("không nhân đôi dòng; xung trước tam hợp", () => {
    const lines = [
      ...MONTH5.breakdown.hung,
      ...MONTH5.breakdown.cat.filter((l) => l.category === "major-star"),
    ];
    const groups = groupScoreLines(lines);
    expect(flattenGroupedLines(groups)).toHaveLength(lines.length);

    const aspect = groups.find((g) => g.id === "major-aspect")!;
    expect(aspect.lines.map((l) => l.source)).toEqual(["Thiên Lương", "Cự Môn"]);
  });
});

describe("TrendPointPanel Lưu Nguyệt", () => {
  it("header Tháng Năm · Giáp Ngọ; không còn Mốc Năm", () => {
    render(<TrendPointPanel point={MONTH5} onClose={() => undefined} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Tháng Năm · Giáp Ngọ",
    );
    expect(screen.getByText(/Lưu Nguyệt Mệnh: Mệnh tại Tý/)).toBeInTheDocument();
    expect(screen.queryByText(/Mốc Năm/)).not.toBeInTheDocument();
    expect(screen.getByText(/Vô chính diệu trong TP4C/)).toBeInTheDocument();
    expect(screen.getByText(/Tài Bạch tại Thân/)).toBeInTheDocument();
  });

  it("nhóm chính tinh chủ tháng / hội chiếu; Thái Dương trước Tiểu Hao trong Hung", () => {
    render(<TrendPointPanel point={MONTH5} onClose={() => undefined} />);
    expect(
      screen.getAllByText("Chính tinh chủ tháng").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Chính tinh hội chiếu").length,
    ).toBeGreaterThanOrEqual(1);

    const hungCol = screen
      .getByText("Hung")
      .closest(".trend-breakdown") as HTMLElement;
    const hungText = hungCol.textContent ?? "";
    expect(hungText.indexOf("Thái Dương")).toBeGreaterThan(-1);
    expect(hungText.indexOf("Thái Dương")).toBeLessThan(
      hungText.indexOf("Tiểu Hao"),
    );

    const catCol = screen
      .getByText("Cát")
      .closest(".trend-breakdown") as HTMLElement;
    expect(within(catCol).getByText(/Thiên Lương/)).toBeInTheDocument();
    expect(within(hungCol).getByText(/Cự Môn/)).toBeInTheDocument();
  });

  it("mỗi ScoreLine render một lần; tổng điểm khớp", () => {
    const { container } = render(
      <TrendPointPanel point={MONTH5} onClose={() => undefined} />,
    );
    const hungSources = MONTH5.breakdown.hung.map((l) => l.source);
    for (const source of hungSources) {
      // title may append brightness — match by includes once in Hung column
      const hungCol = screen
        .getByText("Hung")
        .closest(".trend-breakdown") as HTMLElement;
      const matches = within(hungCol).queryAllByText(
        (_, el) => Boolean(el?.textContent?.includes(source)),
        { selector: ".trend-breakdown-source" },
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
    const sumCat = MONTH5.breakdown.cat.reduce((s, l) => s + l.points, 0);
    const sumHung = MONTH5.breakdown.hung.reduce((s, l) => s + l.points, 0);
    expect(sumCat).toBeCloseTo(
      [...container.querySelectorAll(".trend-breakdown.is-cat .trend-breakdown-points")]
        .map((el) => {
          const t = el.textContent?.replace("+", "") ?? "0";
          return t === "·" ? 0 : Number(t);
        })
        .reduce((a, b) => a + b, 0),
      5,
    );
    expect(sumHung).toBeCloseTo(
      [...container.querySelectorAll(".trend-breakdown.is-hung .trend-breakdown-points")]
        .map((el) => {
          const t = el.textContent?.replace("+", "") ?? "0";
          return t === "·" ? 0 : Number(t);
        })
        .reduce((a, b) => a + b, 0),
      5,
    );
  });

  it("Đại vận thiếu metadata vẫn fallback Mốc {label}", () => {
    render(
      <TrendPointPanel
        point={{
          label: "35-44",
          cat: 20,
          hung: 30,
          isCurrent: false,
          breakdown: { cat: [], hung: [] },
        }}
        onClose={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Mốc 35-44",
    );
  });
});
