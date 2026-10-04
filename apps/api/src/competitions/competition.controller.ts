import { Controller, Get, Param, Req } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { ApiErrorDto } from "../common/dto/api-error.dto.js";
import {
  CollegeDto,
  CompetitionDetailDto,
  CompetitionListDto,
} from "./competition.dto.js";
import { CompetitionService } from "./competition.service.js";
@ApiTags("比赛")
@Controller()
export class CompetitionController {
  constructor(private readonly service: CompetitionService) {}
  @Get("colleges")
  @ApiOkResponse({ type: CollegeDto, isArray: true })
  colleges() {
    return this.service.colleges();
  }
  @Get("competitions")
  @ApiOkResponse({ type: CompetitionListDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiQuery({
    name: "hosts",
    required: false,
    type: String,
    description: "缺省/all 不限；空值无结果；支持重复与逗号合并，合法自选优先",
  })
  @ApiQuery({
    name: "q",
    required: false,
    type: String,
    description: "单值，字面包含，最长100字符",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["upcoming", "open", "closed", "unknown", "conflict"],
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "单值正安全整数；超过页数返回最后有效页",
  })
  @ApiQuery({
    name: "pageSize",
    required: false,
    type: Number,
    description: "单值1–50，缺省20",
  })
  list(@Req() request: FastifyRequest) {
    return this.service.list(request.raw.url ?? request.url);
  }
  @Get("competitions/:id")
  @ApiOkResponse({ type: CompetitionDetailDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  detail(@Param("id") id: string) {
    return this.service.detail(id);
  }
}
