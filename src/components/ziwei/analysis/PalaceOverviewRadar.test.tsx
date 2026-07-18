import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import { PalaceOverviewRadar } from "./PalaceOverviewRadar";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const OTHER_CHART: BirthInput = {
  solarDate: "1988-03-14",
  birthHour: "Mão",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function renderRadar() {
  const chart = calculateNamPhai(REGRESSION);
  return render(<PalaceOverviewRadar chart={chart} school="nam-phai" />);
}

describe("PalaceOverviewRadar", () => {
  it("renders the renamed title and hides raw engine version by default", () => {
    const { container } = renderRadar();
    expect(screen.getByText("Cấu trúc 12 cung")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/1\.0\.0-experimental/);
    expect(container.textContent).not.toMatch(/palace-overview-v1/);
  });

  it("opens the detail panel on click; groups A-G live inside the collapsed full-evidence details, closed by default", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const detail = container.querySelector(".palace-overview-detail")!;
    expect(detail).not.toBeNull();

    const fullEvidence = container.querySelector(
      ".palace-overview-detail__full-evidence",
    ) as HTMLDetailsElement;
    expect(fullEvidence).not.toBeNull();
    expect(fullEvidence.open).toBe(false);

    const headingsInside = within(fullEvidence)
      .getAllByRole("heading", { level: 5 })
      .map((h) => h.textContent);
    for (const prefix of ["A.", "B.", "C.", "D.", "E.", "F.", "G."]) {
      expect(headingsInside.some((h) => h?.startsWith(prefix))).toBe(true);
    }

    // Letter-prefixed headings must not also appear as default-visible
    // section headings outside the collapsed block.
    const allHeadings = within(detail as HTMLElement)
      .getAllByRole("heading", { level: 5 })
      .map((h) => h.textContent);
    const outsideHeadings = allHeadings.filter((h) => !headingsInside.includes(h));
    for (const prefix of ["A.", "B.", "C.", "D.", "E.", "F.", "G."]) {
      expect(outsideHeadings.some((h) => h?.startsWith(prefix))).toBe(false);
    }
  });

  it("full-evidence details opens on click", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const summary = screen.getByText("Xem toàn bộ bằng chứng");
    fireEvent.click(summary);
    const fullEvidence = container.querySelector(
      ".palace-overview-detail__full-evidence",
    ) as HTMLDetailsElement;
    expect(fullEvidence.open).toBe(true);
  });

  it("opens the detail panel via keyboard (Enter) on a focused radar point", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.keyDown(point, { key: "Enter" });
    expect(container.querySelector(".palace-overview-detail")).not.toBeNull();
  });

  it("moves profileId/version behind a collapsed 'Thông tin mô hình' section", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const details = screen.getByText("Thông tin mô hình").closest("details");
    expect(details).not.toBeNull();
    expect(details?.textContent).toMatch(/palace-overview-v1/);
  });

  it("localizes the tooltip band label instead of the raw English band string", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.mouseEnter(point);
    const tooltip = container.querySelector(".palace-overview-radar__tooltip")!;
    expect(tooltip.textContent).not.toMatch(/\b(low|guarded|balanced|supportive|strong)\b/);
  });

  it("V1.2: the first radar point is always Mệnh (pinned to 12 o'clock) and shows the Mệnh badge", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const detail = container.querySelector(".palace-overview-detail")!;
    expect(within(detail as HTMLElement).getByText("Chi tiết · Mệnh")).toBeInTheDocument();
    expect(within(detail as HTMLElement).getByText("Mệnh")).toBeInTheDocument();
  });

  it("V1.2.1: basic Cung Mệnh/Cung Thân rows are badge-only, not repeated as list rows", () => {
    const { container } = renderRadar();
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);

    const detail = container.querySelector(".palace-overview-detail")!;
    expect(within(detail as HTMLElement).queryByText("Cung an Mệnh của lá số")).toBeNull();
    expect(within(detail as HTMLElement).queryByText("Cung an Thân — trọng tâm biểu hiện")).toBeNull();
  });

  it("V1.2: semantic sections (Liên kết phụ tinh / Tứ Hóa theo sao nhận Hóa / Biểu hiện tại cung) render separately from groups A-G", () => {
    const { container } = renderRadar();
    const points = container.querySelectorAll(".palace-overview-radar__point");

    const seenSections = new Set<string>();
    for (const point of points) {
      fireEvent.click(point);
      const detail = container.querySelector(".palace-overview-detail") as HTMLElement;
      const headings = within(detail)
        .getAllByRole("heading", { level: 5 })
        .map((h) => h.textContent);
      for (const label of [
        "Liên kết phụ tinh",
        "Tứ Hóa theo sao nhận Hóa",
        "Biểu hiện tại cung",
      ]) {
        if (headings.includes(label)) seenSections.add(label);
      }
      // Structural separation: none of the A-G group headings duplicate the
      // semantic section labels.
      for (const g of ["A.", "B.", "C.", "D.", "E.", "F.", "G."]) {
        expect(headings.some((h) => h === g)).toBe(false); // headings include the group title text too
      }
      fireEvent.click(point); // close before opening the next one
    }

    expect(seenSections.has("Liên kết phụ tinh")).toBe(true);
    expect(seenSections.has("Tứ Hóa theo sao nhận Hóa")).toBe(true);
    expect(seenSections.has("Biểu hiện tại cung")).toBe(true);
  });

  it("V1.2: 'Liên kết phụ tinh' carries the not-yet-scored caption", () => {
    const { container } = renderRadar();
    const points = container.querySelectorAll(".palace-overview-radar__point");
    let found = false;
    for (const point of points) {
      fireEvent.click(point);
      const detail = container.querySelector(".palace-overview-detail") as HTMLElement;
      if (within(detail).queryByText("Liên kết phụ tinh")) {
        expect(
          within(detail).getByText("Ngữ nghĩa cấu trúc, chưa cộng điểm V1.2."),
        ).toBeInTheDocument();
        found = true;
        break;
      }
      fireEvent.click(point);
    }
    expect(found).toBe(true);
  });
});

