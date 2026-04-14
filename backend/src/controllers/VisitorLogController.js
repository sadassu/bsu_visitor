import Visitor from "../models/Visitor.js";
import VisitorLink from "../models/VisitorLink.js";
import VisitLog from "../models/VisitLog.js";

class VisitorLogController {
  static register(req, res) {
    try {
      const {
        visitor_id,
        fullname,
        contact_number,
        address,
        id_type,
        img,
        office_id,
        purpose,
      } = req.body;

      if (!office_id) {
        return res.status(400).json({ error: "office_id is required" });
      }

      let visitor = null;

      if (visitor_id) {
        visitor = Visitor.findById(visitor_id);
      }

      if (!visitor && contact_number) {
        visitor = Visitor.findByContactNumber(contact_number);
      }

      if (!visitor && fullname) {
        visitor = Visitor.findByFullname(fullname);
      }

      if (!visitor) {
        if (!fullname || !contact_number || !address) {
          return res.status(400).json({
            error: "fullname, contact_number, and address are required for a new visitor",
          });
        }

        const newVisitorId = Visitor.create({
          fullname,
          contact_number,
          address,
          id_type,
          img,
        });

        visitor = Visitor.findById(newVisitorId);
      }

      if (!visitor) {
        return res.status(404).json({ error: "Visitor not found" });
      }

      const logId = VisitLog.create({
        visitor_id: visitor.id,
        office_id,
        purpose,
        logged_by: req.user?.id || null,
      });

      const token = VisitorLink.create(visitor.id, office_id);
      const origin = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
      const link = `${origin}/visitor-access/${token}`;

      res.status(201).json({
        visitor,
        logId,
        link,
        expires_in_seconds: 3600,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static create(req, res) {
    try {
      const { visitor_id, office_id, purpose } = req.body;
      const logged_by = req.user?.id || req.body.logged_by || null;

      if (!visitor_id || !office_id) {
        return res.status(400).json({ error: "visitor_id and office_id are required" });
      }

      const logId = VisitLog.create({ visitor_id, office_id, purpose, logged_by });

      res.status(201).json({ message: "Visitor log created successfully", logId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getAll(req, res) {
    try {
      const { visitor_id, office_id, active, visitor_name, start_date, end_date, page = 1, per_page = 20 } = req.query;
      const pageNumber = Number(page) || 1;
      const perPage = Number(per_page) || 20;
      const offset = (pageNumber - 1) * perPage;

      if (active === "true" || active === "1") {
        return res.json(VisitLog.findActiveVisits());
      }

      if (visitor_id) {
        return res.json(VisitLog.findByVisitorId(visitor_id));
      }

      if (office_id) {
        return res.json(VisitLog.findByOfficeId(office_id));
      }

      const { rows, total } = VisitLog.findLogs({
        visitorName: visitor_name,
        startDate: start_date,
        endDate: end_date,
        limit: perPage,
        offset,
      });

      res.json({
        logs: rows,
        total,
        page: pageNumber,
        per_page: perPage,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static getById(req, res) {
    try {
      const { id } = req.params;
      const log = VisitLog.findById(id);

      if (!log) {
        return res.status(404).json({ error: "Visitor log not found" });
      }

      res.json(log);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static update(req, res) {
    try {
      const { id } = req.params;
      const { visitor_id, office_id, purpose, time_out } = req.body;

      const log = VisitLog.findById(id);
      if (!log) {
        return res.status(404).json({ error: "Visitor log not found" });
      }

      const success = VisitLog.update(id, {
        visitor_id: visitor_id || log.visitor_id,
        office_id: office_id || log.office_id,
        purpose: purpose !== undefined ? purpose : log.purpose,
        logged_by: log.logged_by,
      });

      if (!success) {
        return res.status(400).json({ error: "Unable to update visitor log" });
      }

      if (time_out !== undefined) {
        VisitLog.updateTimeOut(id, time_out);
      }

      res.json({ message: "Visitor log updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static delete(req, res) {
    try {
      const { id } = req.params;
      const log = VisitLog.findById(id);

      if (!log) {
        return res.status(404).json({ error: "Visitor log not found" });
      }

      const success = VisitLog.delete(id);
      if (!success) {
        return res.status(400).json({ error: "Unable to delete visitor log" });
      }

      res.json({ message: "Visitor log deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default VisitorLogController;
