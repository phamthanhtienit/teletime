import express from "express";
import cors from "cors";
import { env } from "@/config/env";
import { authRouter } from "@/modules/auth/auth.routes";
import { usersRouter } from "@/modules/users/users.routes";
import { officeRouter } from "@/modules/office/office.routes";
import { attendanceRouter } from "@/modules/attendance/attendance.routes";
import { shiftsRouter } from "@/modules/shifts/shifts.routes";
import { leaveRouter } from "@/modules/leave/leave.routes";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";
 
export const app = express();
 
// Neu chi cau hinh "*" thi cho phep tat ca (dev); nguoc lai chi cho phep danh sach domain that
const corsOrigin =
  env.corsOrigin.length === 1 && env.corsOrigin[0] === "*" ? "*" : env.corsOrigin;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
 
app.get("/health", (_req, res) => res.json({ ok: true, service: "teletime-backend" }));
 
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/office", officeRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/shifts", shiftsRouter);
app.use("/api/leave-requests", leaveRouter);
 
app.use(notFoundHandler);
app.use(errorHandler);
 