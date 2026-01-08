CREATE TABLE IF NOT EXISTS company (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS field (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS skill (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS location (
  id SERIAL PRIMARY KEY,
  continent TEXT,
  country TEXT,
  city TEXT,
  UNIQUE (continent, country, city)
);

CREATE TABLE IF NOT EXISTS university (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS course (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE,
  description TEXT,
  company_id INT NOT NULL REFERENCES company(id) ON DELETE RESTRICT
);

-- 1 Job : N Data sources
CREATE TABLE IF NOT EXISTS data_source (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT,
  job_id INT NOT NULL REFERENCES job(id) ON DELETE CASCADE
);

-- M:N Job <-> Field
CREATE TABLE IF NOT EXISTS job_field (
  field_id INT NOT NULL REFERENCES field(id) ON DELETE CASCADE,
  job_id   INT NOT NULL REFERENCES job(id) ON DELETE CASCADE,
  PRIMARY KEY (field_id, job_id)
);

-- M:N Job <-> Skill
CREATE TABLE IF NOT EXISTS job_skills (
  job_id   INT NOT NULL REFERENCES job(id) ON DELETE CASCADE,
  skill_id INT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, skill_id)
);

-- M:N Course <-> Skill
CREATE TABLE IF NOT EXISTS course_skills (
  skill_id  INT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, course_id)
);

-- M:N University <-> Course
CREATE TABLE IF NOT EXISTS university_course (
  university_id INT NOT NULL REFERENCES university(id) ON DELETE CASCADE,
  course_id     INT NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  PRIMARY KEY (university_id, course_id)
);

-- M:N Job <-> Location
CREATE TABLE IF NOT EXISTS job_location (
  job_id      INT NOT NULL REFERENCES job(id) ON DELETE CASCADE,
  location_id INT NOT NULL REFERENCES location(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, location_id)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_job_company_id ON job(company_id);
CREATE INDEX IF NOT EXISTS idx_data_source_job_id ON data_source(job_id);
CREATE INDEX IF NOT EXISTS idx_job_location_location_id ON job_location(location_id);