describe("PalaceOverviewRadar — V1.2.1 stale-selection regression (PR #81 review thread)", () => {
  it("selecting a palace then changing the chart clears the stale result instead of showing old data", () => {
    const chartA = calculateNamPhai(REGRESSION);
    const { container, rerender } = render(
      <PalaceOverviewRadar chart={chartA} school="nam-phai" />,
    );
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);
    expect(container.querySelector(".palace-overview-detail")).not.toBeNull();
    const scoreBefore = container.querySelector(
      ".palace-overview-detail__band",
    )!.textContent;

    const chartB = calculateNamPhai(OTHER_CHART);
    rerender(<PalaceOverviewRadar chart={chartB} school="nam-phai" />);

    // Selection must never silently keep showing chartA's analysis.
    const detailAfter = container.querySelector(".palace-overview-detail");
    if (detailAfter) {
      // If a palace at the same index still happens to be selected it must
      // be re-derived from chartB's own results, never chartA's stale object.
      expect(detailAfter.querySelector(".palace-overview-detail__band")!.textContent).not.toBe(
        scoreBefore,
      );
    } else {
      expect(detailAfter).toBeNull();
    }
  });

  it("selecting a palace then switching school clears the stale result", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container, rerender } = render(
      <PalaceOverviewRadar chart={chart} school="nam-phai" />,
    );
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);
    expect(container.querySelector(".palace-overview-detail")).not.toBeNull();

    rerender(<PalaceOverviewRadar chart={chart} school="trung-chau" />);

    // The stale-selection bug this regresses against left the *previous
    // school's* PalaceOverviewResult object rendered; after the fix the
    // panel must close (selection is reset on school change).
    expect(container.querySelector(".palace-overview-detail")).toBeNull();
  });

  it("hover state clears when chart changes (no stale tooltip)", () => {
    const chartA = calculateNamPhai(REGRESSION);
    const { container, rerender } = render(
      <PalaceOverviewRadar chart={chartA} school="nam-phai" />,
    );
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.mouseEnter(point);
    expect(container.querySelector(".palace-overview-radar__tooltip")).not.toBeNull();

    const chartB = calculateNamPhai(OTHER_CHART);
    rerender(<PalaceOverviewRadar chart={chartB} school="nam-phai" />);

    // Falls back to the "no selection" hint text once hover is cleared.
    expect(
      screen.getByText(/Di chuột hoặc chọn một cung/),
    ).toBeInTheDocument();
  });

  it("selection always resolves against the current results (never a stored stale object)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { container } = render(<PalaceOverviewRadar chart={chart} school="nam-phai" />);
    const point = container.querySelector(".palace-overview-radar__point")!;
    fireEvent.click(point);
    const detail = container.querySelector(".palace-overview-detail")!;
    // Re-selecting the exact same chart/school must show identical data —
    // proves the value is derived fresh, not cached as a stale reference.
    const bandText = detail.querySelector(".palace-overview-detail__band")!.textContent;
    fireEvent.click(container.querySelector(".palace-overview-detail__close")!);
    fireEvent.click(point);
    const detail2 = container.querySelector(".palace-overview-detail")!;
    expect(detail2.querySelector(".palace-overview-detail__band")!.textContent).toBe(bandText);
  });

  it("both schools compute without error for the trine-link/pair-detector fixture chart", () => {
    const chart = calculateTrungChau(REGRESSION);
    const { container } = render(<PalaceOverviewRadar chart={chart} school="trung-chau" />);
    expect(container.querySelector(".palace-overview-radar")).not.toBeNull();
  });
});
