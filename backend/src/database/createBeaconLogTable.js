import db from "./database.js";

db.prepare(
  `
CREATE TABLE IF NOT EXISTS beacon_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beacon_id INTEGER NOT NULL,
    device_id TEXT,
    rssi INTEGER,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (beacon_id) REFERENCES beacons(id)
)
`,
).run();
