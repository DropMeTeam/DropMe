import { describe, it, expect, vi, beforeAll } from "vitest";
import express from "express";
import request from "supertest";

const listPendingBusRegistrations = vi.fn((req, res) =>
  res.json({ ok: true, type: "pending" })
);
const listApprovedBusRegistrations = vi.fn((req, res) =>
  res.json({ ok: true, type: "approved" })
);
const approveBus = vi.fn((req, res) =>
  res.json({ ok: true, action: "approved", id: req.params.id })
);
const rejectBus = vi.fn((req, res) =>
  res.json({ ok: true, action: "rejected", id: req.params.id })
);

vi.mock("../middleware/auth.js", () => {
  return {
    requireAuth: (req, res, next) => {
      const userId = req.header("x-user-id");
      const role = req.header("x-user-role");

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user = { sub: userId, id: userId, role };
      next();
    },
    requireRole:
      (...roles) =>
      (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }
        next();
      },
  };
});

vi.mock("../controllers/busApprovals.controller.js", () => {
  return {
    listPendingBusRegistrations,
    listApprovedBusRegistrations,
    approveBus,
    rejectBus,
  };
});

let busApprovalsRouter;
let app;

describe("bus admin approvals route integration", () => {
  beforeAll(async () => {
    ({ busApprovalsRouter } = await import("../routes/busApprovals.routes.js"));

    app = express();
    app.use(express.json());
    app.use("/api/admin", busApprovalsRouter);
  });

  it("allows ADMIN_BUS to view pending registrations", async () => {
    const res = await request(app)
      .get("/api/admin/bus-registrations/pending")
      .set("x-user-id", "admin-1")
      .set("x-user-role", "ADMIN_BUS");

    expect(res.status).toBe(200);
    expect(res.body.type).toBe("pending");
  });

  it("blocks non ADMIN_BUS from pending list", async () => {
    const res = await request(app)
      .get("/api/admin/bus-registrations/pending")
      .set("x-user-id", "user-1")
      .set("x-user-role", "BUS_OWNER");

    expect(res.status).toBe(403);
  });

  it("allows ADMIN_BUS to approve bus", async () => {
    const res = await request(app)
      .post("/api/admin/bus-registrations/abc123/approve")
      .set("x-user-id", "admin-1")
      .set("x-user-role", "ADMIN_BUS");

    expect(res.status).toBe(200);
    expect(res.body.action).toBe("approved");
    expect(res.body.id).toBe("abc123");
  });

  it("allows ADMIN_BUS to reject bus", async () => {
    const res = await request(app)
      .post("/api/admin/bus-registrations/abc123/reject")
      .set("x-user-id", "admin-1")
      .set("x-user-role", "ADMIN_BUS");

    expect(res.status).toBe(200);
    expect(res.body.action).toBe("rejected");
    expect(res.body.id).toBe("abc123");
  });
});