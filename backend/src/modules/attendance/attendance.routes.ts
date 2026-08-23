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

/**
 * Ca lam co the la ca dem (VD 21:00 -> 06:00 hom sau), nen "phien cham cong
 * dang mo" (da check-in, chua check-out) co the thuoc ve ngay hom truoc chu
 * khong nhat thiet la "hom nay" theo lich. Ham nay tim phien gan nhat con mo
 * cua 1 nhan vien, bat ke ngay nao, de check-out/xem trang thai cho dung.
 */
async function findOpenAttendance(userId: string) {
  return prisma.attendance.findFirst({
    where: { userId, checkInAt: { not: null }, checkOutAt: null },
    orderBy: { date: "desc" },
  });
}

type LateInfo = {
  shiftName: string | null;
  expectedStartTime: string | null;
  isLate: boolean;
  lateMinutes: number;
};

/**
 * Tim ca lam DA DUOC DUYET cua 1 nhan vien ung voi 1 ban ghi cham cong.
 * Uu tien dang ky dung ngay cham cong; neu khong co, thu ngay hom truoc
 * (truong hop cham cong VAO sau 0h vi den qua tre cho ca dem bat dau tu
 * hom truoc, VD ca 21:00 nhung 0h30 hom sau moi toi).
 */
async function findApprovedRegistration(userId: string, attendanceDate: Date) {
  const prevDate = new Date(attendanceDate);
  prevDate.setUTCDate(prevDate.getUTCDate() - 1);

  const regs = await prisma.shiftRegistration.findMany({
    where: { userId, status: "APPROVED", date: { in: [attendanceDate, prevDate] } },
    include: { shift: true },
    orderBy: { date: "desc" }, // uu tien dang ky dung ngay truoc
  });
  return regs[0] ?? null;
}

/**
 * So sanh gio cham cong VAO thuc te voi gio bat dau ca da duyet de xac dinh
 * co tre hay khong. Gio ca (HH:mm) duoc hieu la gio Viet Nam (UTC+7, khong
 * co gio mua he) bat ke may chu dat timezone gi, de tranh sai lech.
 */
function computeLateInfo(
  checkInAt: Date | null,
  registration: { date: Date; shift: { name: string; startTime: string } } | null
): LateInfo {
  if (!registration) {
    return { shiftName: null, expectedStartTime: null, isLate: false, lateMinutes: 0 };
  }
  const [h, m] = registration.shift.startTime.split(":").map(Number);
  const y = registration.date.getUTCFullYear();
  const mo = registration.date.getUTCMonth();
  const d = registration.date.getUTCDate();
  const expectedStart = new Date(Date.UTC(y, mo, d, h - 7, m, 0, 0));

  if (!checkInAt) {
    return {
      shiftName: registration.shift.name,
      expectedStartTime: expectedStart.toISOString(),
      isLate: false,
      lateMinutes: 0,
    };
  }

  const diffMinutes = Math.round((checkInAt.getTime() - expectedStart.getTime()) / 60000);
  return {
    shiftName: registration.shift.name,
    expectedStartTime: expectedStart.toISOString(),
    isLate: diffMinutes > 0,
    lateMinutes: Math.max(0, diffMinutes),
  };
}

async function attachLateInfo<T extends { userId: string; date: Date; checkInAt: Date | null }>(
  records: T[]
): Promise<(T & LateInfo)[]> {
  return Promise.all(
    records.map(async (r) => {
      const registration = await findApprovedRegistration(r.userId, r.date);
      return { ...r, ...computeLateInfo(r.checkInAt, registration) };
    })
  );
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
    let record = await prisma.attendance.findUnique({
      where: { userId_date: { userId: req.user!.sub, date: todayDateOnly() } },
    });
    // Neu hom nay chua co ban ghi, co the do dang lam ca dem (check-in tu
    // hom qua, chua check-out) -> tra ve phien dang mo do de FE hien dung
    // trang thai "da cham vao, chua cham ra" thay vi bao chua cham cong.
    if (!record) {
      record = await findOpenAttendance(req.user!.sub);
    }
    if (!record) {
      return res.json(null);
    }
    const [enriched] = await attachLateInfo([record]);
    res.json(enriched);
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
    res.json(await attachLateInfo(records));
  })
);

// Admin: xem/quan ly toan bo bang cham cong. Loc theo 1 ngay (?date=) cho
// Bang cham cong hang ngay, hoac theo khoang ngay (?from=&to=) cho bao cao.
attendanceRouter.get(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const { date, from, to } = req.query;

    let where: any;
    if (typeof date === "string") {
      where = { date: new Date(date) };
    } else if (typeof from === "string" || typeof to === "string") {
      where = {
        date: {
          ...(typeof from === "string" ? { gte: new Date(from) } : {}),
          ...(typeof to === "string" ? { lte: new Date(to) } : {}),
        },
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: [{ date: "desc" }, { checkInAt: "asc" }],
      take: 5000,
    });
    res.json(await attachLateInfo(records));
  })
);

// Agent: cham cong VAO
attendanceRouter.post(
  "/check-in",
  asyncHandler(async (req, res) => {
    const { latitude, longitude } = locationSchema.parse(req.body);
    const clientIp = getClientIp(req);

    await verifyAtOffice(clientIp, latitude, longitude);

    // Neu con phien nao chua check-out (VD ca dem hom truoc), khong cho
    // check-in ca moi de tranh de sot mai mai 1 ban ghi khong bao gio dong.
    const openFromBefore = await findOpenAttendance(req.user!.sub);
    if (openFromBefore) {
      throw new AppError(
        "Ban con 1 phien cham cong chua cham ra (co the tu ca truoc). Vui long cham cong RA truoc khi cham VAO ca moi",
        409
      );
    }

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

    // Dong phien cham cong dang mo (co the la cua hom nay hoac hom qua neu
    // la ca dem), khong chi tim theo ngay hien tai theo lich.
    const openRecord = await findOpenAttendance(req.user!.sub);
    if (!openRecord) {
      throw new AppError("Ban chua cham cong vao hoac da cham cong ra roi", 400);
    }

    const record = await prisma.attendance.update({
      where: { id: openRecord.id },
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
