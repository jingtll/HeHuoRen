import { Controller, Get, Req } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { ApiErrorDto } from "../common/dto/api-error.dto.js";
import { HealthResponseDto } from "./health-response.dto.js";
import { HealthService } from "./health.service.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "获取应用健康状态" })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiInternalServerErrorResponse({ type: ApiErrorDto })
  getHealth(@Req() request: FastifyRequest): HealthResponseDto {
    return this.healthService.getHealth(request.id);
  }
}
