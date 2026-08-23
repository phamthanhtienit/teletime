import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Attendance } from "@/api/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}
function formatTime(value: string | null) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get<Attendance[]>("/attendance/history").then(({ data }) => {
      if (active) {
        setRecords(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <h2 className="section-title">Lịch sử chấm công</h2>

      {loading ? (
        <p className="empty">Đang tải...</p>
      ) : records.length === 0 ? (
        <p className="empty">Chưa có lịch sử chấm công</p>
      ) : (
        <div className="list">
          {records.map((item) => (
            <div key={item.id} className="list-row">
              <div className="list-title">{formatDate(item.date)}</div>
              <div className="list-sub">
                Vào {formatTime(item.checkInAt)} · Ra {formatTime(item.checkOutAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
