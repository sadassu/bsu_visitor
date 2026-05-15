import db from "./database.js";

db.prepare(
  `
CREATE TABLE IF NOT EXISTS beacons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL,
    major INTEGER,
    minor INTEGER,
    device_name TEXT,

    office_id INTEGER,
    x REAL,
    y REAL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (office_id) REFERENCES offices(id)
)
`,
).run();
