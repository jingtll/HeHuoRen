import { Injectable, NotFoundException } from "@nestjs/common";
import { asc } from "drizzle-orm";
import { DatabaseService } from "../database/database.service.js";
import { colleges } from "../database/schema.js";
import { readCatalog } from "./catalog.js";
import { registrationStatus } from "./time.js";
import { parseListQuery } from "./query.js";
import type {
  CollegeDto,
  CompetitionDetailDto,
  CompetitionListDto,
} from "./competition.dto.js";

@Injectable()
export class CompetitionClock {
  now() {
    return new Date();
  }
}
@Injectable()
export class CompetitionService {
  constructor(
    private readonly database: DatabaseService,
    private readonly clock: CompetitionClock,
  ) {}
  async colleges(): Promise<CollegeDto[]> {
    return this.database.db
      .select()
      .from(colleges)
      .orderBy(asc(colleges.order));
  }
  async list(url: string): Promise<CompetitionListDto> {
    const client = await this.database.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const directory = await client.query(
        "SELECT id FROM colleges ORDER BY display_order",
      );
      const query = parseListQuery(
        url,
        directory.rows.map((c) => c.id),
      );
      const now = this.clock.now().toISOString();
      // EXISTS / correlated aggregates avoid multiplicative relationship JOINs.
      const result = await client.query(
        `
    WITH candidates AS (
      SELECT c.id AS competition_id,c.data AS competition,s.id AS stage_id,s.display_order,
       s.data || jsonb_build_object(
        'hosts',COALESCE((SELECT jsonb_agg(h.college_id ORDER BY d.display_order) FROM stage_hosts h JOIN colleges d ON d.id=h.college_id WHERE h.stage_id=s.id),'[]'::jsonb),
        'scope',(s.data->'scope') || jsonb_build_object('colleges',COALESCE((SELECT jsonb_agg(e.college_id ORDER BY d.display_order) FROM stage_eligibility e JOIN colleges d ON d.id=e.college_id WHERE e.stage_id=s.id),'[]'::jsonb)),
        'status', CASE
         WHEN (s.data->>'conflict')::boolean THEN 'conflict'
         WHEN s.registration_end IS NOT NULL AND $1::timestamptz >= s.registration_end THEN 'closed'
         WHEN s.registration_end_date IS NOT NULL AND ($1::timestamptz AT TIME ZONE 'Asia/Shanghai')::date > s.registration_end_date THEN 'closed'
         WHEN s.registration_start IS NULL OR s.registration_end IS NULL THEN 'unknown'
         WHEN $1::timestamptz < s.registration_start THEN 'upcoming'
         ELSE 'open' END
       ) AS stage,
       (SELECT max(n.published_at) FROM notices n WHERE n.competition_id=c.id) AS latest
      FROM stages s JOIN competitions c ON c.id=s.competition_id
      WHERE c.publication='published'
       AND ($2::text[] IS NULL OR EXISTS(SELECT 1 FROM stage_hosts h WHERE h.stage_id=s.id AND h.college_id=ANY($2::text[])))
       AND ($3='' OR strpos(lower(concat_ws(' ',c.data->>'name',c.data->>'edition',s.data->>'name',c.data->>'organizer')),lower($3))>0)
    ), filtered AS (SELECT * FROM candidates WHERE $4='' OR stage->>'status'=$4),
    totals AS (SELECT count(*)::int AS stages,count(DISTINCT competition_id)::int AS competitions FROM filtered),
    pagination AS (SELECT *,greatest(1,ceil(stages::numeric/$5)::int) AS pages FROM totals),
    bounds AS (SELECT *,least($6::bigint,pages)::int AS page FROM pagination),
    paged AS (SELECT f.* FROM filtered f ORDER BY latest DESC NULLS LAST,competition_id COLLATE "C",display_order,stage_id COLLATE "C" LIMIT $5 OFFSET (SELECT (page-1)::bigint*$5 FROM bounds))
    SELECT b.*,COALESCE((SELECT jsonb_agg(jsonb_build_object('competition',p.competition,'stage',jsonb_build_object(
      'id',p.stage->'id','name',p.stage->'name','hosts',p.stage->'hosts','scope',p.stage->'scope',
      'deadline',p.stage->'deadline','materialsAt',p.stage->'materialsAt','conflict',p.stage->'conflict','status',p.stage->'status'
    )) ORDER BY p.latest DESC NULLS LAST,p.competition_id COLLATE "C",p.display_order,p.stage_id COLLATE "C") FROM paged p),'[]'::jsonb) AS items FROM bounds b
   `,
        [
          now,
          query.hosts === "all" ? null : query.hosts,
          query.q,
          query.status,
          query.pageSize,
          query.page,
        ],
      );
      await client.query("COMMIT");
      const row = result.rows[0];
      return {
        items: row.items,
        page: row.page,
        pageSize: query.pageSize,
        hasMore: row.page < row.pages,
        totalStages: row.stages,
        totalCompetitions: row.competitions,
        totalPages: row.pages,
        evaluatedAt: now,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async detail(id: string): Promise<CompetitionDetailDto> {
    const client = await this.database.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const now = this.clock.now();
      const { competitions } = await readCatalog(client);
      const record = competitions.find(
        (c) => c.id === id && c.publication === "published",
      );
      if (!record) throw new NotFoundException();
      const { publication, ...detail } = record;
      void publication;
      detail.stages = detail.stages.map((s) => ({
        ...s,
        status: registrationStatus(s, now),
      }));
      await client.query("COMMIT");
      return { ...detail, evaluatedAt: now.toISOString() };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
