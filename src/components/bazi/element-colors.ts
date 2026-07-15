import { Element } from "@/lib/bazi/elements";

/**
 * Màu ngũ hành dùng cho Bát Tự — trỏ về CÙNG token `--element-*` định nghĩa
 * trong `src/styles.css` (nguồn duy nhất, dùng chung với sao Tử Vi). Không tự
 * định nghĩa hex ở đây.
 */
export const ELEMENT_COLOR_VAR: Record<Element, string> = {
  Mộc: "var(--element-moc)",
  Hỏa: "var(--element-hoa)",
  Thổ: "var(--element-tho)",
  Kim: "var(--element-kim)",
  Thủy: "var(--element-thuy)",
};
