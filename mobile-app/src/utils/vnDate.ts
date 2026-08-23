// Tinh "hom nay" theo GIO VIET NAM (UTC+7 co dinh, khong co gio mua he), khong
// phu thuoc timezone cua may/trinh duyet dang chay code. Dung phep cong gio
// (giong backend) thay vi toISOString() (UTC) vi co the lech 1 ngay vao khung
// gio 00:00-07:00 gio VN so voi lich Viet Nam thuc te.

const VN_UTC_OFFSET_HOURS = 7;

/** Ngay hom nay theo gio Viet Nam, dang "YYYY-MM-DD" */
export function todayVN(): string {
  const now = new Date(Date.now() + VN_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${now.getUTCFullYear()}-${m}-${d}`;
}
