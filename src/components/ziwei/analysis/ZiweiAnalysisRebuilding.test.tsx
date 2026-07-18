import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANALYSIS_MODULES } from "@/lib/ziwei/analysis";
import { ZiweiAnalysisRebuilding } from "./ZiweiAnalysisRebuilding";

describe("ZiweiAnalysisRebuilding", () => {
  it.each(ANALYSIS_MODULES)(
    "shows rebuilding copy for %s without numeric scores",
    (module) => {
      const { container } = render(<ZiweiAnalysisRebuilding module={module} />);

      expect(
        screen.getByText(/Module vận khí đang được tái cấu trúc/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Lá số và dữ liệu an sao không bị ảnh hưởng/i),
      ).toBeInTheDocument();
      expect(container.querySelector("[data-status='unavailable']")).not.toBeNull();
      expect(container.textContent).not.toMatch(/\b(0|50|100)\b/);
      expect(container.querySelector("svg")).toBeNull();
      expect(container.querySelector(".trend-bar")).toBeNull();
    },
  );
});
