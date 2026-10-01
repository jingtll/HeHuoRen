import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { validateEnvironment } from "./config/env.validation.js";
import { HealthController } from "./health/health.controller.js";
import { HealthService } from "./health/health.service.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
