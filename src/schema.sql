BEGIN;
CREATE TABLE courses (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE materials (
 id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id),
 path TEXT NOT NULL, sha256 TEXT NOT NULL, content TEXT NOT NULL
);
CREATE TABLE items (
 id TEXT PRIMARY KEY, material_id TEXT NOT NULL REFERENCES materials(id),
 topic TEXT NOT NULL, prompt TEXT NOT NULL, answer TEXT NOT NULL,
 quote TEXT NOT NULL, key_origin TEXT NOT NULL CHECK(key_origin IN ('ai_generated','human_reviewed'))
);
CREATE TABLE attempts (
 id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES items(id),
 response TEXT NOT NULL, correct INTEGER NOT NULL CHECK(correct IN (0,1)),
 evidence TEXT NOT NULL CHECK(evidence = 'answer_key_match'),
 grader_version TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX attempts_item ON attempts(item_id);
CREATE TABLE reviews (
 item_id TEXT PRIMARY KEY REFERENCES items(id),
 streak INTEGER NOT NULL CHECK(streak >= 0), due_at TEXT NOT NULL
);
CREATE TABLE requests (
 id TEXT PRIMARY KEY, operation TEXT NOT NULL, payload TEXT NOT NULL, result TEXT NOT NULL
);
PRAGMA user_version = 1;
COMMIT;
