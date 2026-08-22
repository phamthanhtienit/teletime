import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/utils/jwt";
import { asyncHandler } from "@/middleware/asyncHandler";
import { AppError } from "@/middleware/errorHandler";
import { requireAuth } from "@/middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError("Email hoac mat khau khong dung", 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError("Email hoac mat khau khong dung", 401);
    }

    const token = signToken({ sub: user.id, role: user.role, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    });
  })
);

// Tra ve thong tin cua chinh nguoi dang dang nhap (dung de app/web kiem tra token con hop le)
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new AppError("Khong tim thay nguoi dung", 404);

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
    });
  })
);
