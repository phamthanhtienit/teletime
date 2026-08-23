// Quy doi gio ca lam / gio cham cong (Viet Nam, UTC+7 co dinh, khong co gio mua he)
// sang gio Mien Dong nuoc My (VD bang Pennsylvania - PA). Dung Intl timeZone nen
// tu dong cong/tru gio mua he (EST/EDT) theo dung ngay hien tai, khong can sua code.

const VN_UTC_OFFSET_HOURS = 7;
const US_TIME_ZONE = "America/New_York";

/** Doi 1 gio "HH:mm" theo gio Viet Nam (ap dung cho hom nay) sang gio Mien Dong My "HH:mm" */
export function vnTimeToUsEastern(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const instant = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h - VN_UTC_OFFSET_HOURS, m, 0, 0)
  );
  return instant.toLocaleTimeString("en-US", {
    timeZone: US_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Format 1 thoi diem (ISO string) theo gio Mien Dong My "HH:mm" */
export function formatUsEasternTime(iso: string | null | undefined): string {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: US_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Gio hien tai (bay gio) theo gio Mien Dong My "HH:mm" */
export function nowUsEasternTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: US_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Gio hien tai (bay gio) theo gio Viet Nam "HH:mm", chi dinh ro timezone (khong phu
 * thuoc may/trinh duyet dang o dau) */
export function nowVnTime(): string {
  return new Date().toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
