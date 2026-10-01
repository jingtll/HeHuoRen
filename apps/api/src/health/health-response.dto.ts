import { ApiProperty } from "@nestjs/swagger";

export class HealthResponseDto {
  @ApiProperty({ example: "ok", enum: ["ok"] })
  status!: "ok";

  @ApiProperty({
    description: "Fastify 为当前请求生成的关联 ID。",
    example: "req-1",
  })
  requestId!: string;
}
