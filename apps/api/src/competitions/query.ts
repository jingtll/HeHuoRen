import { BadRequestException } from "@nestjs/common";
import { statusValues, type Status } from "./competition.dto.js";
export interface ListQuery {
  hosts: string[] | "all";
  q: string;
  status: Status | "";
  page: number;
  pageSize: number;
}
export function parseListQuery(url: string, collegeIds: string[]): ListQuery {
  const params = new URL(url, "http://localhost").searchParams;
  for (const key of ["q", "status", "page", "pageSize"])
    if (params.getAll(key).length > 1) throw new BadRequestException();
  const integer = (
    key: string,
    fallback: number,
    max = Number.MAX_SAFE_INTEGER,
  ) => {
    if (!params.has(key)) return fallback;
    const raw = params.get(key)!;
    const value = Number(raw);
    if (
      !/^\d+$/.test(raw) ||
      !Number.isSafeInteger(value) ||
      value < 1 ||
      value > max
    )
      throw new BadRequestException();
    return value;
  };
  const q = (params.get("q") ?? "").trim();
  if (q.length > 100) throw new BadRequestException();
  const rawStatus = params.get("status");
  if (rawStatus !== null && !statusValues.includes(rawStatus as Status))
    throw new BadRequestException();
  const tokens = params.getAll("hosts").flatMap((v) => v.split(","));
  const ids = collegeIds.filter((id) => tokens.includes(id));
  return {
    hosts: !params.has("hosts")
      ? "all"
      : ids.length
        ? ids
        : tokens.includes("all")
          ? "all"
          : [],
    q,
    status: (rawStatus ?? "") as Status | "",
    page: integer("page", 1),
    pageSize: integer("pageSize", 20, 50),
  };
}
