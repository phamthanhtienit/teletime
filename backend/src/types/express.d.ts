import type { JwtPayload } from "@/utils/jwt";

// Mo rong Express Request de gan thong tin user sau khi xac thuc JWT
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
