import type { PoolClient } from "pg";
import type {
  CollegeDto,
  CompetitionDetailDto,
  StageDto,
} from "./competition.dto.js";
export type Publication = "draft" | "published" | "hidden";
export type RecordData = Omit<CompetitionDetailDto, "evaluatedAt"> & {
  publication: Publication;
};
export async function readCatalog(
  client: PoolClient,
): Promise<{ colleges: CollegeDto[]; competitions: RecordData[] }> {
  const directory = await client.query(
    'SELECT id,name,display_order AS "order" FROM colleges ORDER BY display_order',
  );
  const editions = await client.query(
    "SELECT id,data,publication FROM competitions",
  );
  const stages = await client.query(
    "SELECT competition_id AS parent,data FROM stages ORDER BY display_order,id",
  );
  const tracks = await client.query(
    "SELECT competition_id AS parent,data FROM tracks ORDER BY id",
  );
  const notices = await client.query(
    "SELECT competition_id AS parent,data FROM notices ORDER BY published_at DESC NULLS LAST,id",
  );
  const hosts = await client.query(
    "SELECT stage_id AS parent,college_id AS id FROM stage_hosts ORDER BY college_id",
  );
  const eligible = await client.query(
    "SELECT stage_id AS parent,college_id AS id FROM stage_eligibility ORDER BY college_id",
  );
  const sources = await client.query(
    "SELECT stage_id AS parent,notice_id AS id FROM stage_sources ORDER BY notice_id",
  );
  return {
    colleges: directory.rows,
    competitions: editions.rows.map((edition) => ({
      ...edition.data,
      publication: edition.publication,
      stages: stages.rows
        .filter((r) => r.parent === edition.id)
        .map(
          (r) =>
            ({
              ...r.data,
              hosts: hosts.rows
                .filter((h) => h.parent === r.data.id)
                .map((h) => h.id),
              scope: {
                ...r.data.scope,
                colleges: eligible.rows
                  .filter((h) => h.parent === r.data.id)
                  .map((h) => h.id),
              },
              sourceIds: sources.rows
                .filter((h) => h.parent === r.data.id)
                .map((h) => h.id),
              status: "unknown",
            }) as StageDto,
        ),
      tracks: tracks.rows
        .filter((r) => r.parent === edition.id)
        .map((r) => r.data),
      notices: notices.rows
        .filter((r) => r.parent === edition.id)
        .map((r) => r.data),
    })),
  };
}
