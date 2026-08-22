import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyToken } from "@/utils/jwt";

/**
 * Kiem tra header Authorization: Bearer <token>, giai ma va gan req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Thieu token xac thuc" });
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: "Token khong hop le hoac da het han" });
  }
}

/**
 * Chi cho phep cac role duoc liet ke truy cap. Dung sau requireAuth.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Chua xac thuc" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Ban khong co quyen thuc hien hanh dong nay" });
    }
    next();
  };
}
