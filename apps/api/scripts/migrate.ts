import "dotenv/config";
import { Pool } from "pg";
import { migrate } from "../src/database/migrate.js";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (!process.env.DATABASE_URL) throw new Error("需要 DATABASE_URL");
  await migrate(pool);
  console.log("数据库迁移完成");
} catch {
  console.error("迁移失败：检查配置与数据库可用性（不输出连接信息）");
  process.exitCode = 1;
} finally {
  await pool.end();
}
