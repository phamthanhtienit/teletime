import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Attendance } from "@/api/types";

function formatTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function AttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get<Attendance[]>("/attendance", { params: { date } });
    setRecords(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div>
      <div className="page-header">
        <h2>Bảng chấm công</h2>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : records.length === 0 ? (
        <p>Chưa có ai chấm công ngày này.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Giờ vào</th>
              <th>Giờ ra</th>
              <th>IP vào</th>
              <th>IP ra</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.user?.fullName}</td>
                <td>{formatTime(r.checkInAt)}</td>
                <td>{formatTime(r.checkOutAt)}</td>
                <td>{r.checkInIp ?? "-"}</td>
                <td>{r.checkOutIp ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
