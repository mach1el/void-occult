/** Natal fact types for Zi Wei analysis (static layer only). */

export type ZiweiFactLayer = "natal";

export type ZiweiFactKind =
  | "star"
  | "transformation"
  | "void-marker"
  | "chang-sheng";

export type ZiweiStarClass =
  | "major"
  | "auxiliary"
  | "benefic"
  | "malefic"
  | "wealth"
  | "academic"
  | "movement"
  | "romance"
  | "pressure"
  | "neutral";

export type ZiweiBrightness =
  | "Miếu"
  | "Vượng"
  | "Đắc"
  | "Bình"
  | "Hãm";

export type ZiweiSchool = "nam-phai" | "trung-chau";

export type ZiweiTransformation = "Lộc" | "Quyền" | "Khoa" | "Kỵ";

export type ZiweiVoidType = "Tuần" | "Triệt";

export interface NatalZiweiFact {
  id: string;
  layer: "natal";
  kind: ZiweiFactKind;

  school: ZiweiSchool;

  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;

  source: string;

  starName?: string;
  canonicalStarName?: string;
  starClass?: ZiweiStarClass;
  brightness?: ZiweiBrightness;

  transformation?: ZiweiTransformation;
  targetStar?: string;

  voidType?: ZiweiVoidType;
  changShengStage?: string;
}

export interface NormalizeNatalFactsOptions {
  school: ZiweiSchool;
}

export interface NormalizeNatalFactsResult {
  facts: NatalZiweiFact[];
  duplicateIds: string[];
}
