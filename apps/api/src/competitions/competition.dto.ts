import { ApiProperty } from "@nestjs/swagger";
export const statusValues = [
  "upcoming",
  "open",
  "closed",
  "unknown",
  "conflict",
] as const;
export type Status = (typeof statusValues)[number];
export class TimeDto {
  @ApiProperty({ enum: ["instant", "date", "unknown"] }) precision:
    "instant" | "date" | "unknown";
  @ApiProperty({ type: String, nullable: true }) value: string | null;
}
export class CollegeDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() order: number;
}
export class ScopeDto {
  @ApiProperty({ enum: ["all", "colleges", "complex", "unknown"] }) kind:
    "all" | "colleges" | "complex" | "unknown";
  @ApiProperty({ type: [String] }) colleges: string[];
  @ApiProperty() note: string;
}
export class NoticeDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() publisher: string;
  @ApiProperty() url: string;
  @ApiProperty({ type: String, nullable: true }) publishedAt: string | null;
  @ApiProperty({ type: String, nullable: true }) checkedAt: string | null;
  @ApiProperty({ enum: ["registration", "supplement", "award", "news"] }) kind:
    "registration" | "supplement" | "award" | "news";
}
export class TrackDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ["individual", "team", "mixed"] }) mode:
    "individual" | "team" | "mixed";
  @ApiProperty() members: string;
  @ApiProperty() rules: string;
}
export class StageDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() organizer: string;
  @ApiProperty({ type: [String] }) hosts: string[];
  @ApiProperty({ type: ScopeDto }) scope: ScopeDto;
  @ApiProperty({ type: TimeDto }) startsAt: TimeDto;
  @ApiProperty({ type: TimeDto }) deadline: TimeDto;
  @ApiProperty({ type: TimeDto }) materialsAt: TimeDto;
  @ApiProperty({ type: TimeDto }) eventAt: TimeDto;
  @ApiProperty() timeNote: string;
  @ApiProperty() conflict: boolean;
  @ApiProperty() registration: string;
  @ApiProperty() order: number;
  @ApiProperty({ type: [String] }) sourceIds: string[];
  @ApiProperty({ enum: statusValues }) status: Status;
}
export class CompetitionSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() edition: string;
  @ApiProperty() category: string;
  @ApiProperty() organizer: string;
  @ApiProperty({ enum: ["official", "historical", "demo"] }) origin:
    "official" | "historical" | "demo";
}
export class StageSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: [String] }) hosts: string[];
  @ApiProperty({ type: ScopeDto }) scope: ScopeDto;
  @ApiProperty({ type: TimeDto }) deadline: TimeDto;
  @ApiProperty({ type: TimeDto }) materialsAt: TimeDto;
  @ApiProperty() conflict: boolean;
  @ApiProperty({ enum: statusValues }) status: Status;
}
export class EntryDto {
  @ApiProperty({ type: CompetitionSummaryDto })
  competition: CompetitionSummaryDto;
  @ApiProperty({ type: StageSummaryDto }) stage: StageSummaryDto;
}
export class CompetitionDetailDto extends CompetitionSummaryDto {
  @ApiProperty({ type: [TrackDto] }) tracks: TrackDto[];
  @ApiProperty({ type: [StageDto] }) stages: StageDto[];
  @ApiProperty({ type: [NoticeDto] }) notices: NoticeDto[];
  @ApiProperty() evaluatedAt: string;
}
export class CompetitionListDto {
  @ApiProperty({ type: [EntryDto] }) items: EntryDto[];
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() hasMore: boolean;
  @ApiProperty() totalStages: number;
  @ApiProperty() totalCompetitions: number;
  @ApiProperty() totalPages: number;
  @ApiProperty() evaluatedAt: string;
}
