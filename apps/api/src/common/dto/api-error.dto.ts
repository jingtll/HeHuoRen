import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApiErrorDto {
  @ApiProperty({ example: "INTERNAL_SERVER_ERROR" })
  code!: string;

  @ApiProperty({ example: "服务器内部错误" })
  message!: string;

  @ApiProperty({ example: "req-1" })
  requestId!: string;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    description: "可选的公开错误详情。",
  })
  details?: Record<string, unknown>;
}
