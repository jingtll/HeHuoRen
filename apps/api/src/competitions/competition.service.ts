import { Injectable, NotFoundException } from "@nestjs/common";
import { CompetitionRepository } from "./competition.repository.js";
import { registrationStatus } from "./time.js";
import type { CompetitionDetailDto } from "./competition.dto.js";
@Injectable()
export class CompetitionClock {
  now() {
    return new Date();
  }
}
@Injectable()
export class CompetitionService {
  constructor(
    private readonly repository: CompetitionRepository,
    private readonly clock: CompetitionClock,
  ) {}
  colleges() {
    return this.repository.colleges();
  }
  list(url: string) {
    return this.repository.list(url, this.clock.now());
  }
  async detail(id: string): Promise<CompetitionDetailDto> {
    const now = this.clock.now();
    const record = await this.repository.detail(id);
    if (!record) throw new NotFoundException();
    const { publication, ...detail } = record;
    void publication;
    return {
      ...detail,
      stages: detail.stages.map((s) => ({
        ...s,
        status: registrationStatus(s, now),
      })),
      evaluatedAt: now.toISOString(),
    };
  }
}
