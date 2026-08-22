import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/asyncHandler";
import { AppError } from "@/middleware/errorHandler";
import { distanceInMeters, getClientIp } from "@/utils/geo";

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

/**
 * Xac thuc Agent dang o van phong: bat buoc GPS trong ban kinh cho phep,
 * VA (khi da cau hinh danh sach IP) IP public cua request phai nam trong
 * danh sach IP WiFi cong ty. Day chinh la co che "WiFi + GPS" ket hop:
 * dung IP thay vi doc SSID de tuong thich voi Expo (khong can quyen native).
 */
async function verifyAtOffice(clientIp: string, latitude: number, longitude: number) {
  const office = await prisma.officeSetting.findFirst();
  if (!office) {
    throw new AppError("Admin chua cau hinh vi tri van phong, khong the cham cong", 400);
  }

  const distance = distanceInMeters(office.latitude, office.longitude, latitude, longitude);
  if (distance > office.radiusMeters) {
    throw new AppError(
      `Ban dang cach van phong ${Math.round(distance)}m, vuot qua ban kinh cho phep (${office.radiusMeters}m)`,
      403
    );
  }

  if (office.allowedIps.length > 0 && !office.allowedIps.includes(clientIp)) {
    throw new AppError(
      `Ket noi mang hien tai (${clientIp}) khong phai WiFi cong ty. Vui long ket noi WiFi cong ty roi thu lai`,
      403
    );
  }
}

// Xem trang thai cham cong hom nay cua chinh minh
attendanceRouter.get(
  "/today",
  asyncHandler(async (req, res) => {
    const record = await prisma.attendance.findUnique({
      where: { userId_date: { userId: req.user!.sub, date: todayDateOnly() } },
    });
    res.json(record);
  })
);

// Lich su cham cong cua chinh minh (Agent), hoac cua 1 user cu the neu la Admin truy van
attendanceRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const targetUserId =
      req.user!.role === "ADMIN" && typeof req.query.userId === "string"
        ? req.query.userId
        : req.user!.sub;

    const records = await prisma.attendance.findMany({
      where: { userId: targetUserId },
      orderBy: { date: "desc" },
      take: 90,
    });
    res.json(records);
  })
);

// Admin: xem/quan ly toan bo bang cham cong (co the loc theo ngay)
attendanceRouter.get(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const dateQuery = typeof req.query.date === "string" ? new Date(req.query.date) : undefined;

    const records = await prisma.attendance.findMany({
      where: dateQuery ? { date: dateQuery } : undefined,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: [{ date: "desc" }, { checkInAt: "asc" }],
      take: 500,
    });
    res.json(records);
  })
);

// Agent: cham cong VAO
attendanceRouter.post(
  "/check-in",
  asyncHandler(async (req, res) => {
    const { latitude, longitude } = locationSchema.parse(req.body);
    const clientIp = getClientIp(req);

    await verifyAtOffice(clientIp, latitude, longitude);

    const date = todayDateOnly();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: req.user!.sub, date } },
    });
    if (existing?.checkInAt) {
      throw new AppError("Ban da cham cong vao hom nay roi", 409);
    }

    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId: req.user!.sub, date } },
      create: {
        userId: req.user!.sub,
        date,
        checkInAt: new Date(),
        checkInLat: latitude,
        checkInLng: longitude,
        checkInIp: clientIp,
      },
      update: {
        checkInAt: new Date(),
        checkInLat: latitude,
        checkInLng: longitude,
        checkInIp: clientIp,
      },
    });

    res.status(201).json(record);
  })
);

// Agent: cham cong RA
attendanceRouter.post(
  "/check-out",
  asyncHandler(async (req, res) => {
    const { latitude, longitude } = locationSchema.parse(req.body);
    const clientIp = getClientIp(req);

    await verifyAtOffice(clientIp, latitude, longitude);

    const date = todayDateOnly();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: req.user!.sub, date } },
    });
    if (!existing?.checkInAt) {
      throw new AppError("Ban chua cham cong vao hom nay", 400);
    }
    if (existing.checkOutAt) {
      throw new AppError("Ban da cham cong ra hom nay roi", 409);
    }

    const record = await prisma.attendance.update({
      where: { userId_date: { userId: req.user!.sub, date } },
      data: {
        checkOutAt: new Date(),
        checkOutLat: latitude,
        checkOutLng: longitude,
        checkOutIp: clientIp,
      },
    });

    res.json(record);
  })
);
