import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Khong tim thay route ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Du lieu gui len khong hop le",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Loi vi pham rang buoc unique cua Prisma (VD dang ky trung 1 ca/1 ngay,
  // xin nghi phep trung, email da ton tai...) - tra ve thong bao tieng Viet
  // thay vi de loi he thong 500 tho.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({ message: "Du lieu nay da ton tai, khong the tao trung lap" });
  }

  console.error(err);
  return res.status(500).json({ message: "Loi he thong, vui long thu lai sau" });
}
