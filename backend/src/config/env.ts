import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Thieu bien moi truong ${name}. Xem file .env.example de biet cach cau hinh.`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@teletime.local",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123",
};
