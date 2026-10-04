import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";
@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly pool: Pool;
  readonly db;
  constructor(config: ConfigService) {
    // 惰性连接；OpenAPI、构建和 health 不需要活数据库。
    this.pool = new Pool({
      connectionString: config.get<string>("DATABASE_URL"),
      max: 5,
      connectionTimeoutMillis: 5000,
    });
    this.pool.on("error", () => {
      /* 避免驱动错误泄露连接信息，业务请求通过统一过滤器反馈。 */
    });
    this.db = drizzle(this.pool, { schema });
  }
  async onApplicationShutdown() {
    await this.pool.end();
  }
}
