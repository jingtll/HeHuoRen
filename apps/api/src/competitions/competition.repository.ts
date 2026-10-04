import { parseListQuery } from "./query.js";
import type { EditionRecord } from "./competition.model.js";
import { Injectable } from "@nestjs/common";
import { asc, sql, and, eq, inArray } from "drizzle-orm";
import { DatabaseService } from "../database/database.service.js";
import * as tables from "../database/schema.js";
const { colleges } = tables;
import type { CompetitionPage, EntryRecord } from "./competition.model.js";
interface ListRow extends Record<string, unknown> {
  items: EntryRecord[];
  page: number;
  pages: number;
  stages: number;
  competitions: number;
}
@Injectable()
export class CompetitionRepository {
  constructor(private readonly database: DatabaseService) {}
  colleges() {
    return this.database.db
      .select()
      .from(colleges)
      .orderBy(asc(colleges.order));
  }
  async list(url: string, now: Date): Promise<CompetitionPage> {
    return this.database.db.transaction(
      async (tx) => {
        const directory = await tx
          .select({ id: colleges.id })
          .from(colleges)
          .orderBy(asc(colleges.order));
        const query = parseListQuery(
          url,
          directory.map((c) => c.id),
        );
        const evaluatedAt = now.toISOString();
        const parameters = [
          evaluatedAt,
          query.hosts === "all" ? null : query.hosts,
          query.q,
          query.status,
          query.pageSize,
          query.page,
        ];
        const statement = sql`WITH candidates AS (
      SELECT c.id AS competition_id,c.data AS competition,s.id AS stage_id,s.display_order,
       s.data || jsonb_build_object(
        'hosts',COALESCE((SELECT jsonb_agg(h.college_id ORDER BY d.display_order) FROM stage_hosts h JOIN colleges d ON d.id=h.college_id WHERE h.stage_id=s.id),'[]'::jsonb),
        'scope',(s.data->'scope') || jsonb_build_object('colleges',COALESCE((SELECT jsonb_agg(e.college_id ORDER BY d.display_order) FROM stage_eligibility e JOIN colleges d ON d.id=e.college_id WHERE e.stage_id=s.id),'[]'::jsonb)),
        'status', CASE
         WHEN (s.data->>'conflict')::boolean THEN 'conflict'
         WHEN s.registration_end IS NOT NULL AND ${sql.param(parameters[0])}::timestamptz >= s.registration_end THEN 'closed'
         WHEN s.registration_end_date IS NOT NULL AND (${sql.param(parameters[0])}::timestamptz AT TIME ZONE 'Asia/Shanghai')::date > s.registration_end_date THEN 'closed'
         WHEN s.registration_start IS NULL OR s.registration_end IS NULL THEN 'unknown'
         WHEN ${sql.param(parameters[0])}::timestamptz < s.registration_start THEN 'upcoming'
         ELSE 'open' END
       ) AS stage,
       (SELECT max(n.published_at) FROM notices n WHERE n.competition_id=c.id) AS latest
      FROM stages s JOIN competitions c ON c.id=s.competition_id
      WHERE c.publication='published'
       AND (${sql.param(parameters[1])}::text[] IS NULL OR EXISTS(SELECT 1 FROM stage_hosts h WHERE h.stage_id=s.id AND h.college_id=ANY(${sql.param(parameters[1])}::text[])))
       AND (${sql.param(parameters[2])}='' OR strpos(lower(concat_ws(' ',c.data->>'name',c.data->>'edition',s.data->>'name',c.data->>'organizer')),lower(${sql.param(parameters[2])}))>0)
    ), filtered AS (SELECT * FROM candidates WHERE ${sql.param(parameters[3])}='' OR stage->>'status'=${sql.param(parameters[3])}),
    totals AS (SELECT count(*)::int AS stages,count(DISTINCT competition_id)::int AS competitions FROM filtered),
    pagination AS (SELECT *,greatest(1,ceil(stages::numeric/${sql.param(parameters[4])})::int) AS pages FROM totals),
    bounds AS (SELECT *,least(${sql.param(parameters[5])}::bigint,pages)::int AS page FROM pagination),
    paged AS (SELECT f.* FROM filtered f ORDER BY latest DESC NULLS LAST,competition_id COLLATE "C",display_order,stage_id COLLATE "C" LIMIT ${sql.param(parameters[4])} OFFSET (SELECT (page-1)::bigint*${sql.param(parameters[4])} FROM bounds))
    SELECT b.*,COALESCE((SELECT jsonb_agg(jsonb_build_object('competition',p.competition,'stage',jsonb_build_object(
      'id',p.stage->'id','name',p.stage->'name','hosts',p.stage->'hosts','scope',p.stage->'scope',
      'deadline',p.stage->'deadline','materialsAt',p.stage->'materialsAt','conflict',p.stage->'conflict','status',p.stage->'status'
    )) ORDER BY p.latest DESC NULLS LAST,p.competition_id COLLATE "C",p.display_order,p.stage_id COLLATE "C") FROM paged p),'[]'::jsonb) AS items FROM bounds b
   `;
        const result = await tx.execute<ListRow>(statement);
        const row = result.rows[0];
        return {
          items: row.items,
          page: row.page,
          pageSize: query.pageSize,
          hasMore: row.page < row.pages,
          totalStages: row.stages,
          totalCompetitions: row.competitions,
          totalPages: row.pages,
          evaluatedAt,
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    );
  }
  async detail(id: string): Promise<EditionRecord | undefined> {
    return this.database.db.transaction(
      async (tx) => {
        const [edition] = await tx
          .select()
          .from(tables.competitions)
          .where(
            and(
              eq(tables.competitions.id, id),
              eq(tables.competitions.publication, "published"),
            ),
          );
        if (!edition) return undefined;
        const stages = await tx
          .select()
          .from(tables.stages)
          .where(eq(tables.stages.competitionId, id))
          .orderBy(asc(tables.stages.order), asc(tables.stages.id));
        const tracks = await tx
          .select()
          .from(tables.tracks)
          .where(eq(tables.tracks.competitionId, id))
          .orderBy(asc(tables.tracks.id));
        const notices = await tx
          .select()
          .from(tables.notices)
          .where(eq(tables.notices.competitionId, id));
        const stageIds = stages.map((s) => s.id);
        const hosts = await tx
          .select()
          .from(tables.hosts)
          .where(inArray(tables.hosts.stageId, stageIds))
          .orderBy(asc(tables.hosts.collegeId));
        const eligible = await tx
          .select()
          .from(tables.eligibility)
          .where(inArray(tables.eligibility.stageId, stageIds))
          .orderBy(asc(tables.eligibility.collegeId));
        const sources = await tx
          .select()
          .from(tables.sources)
          .where(eq(tables.sources.competitionId, id))
          .orderBy(asc(tables.sources.noticeId));
        return {
          ...edition.data,
          publication: "published",
          tracks: tracks.map((t) => t.data),
          notices: notices.map((n) => n.data),
          stages: stages.map((s) => ({
            ...s.data,
            hosts: hosts
              .filter((h) => h.stageId === s.id)
              .map((h) => h.collegeId),
            scope: {
              ...s.data.scope,
              colleges: eligible
                .filter((e) => e.stageId === s.id)
                .map((e) => e.collegeId),
            },
            sourceIds: sources
              .filter((n) => n.stageId === s.id)
              .map((n) => n.noticeId),
          })),
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    );
  }
}
