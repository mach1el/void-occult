export type StaticFrameRole = "focus" | "opposite" | "trine";

export interface StaticFrameNode {
  palaceIndex: number;
  palaceName: string;
  palaceBranch: string;
  role: StaticFrameRole;
  geometryWeight: number;
}

export interface StaticFrameGeometryWeights {
  focus: number;
  opposite: number;
  trine: number;
}

export interface BuildStaticFrameOptions {
  geometry: StaticFrameGeometryWeights;
}

export interface StaticFrame {
  focusIndex: number;
  nodes: StaticFrameNode[];
}
