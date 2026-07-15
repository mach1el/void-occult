import { expect, test } from "vitest";
import { ELEMENT_COLOR_VAR } from "./element-colors";

test("Kim và Thổ dùng token màu khác nhau (bạc vs vàng đất)", () => {
  expect(ELEMENT_COLOR_VAR.Kim).not.toBe(ELEMENT_COLOR_VAR.Thổ);
});

test("mọi hành trỏ về var(--element-*) — không hard-code hex", () => {
  for (const value of Object.values(ELEMENT_COLOR_VAR)) {
    expect(value).toMatch(/^var\(--element-[a-z]+\)$/);
  }
});
