import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/asyncHandler";
import { AppError } from "@/middleware/errorHandler";

export const leaveRouter = Router();

leaveRouter.use(requireAuth);

const createLeaveSchema = z.object({
  startDate: z.string(), // "YYYY-MM-DD"
  endDate: z.string(),
  reason: z.string().min(1),
});

// Agent: xin nghi phep
leaveRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createLeaveSchema.parse(req.body);

    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new AppError("Ngay ket thuc phai sau ngay bat dau", 400);
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: req.user!.sub,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
      },
    });

    res.status(201).json(leave);
  })
);

// Agent: xem don nghi phep cua chinh minh; Admin: xem tat ca (loc theo status
// va/hoac khoang ngay ?from=&to= - lay nhung don CO GIAO voi khoang ngay do,
// dung cho bao cao)
leaveRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const isAdmin = req.user!.role === "ADMIN";
    const { status, from, to } = req.query;
    const statusFilter = typeof status === "string" ? status : undefined;

    const rangeFilter: any = {};
    if (typeof from === "string") rangeFilter.endDate = { gte: new Date(from) };
    if (typeof to === "string") rangeFilter.startDate = { lte: new Date(to) };

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        userId: isAdmin ? undefined : req.user!.sub,
        status: statusFilter as any,
        ...rangeFilter,
      },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    res.json(leaves);
  })
);

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

// Admin: duyet hoac tu choi don nghi phep
leaveRouter.patch(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { status } = reviewSchema.parse(req.body);

    const leave = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    if (!leave) throw new AppError("Khong tim thay don nghi phep", 404);

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status, reviewedById: req.user!.sub, reviewedAt: new Date() },
    });

    res.json(updated);
  })
);
