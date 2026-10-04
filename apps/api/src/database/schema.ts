import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  date,
  primaryKey,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import type {
  EditionSummary,
  StageRecord,
  TrackRecord,
  NoticeRecord,
} from "../competitions/competition.model.js";
export const colleges = pgTable("colleges", {
  id: text().primaryKey(),
  name: text().notNull(),
  order: integer("display_order").notNull().unique(),
});
export const competitions = pgTable("competitions", {
  id: text().primaryKey(),
  data: jsonb().$type<EditionSummary>().notNull(),
  publication: text().notNull().default("draft"),
});
export const stages = pgTable(
  "stages",
  {
    id: text().primaryKey(),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competitions.id),
    data: jsonb().$type<Omit<StageRecord, "hosts" | "sourceIds">>().notNull(),
    order: integer("display_order").notNull(),
    registrationStart: timestamp("registration_start", { withTimezone: true }),
    registrationEnd: timestamp("registration_end", { withTimezone: true }),
    registrationStartDate: date("registration_start_date"),
    registrationEndDate: date("registration_end_date"),
  },
  (t) => [unique().on(t.id, t.competitionId)],
);
export const tracks = pgTable("tracks", {
  id: text().primaryKey(),
  competitionId: text("competition_id")
    .notNull()
    .references(() => competitions.id),
  data: jsonb().$type<TrackRecord>().notNull(),
});
export const notices = pgTable(
  "notices",
  {
    id: text().primaryKey(),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competitions.id),
    data: jsonb().$type<NoticeRecord>().notNull(),
    publishedAt: date("published_at"),
    checkedAt: date("checked_at"),
  },
  (t) => [unique().on(t.id, t.competitionId)],
);
export const hosts = pgTable(
  "stage_hosts",
  {
    stageId: text("stage_id")
      .notNull()
      .references(() => stages.id),
    collegeId: text("college_id")
      .notNull()
      .references(() => colleges.id),
  },
  (t) => [primaryKey({ columns: [t.stageId, t.collegeId] })],
);
export const eligibility = pgTable(
  "stage_eligibility",
  {
    stageId: text("stage_id")
      .notNull()
      .references(() => stages.id),
    collegeId: text("college_id")
      .notNull()
      .references(() => colleges.id),
  },
  (t) => [primaryKey({ columns: [t.stageId, t.collegeId] })],
);
export const sources = pgTable(
  "stage_sources",
  {
    stageId: text("stage_id").notNull(),
    noticeId: text("notice_id").notNull(),
    competitionId: text("competition_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.stageId, t.noticeId] }),
    foreignKey({
      columns: [t.stageId, t.competitionId],
      foreignColumns: [stages.id, stages.competitionId],
    }),
    foreignKey({
      columns: [t.noticeId, t.competitionId],
      foreignColumns: [notices.id, notices.competitionId],
    }),
  ],
);
