import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { importBatch, validateInput } from "../src/competitions/import.js";
const args = process.argv.slice(2);
const file = args.find((v) => !v.startsWith("--"));
const allowed = new Set(["--validate", "--preview", "--confirm-published"]);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (!file || args.some((v) => v.startsWith("--") && !allowed.has(v)))
    throw new Error(
      "用法：文件.json [--validate | --preview] [--confirm-published]",
    );
  const input: unknown = JSON.parse(await readFile(file, "utf8"));
  validateInput(input);
  if (args.includes("--validate"))
    console.log("结构校验通过；数据库引用及发布约束请运行 --preview");
  else {
    if (!process.env.DATABASE_URL) throw new Error("需要 DATABASE_URL");
    console.log(
      JSON.stringify(
        await importBatch(pool, input, {
          preview: args.includes("--preview"),
          confirmPublished: args.includes("--confirm-published"),
          production: process.env.NODE_ENV === "production",
        }),
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.error(
    error instanceof Error && !("code" in error)
      ? error.message
      : "导入失败：数据库不可用或约束冲突，整批已回滚",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
