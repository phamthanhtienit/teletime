import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/asyncHandler";
import { AppError } from "@/middleware/errorHandler";

export const shiftsRouter = Router();

shiftsRouter.use(requireAuth);

// Danh muc ca lam viec: Agent chi thay ca dang bat (isActive) de chon dang ky,
// Admin thay toan bo (ca ca da tat) de quan ly
shiftsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const isAdmin = req.user!.role === "ADMIN";
    const shifts = await prisma.shift.findMany({
      where: isAdmin ? undefined : { isActive: true },
      orderBy: { startTime: "asc" },
    });
    res.json(shifts);
  })
);

const createShiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Dinh dang gio HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Dinh dang gio HH:mm"),
});

// Admin: tao ca lam viec moi (VD: Ca sang 08:00-12:00)
shiftsRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = createShiftSchema.parse(req.body);
    const shift = await prisma.shift.create({ data });
    res.status(201).json(shift);
  })
);

const updateShiftSchema = z.object({
  name: z.string().min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Dinh dang gio HH:mm").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Dinh dang gio HH:mm").optional(),
  isActive: z.boolean().optional(),
});

// Admin: sua thong tin ca lam (ten, gio, bat/tat)
shiftsRouter.patch(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = updateShiftSchema.parse(req.body);

    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });
    if (!shift) throw new AppError("Khong tim thay ca lam", 404);

    const updated = await prisma.shift.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

// Admin: xoa han 1 ca lam (se xoa luon cac dang ky ca lien quan)
shiftsRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });
    if (!shift) throw new AppError("Khong tim thay ca lam", 404);

    await prisma.shift.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const registerSchema = z.object({
  shiftId: z.string().uuid(),
  date: z.string(), // "YYYY-MM-DD"
});

// Agent: tu dang ky ca lam cho 1 ngay cu the (cho Admin duyet)
shiftsRouter.post(
  "/registrations",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const registration = await prisma.shiftRegistration.create({
      data: {
        userId: req.user!.sub,
        shiftId: data.shiftId,
        date: new Date(data.date),
      },
    });

    res.status(201).json(registration);
  })
);

// Agent: xem cac lan dang ky ca cua chinh minh; Admin: xem tat ca (loc theo status)
shiftsRouter.get(
  "/registrations",
  asyncHandler(async (req, res) => {
    const isAdmin = req.user!.role === "ADMIN";
    const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;

    const registrations = await prisma.shiftRegistration.findMany({
      where: {
        userId: isAdmin ? undefined : req.user!.sub,
        status: statusFilter as any,
      },
      include: {
        shift: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    res.json(registrations);
  })
);

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

// Admin: duyet hoac tu choi 1 dang ky ca
shiftsRouter.patch(
  "/registrations/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { status } = reviewSchema.parse(req.body);

    const registration = await prisma.shiftRegistration.findUnique({ where: { id: req.params.id } });
    if (!registration) throw new AppError("Khong tim thay dang ky ca", 404);

    const updated = await prisma.shiftRegistration.update({
      where: { id: req.params.id },
      data: { status, reviewedById: req.user!.sub, reviewedAt: new Date() },
    });

    res.json(updated);
  })
);
