import Beacon from "../models/Beacon.js";

class BeaconController {
  /**
   * CREATE Beacon
   */
  static create(req, res) {
    try {
      const { uuid, major, minor, device_name, office_id, x, y } = req.body;

      // Basic validation
      if (!uuid || x === undefined || y === undefined) {
        return res.status(400).json({
          message: "uuid, x, and y are required",
        });
      }

      const id = Beacon.create({
        uuid,
        major,
        minor,
        device_name,
        office_id,
        x,
        y,
      });

      return res.status(201).json({
        message: "Beacon created successfully",
        id,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error creating beacon",
        error: error.message,
      });
    }
  }

  /**
   * GET All Beacons
   */
  static getAll(req, res) {
    try {
      const beacons = Beacon.findAll();

      return res.json(beacons);
    } catch (error) {
      return res.status(500).json({
        message: "Error fetching beacons",
        error: error.message,
      });
    }
  }

  /**
   * GET Beacon by ID
   */
  static getById(req, res) {
    try {
      const { id } = req.params;

      const beacon = Beacon.findById(id);

      if (!beacon) {
        return res.status(404).json({
          message: "Beacon not found",
        });
      }

      return res.json(beacon);
    } catch (error) {
      return res.status(500).json({
        message: "Error fetching beacon",
        error: error.message,
      });
    }
  }

  /**
   * GET by BLE Identity (for ESP32 / scanner)
   */
  static getByIdentity(req, res) {
    try {
      const { uuid, major, minor } = req.query;

      if (!uuid) {
        return res.status(400).json({
          message: "uuid is required",
        });
      }

      const beacon = Beacon.findByIdentity(uuid, major, minor);

      if (!beacon) {
        return res.status(404).json({
          message: "Beacon not found",
        });
      }

      return res.json(beacon);
    } catch (error) {
      return res.status(500).json({
        message: "Error fetching beacon",
        error: error.message,
      });
    }
  }

  /**
   * UPDATE Beacon
   */
  static update(req, res) {
    try {
      const { id } = req.params;
      const { uuid, major, minor, device_name, office_id, x, y } = req.body;

      const existing = Beacon.findById(id);

      if (!existing) {
        return res.status(404).json({
          message: "Beacon not found",
        });
      }

      Beacon.update(id, {
        uuid,
        major,
        minor,
        device_name,
        office_id,
        x,
        y,
      });

      return res.json({
        message: "Beacon updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error updating beacon",
        error: error.message,
      });
    }
  }

  /**
   * DELETE Beacon
   */
  static delete(req, res) {
    try {
      const { id } = req.params;

      const existing = Beacon.findById(id);

      if (!existing) {
        return res.status(404).json({
          message: "Beacon not found",
        });
      }

      Beacon.delete(id);

      return res.json({
        message: "Beacon deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error deleting beacon",
        error: error.message,
      });
    }
  }
}

export default BeaconController;
