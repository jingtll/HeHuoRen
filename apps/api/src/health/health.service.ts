import { Injectable } from "@nestjs/common";
import { HealthResponseDto } from "./health-response.dto.js";

@Injectable()
export class HealthService {
  getHealth(requestId: string): HealthResponseDto {
    return { status: "ok", requestId };
  }
}
