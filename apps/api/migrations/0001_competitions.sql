CREATE TABLE colleges (id text PRIMARY KEY, name text NOT NULL, display_order integer NOT NULL UNIQUE);
CREATE TABLE competitions (id text PRIMARY KEY, data jsonb NOT NULL, publication text NOT NULL DEFAULT 'draft' CHECK (publication IN ('draft','published','hidden')));
CREATE TABLE stages (
 id text PRIMARY KEY, competition_id text NOT NULL REFERENCES competitions(id), data jsonb NOT NULL, display_order integer NOT NULL,
 registration_start timestamptz, registration_end timestamptz, registration_start_date date, registration_end_date date,
 UNIQUE (id, competition_id),
 CHECK (registration_start IS NULL OR registration_start_date IS NULL),
 CHECK (registration_end IS NULL OR registration_end_date IS NULL)
);
CREATE TABLE tracks (id text PRIMARY KEY, competition_id text NOT NULL REFERENCES competitions(id), data jsonb NOT NULL);
CREATE TABLE notices (id text PRIMARY KEY, competition_id text NOT NULL REFERENCES competitions(id), data jsonb NOT NULL, published_at date, checked_at date, UNIQUE (id, competition_id));
CREATE TABLE stage_hosts (stage_id text NOT NULL REFERENCES stages(id), college_id text NOT NULL REFERENCES colleges(id), PRIMARY KEY (stage_id,college_id));
CREATE TABLE stage_eligibility (stage_id text NOT NULL REFERENCES stages(id), college_id text NOT NULL REFERENCES colleges(id), PRIMARY KEY (stage_id,college_id));
CREATE TABLE stage_sources (
 stage_id text NOT NULL, notice_id text NOT NULL, competition_id text NOT NULL, PRIMARY KEY (stage_id,notice_id),
 FOREIGN KEY (stage_id,competition_id) REFERENCES stages(id,competition_id),
 FOREIGN KEY (notice_id,competition_id) REFERENCES notices(id,competition_id)
);
CREATE INDEX stages_competition ON stages(competition_id,display_order,id);
CREATE INDEX notices_competition ON notices(competition_id,published_at DESC);
CREATE INDEX hosts_college ON stage_hosts(college_id,stage_id);
