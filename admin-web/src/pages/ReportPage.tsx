import { useState } from "react";
import * as XLSX from "xlsx";
import { api } from "@/api/client";
import type { Attendance, ShiftRegistration, LeaveRequest } from "@/api/types";
import { formatUsEasternTime } from "@/utils/usTime";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function formatTimeVN(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDateVN(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function attendanceStatusLabel(r: Attendance) {
  if (!r.checkInAt) return "-";
  if (!r.shiftName) return "Chưa rõ ca";
  return r.isLate ? `Trễ ${r.lateMinutes} phút` : "Đúng giờ";
}

function workedHours(checkInAt: string | null, checkOutAt: string | null) {
  if (!checkInAt || !checkOutAt) return null;
  const ms = new Date(checkOutAt).getTime() - new Date(checkInAt).getTime();
  if (ms <= 0) return null;
  return Math.round((ms / 3_600_000) * 100) / 100;
}

function leaveDayCount(startDate: string, endDate: string) {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export default function ReportPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonthISO());
  const [toDate, setToDate] = useState(todayISO());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    if (fromDate > toDate) {
      setError("Từ ngày phải trước hoặc bằng Đến ngày");
      return;
    }

    setExporting(true);
    try {
      const [attendanceRes, shiftRegRes, leaveRes] = await Promise.all([
        api.get<Attendance[]>("/attendance", { params: { from: fromDate, to: toDate } }),
        api.get<ShiftRegistration[]>("/shifts/registrations", {
          params: { status: "APPROVED", from: fromDate, to: toDate },
        }),
        api.get<LeaveRequest[]>("/leave-requests", {
          params: { status: "APPROVED", from: fromDate, to: toDate },
        }),
      ]);

      const attendance = attendanceRes.data;
      const shiftRegs = shiftRegRes.data;
      const leaves = leaveRes.data;

      const wb = XLSX.utils.book_new();

      // Sheet 1: Chi tiet cham cong
      const attendanceRows = attendance.map((r) => ({
        "Nhân viên": r.user?.fullName ?? "",
        Email: r.user?.email ?? "",
        Ngày: formatDateVN(r.date),
        "Ca làm": r.shiftName ?? "-",
        "Giờ vào (VN)": formatTimeVN(r.checkInAt),
        "Giờ vào (Mỹ)": formatUsEasternTime(r.checkInAt),
        "Giờ ra (VN)": formatTimeVN(r.checkOutAt),
        "Giờ ra (Mỹ)": formatUsEasternTime(r.checkOutAt),
        "Trạng thái": attendanceStatusLabel(r),
        "Số giờ làm": workedHours(r.checkInAt, r.checkOutAt) ?? "-",
      }));
      const wsAttendance = XLSX.utils.json_to_sheet(attendanceRows);
      XLSX.utils.book_append_sheet(wb, wsAttendance, "Chấm công");

      // Sheet 2: Tong hop theo nhan vien
      const summaryByUser = new Map<
        string,
        { name: string; days: number; lateDays: number; lateMinutes: number; hours: number }
      >();
      for (const r of attendance) {
        if (!r.checkInAt) continue;
        const key = r.userId;
        const entry = summaryByUser.get(key) ?? {
          name: r.user?.fullName ?? "",
          days: 0,
          lateDays: 0,
          lateMinutes: 0,
          hours: 0,
        };
        entry.days += 1;
        if (r.isLate) {
          entry.lateDays += 1;
          entry.lateMinutes += r.lateMinutes;
        }
        entry.hours += workedHours(r.checkInAt, r.checkOutAt) ?? 0;
        summaryByUser.set(key, entry);
      }
      const summaryRows = Array.from(summaryByUser.values()).map((e) => ({
        "Nhân viên": e.name,
        "Số ngày đã chấm công": e.days,
        "Số ngày đi trễ": e.lateDays,
        "Tổng phút trễ": e.lateMinutes,
        "Tổng giờ làm": Math.round(e.hours * 100) / 100,
      }));
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng hợp");

      // Sheet 3: Ca lam da duyet
      const shiftRows = shiftRegs.map((s) => ({
        "Nhân viên": s.user.fullName,
        Ngày: formatDateVN(s.date),
        "Ca làm": s.shift.name,
        "Giờ ca (VN)": `${s.shift.startTime} - ${s.shift.endTime}`,
      }));
      const wsShifts = XLSX.utils.json_to_sheet(shiftRows);
      XLSX.utils.book_append_sheet(wb, wsShifts, "Ca làm đã duyệt");

      // Sheet 4: Nghi phep da duyet
      const leaveRows = leaves.map((l) => ({
        "Nhân viên": l.user.fullName,
        "Từ ngày": formatDateVN(l.startDate),
        "Đến ngày": formatDateVN(l.endDate),
        "Số ngày nghỉ": leaveDayCount(l.startDate, l.endDate),
        "Lý do": l.reason,
      }));
      const wsLeaves = XLSX.utils.json_to_sheet(leaveRows);
      XLSX.utils.book_append_sheet(wb, wsLeaves, "Nghỉ phép đã duyệt");

      XLSX.writeFile(wb, `bao-cao-teletime_${fromDate}_${toDate}.xlsx`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Xuất báo cáo thất bại, vui lòng thử lại");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <h2>Xuất báo cáo</h2>
      <p className="subtitle">
        Xuất file Excel gồm chấm công (giờ vào/ra, trễ giờ, tổng giờ làm), ca làm đã duyệt và nghỉ
        phép đã duyệt trong khoảng ngày bạn chọn.
      </p>

      <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <label>
            Từ ngày
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            Đến ngày
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <button type="button" onClick={handleExport} disabled={exporting}>
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </button>
        </div>

        {error && <div className="error-text">{error}</div>}
      </form>
    </div>
  );
}
