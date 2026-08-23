import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Shift, ShiftRegistration } from "@/api/types";
import { vnTimeToUsEastern } from "@/utils/usTime";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const statusLabel: Record<string, string> = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
};
const statusClass: Record<string, string> = {
  PENDING: "badge-pending",
  APPROVED: "badge-ok",
  REJECTED: "badge-off",
};

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Shift[]>("/shifts").then(({ data }) => setShifts(data));
  }, []);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get<ShiftRegistration[]>("/shifts/registrations");
    setRegistrations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function register(shiftId: string) {
    setSubmittingId(shiftId);
    setMessage(null);
    setError(null);
    try {
      await api.post("/shifts/registrations", { shiftId, date: todayISO() });
      await loadRegistrations();
      setMessage("Đã gửi đăng ký, chờ Admin duyệt ca làm hôm nay");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không đăng ký được, vui lòng thử lại");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="page">
      <h2 className="section-title">Đăng ký ca hôm nay</h2>

      {message && <div className="success-text">{message}</div>}
      {error && <div className="error-text">{error}</div>}

      <div className="shift-list">
        {shifts.map((shift) => (
          <button
            key={shift.id}
            className="shift-button"
            onClick={() => register(shift.id)}
            disabled={submittingId === shift.id}
          >
            <span className="shift-name">{shift.name}</span>
            <span className="shift-time">
              {shift.startTime} - {shift.endTime} (VN)
            </span>
            <span className="shift-time shift-time-us">
              {vnTimeToUsEastern(shift.startTime)} - {vnTimeToUsEastern(shift.endTime)} (Mỹ - PA)
            </span>
          </button>
        ))}
        {shifts.length === 0 && <p className="empty">Chưa có ca làm nào được thiết lập</p>}
      </div>

      <h2 className="section-title">Đã đăng ký</h2>

      {loading ? (
        <p className="empty">Đang tải...</p>
      ) : registrations.length === 0 ? (
        <p className="empty">Chưa đăng ký ca nào</p>
      ) : (
        <div className="list">
          {registrations.map((item) => (
            <div key={item.id} className="list-row">
              <div>
                <div className="list-title">{item.shift.name}</div>
                <div className="list-sub">{new Date(item.date).toLocaleDateString("vi-VN")}</div>
              </div>
              <span className={`badge ${statusClass[item.status]}`}>{statusLabel[item.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
