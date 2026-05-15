import db from "../database/database.js";

class Beacon {
  static create({ uuid, major, minor, device_name, office_id, x, y }) {
    const stmt = db.prepare(`
      INSERT INTO beacons (uuid, major, minor, device_name, office_id, x, y)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(uuid, major, minor, device_name, office_id, x, y);

    return result.lastInsertRowid;
  }

  static findAll() {
    return db.prepare(`SELECT * FROM beacons`).all();
  }

  static findById(id) {
    return db.prepare(`SELECT * FROM beacons WHERE id = ?`).get(id);
  }

  static findByIdentity(uuid, major, minor) {
    return db
      .prepare(
        `
      SELECT * FROM beacons
      WHERE uuid = ? AND major = ? AND minor = ?
    `,
      )
      .get(uuid, major, minor);
  }

  static update(id, { uuid, major, minor, device_name, office_id, x, y }) {
    return db
      .prepare(
        `
      UPDATE beacons
      SET uuid=?, major=?, minor=?, device_name=?, office_id=?, x=?, y=?
      WHERE id=?
    `,
      )
      .run(uuid, major, minor, device_name, office_id, x, y, id);
  }

  static delete(id) {
    return db.prepare(`DELETE FROM beacons WHERE id = ?`).run(id);
  }
}

export default Beacon;
