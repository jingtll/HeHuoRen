import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { configureApp } from "../src/configure-app.js";
import { importBatch } from "../src/competitions/import.js";
import { DatabaseService } from "../src/database/database.service.js";
import { testDatabase, directory, edition } from "./competition-fixture.js";
describe("公开比赛 HTTP 契约", () => {
  let app: NestFastifyApplication;
  let db: Awaited<ReturnType<typeof testDatabase>>;
  let previous: string | undefined;
  beforeAll(async () => {
    db = await testDatabase();
    previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = db.url;
    // ConfigModule 在模块加载时读取环境；必须先设置隔离测试库。
    const { AppModule } = await import("../src/app.module.js");
    await importBatch(db.pool, {
      colleges: directory,
      competitions: [
        edition(),
        edition("draft", { publication: "draft" }),
        edition("hidden", { publication: "hidden" }),
      ],
    });
    app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
      { logger: false },
    );
    configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => {
    await app?.close();
    await db?.close();
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });
  const get = (url: string) =>
    app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: "GET", url: "/api/v1/" + url });
  it("三个查询无需登录；health仍为进程状态", async () => {
    expect(app.get(DatabaseService).pool.options.connectionString).toBe(db.url);
    for (const url of [
      "colleges",
      "competitions",
      "competitions/alpha",
      "health",
    ])
      expect((await get(url)).statusCode).toBe(200);
    const list = (await get("competitions")).json();
    expect(list).toMatchObject({
      page: 1,
      pageSize: 20,
      totalStages: 1,
      totalCompetitions: 1,
      totalPages: 1,
    });
    expect(list.evaluatedAt).toMatch(/Z$/);
    expect((await get("health")).json()).not.toHaveProperty("database");
  });
  it.each([
    "competitions/draft",
    "competitions/hidden",
    "competitions/missing",
  ])("%s统一404", async (url) => {
    const response = await get(url);
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      code: "NOT_FOUND",
      message: "请求的资源不存在",
      requestId: expect.any(String),
    });
  });
  it.each([
    "pageSize=",
    "pageSize=0",
    "pageSize=-1",
    "pageSize=1.5",
    "pageSize=51",
    "pageSize=9007199254740992",
    "page=0",
    "page=-1",
    "page=1.5",
    "page=9007199254740992",
    "status=invalid",
    "status=",
    "q=a&q=a",
    "status=open&status=open",
    "page=1&page=1",
    "pageSize=4&pageSize=4",
  ])("参数 %s 为400", async (query) => {
    const response = await get("competitions?" + query);
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: "BAD_REQUEST",
      message: "请求参数无效",
      requestId: expect.any(String),
    });
  });
  it.each([1, 50])("pageSize %s 不截断", async (size) =>
    expect((await get("competitions?pageSize=" + size)).json().pageSize).toBe(
      size,
    ),
  );
  it("重复hosts合并、自选优先、空选择不回退全部", async () => {
    expect(
      (await get("competitions?hosts=all,bad&hosts=law,law")).json()
        .totalStages,
    ).toBe(1);
    expect((await get("competitions?hosts=bad")).json().totalStages).toBe(0);
    expect((await get("competitions?hosts=")).json().totalStages).toBe(0);
  });
  it("错误不泄露连接信息", async () => {
    await app.get(DatabaseService).pool.end();
    const response = await get("competitions");
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "服务器内部错误",
      requestId: expect.any(String),
    });
    expect((await get("health")).statusCode).toBe(200);
  });
});
