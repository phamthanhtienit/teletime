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
  // Ho tro nhieu domain cach nhau boi dau phay, VD:
  // CORS_ORIGIN="https://admin.teletime.online,https://agent.teletime.online"
  corsOrigin: (process.env.CORS_ORIGIN ?? "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@teletime.local",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123",
};