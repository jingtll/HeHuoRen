import type { CollegeId } from "./colleges";

// 空数组：未选择；all：明确选择全部学院；非空数组：自选学院。
export type CollegeSelection = CollegeId[] | "all";
