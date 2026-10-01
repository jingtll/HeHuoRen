import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import type { AddressInfo } from "node:net";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/configure-app.js";

describe("API HTTP smoke", () => {
  let app: NestFastifyApplication;
  let baseUrl: string;

  beforeAll(async () => {
    app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
      { logger: false },
    );
    configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    await app.listen(0, "127.0.0.1");

    const address = app.getHttpServer().address() as AddressInfo | null;
    if (address === null || typeof address === "string") {
      throw new Error("Fastify did not expose its bound test address");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves a public health response and its Swagger schema", async () => {
    const healthResponse = await fetch(`${baseUrl}/api/v1/health`);
    const healthBody = await healthResponse.json();

    expect(healthResponse.status).toBe(200);
    expect(healthBody).toEqual({
      status: "ok",
      requestId: expect.any(String),
    });
    expect(healthBody).not.toHaveProperty("env");
    expect(healthBody).not.toHaveProperty("stack");
    expect(healthBody).not.toHaveProperty("database");

    const swaggerResponse = await fetch(`${baseUrl}/docs-json`);
    const swaggerDocument = await swaggerResponse.json();

    expect(swaggerResponse.status).toBe(200);
    expect(swaggerDocument.paths).toHaveProperty("/api/v1/health");
  });
});
