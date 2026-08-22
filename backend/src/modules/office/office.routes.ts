import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/asyncHandler";

export const officeRouter = Router();

officeRouter.use(requireAuth);

// Ai dang nhap cung xem duoc cau hinh van phong (de app biet toa do/ban kinh cho phep cham cong)
officeRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const setting = await prisma.officeSetting.findFirst();
    res.json(setting);
  })
);

const upsertSchema = z.object({
  name: z.string().min(1).default("Van phong chinh"),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number().int().positive().default(150),
  allowedIps: z.array(z.string()).default([]),
});

// Admin: tao/cap nhat cau hinh van phong (toa do GPS + danh sach IP WiFi cong ty)
officeRouter.put(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const existing = await prisma.officeSetting.findFirst();

    const setting = existing
      ? await prisma.officeSetting.update({ where: { id: existing.id }, data })
      : await prisma.officeSetting.create({ data });

    res.json(setting);
  })
);
