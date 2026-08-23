import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/asyncHandler";
import { AppError } from "@/middleware/errorHandler";

export const usersRouter = Router();

usersRouter.use(requireAuth);

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

// Admin: danh sach nhan vien (Agent)
usersRouter.get(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  })
);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Mat khau toi thieu 6 ky tu"),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "AGENT"]).default("AGENT"),
});

// Admin: tao nhan vien moi
usersRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);

    const existed = await prisma.user.findUnique({ where: { email: data.email } });
    if (existed) throw new AppError("Email da duoc su dung", 409);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
      },
      select: userSelect,
    });

    res.status(201).json(user);
  })
);

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

// Admin: cap nhat nhan vien (sua thong tin, doi vai tro, khoa/mo tai khoan, reset mat khau)
usersRouter.patch(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const { password, ...rest } = data;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
      select: userSelect,
    });

    res.json(user);
  })
);

const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Vui long nhap mat khau hien tai"),
  newPassword: z.string().min(6, "Mat khau moi toi thieu 6 ky tu"),
});

// Ai dang nhap cung tu doi duoc mat khau cua chinh minh (Admin lan Agent),
// bat buoc nhap dung mat khau hien tai truoc de xac thuc.
usersRouter.patch(
  "/me/password",
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changeOwnPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new AppError("Khong tim thay nguoi dung", 404);

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new AppError("Mat khau hien tai khong dung", 401);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.status(204).send();
  })
);

// Admin: xoa nhan vien (thuc te chi khoa tai khoan de giu lich su cham cong)
usersRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.status(204).send();
  })
);
