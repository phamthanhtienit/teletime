import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/api/client";
import type { LeaveRequest } from "@/api/types";

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

export default function LeavePage() {
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get<LeaveRequest[]>("/leave-requests");
    setLeaves(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do nghỉ phép");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/leave-requests", { startDate, endDate, reason: reason.trim() });
      setReason("");
      await load();
      setMessage("Đã gửi đơn, chờ Admin duyệt");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gửi đơn thất bại, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h2 className="section-title">Xin nghỉ phép</h2>

      <form className="form" onSubmit={submit}>
        <label>
          Từ ngày
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          Đến ngày
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label>
          Lý do
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Việc gia đình"
          />
        </label>

        {message && <div className="success-text">{message}</div>}
        {error && <div className="error-text">{error}</div>}

        <button className="big-button" type="submit" disabled={submitting}>
          {submitting ? "Đang gửi..." : "Gửi đơn"}
        </button>
      </form>

      <h2 className="section-title">Đơn đã gửi</h2>

      {loading ? (
        <p className="empty">Đang tải...</p>
      ) : leaves.length === 0 ? (
        <p className="empty">Chưa có đơn nghỉ phép nào</p>
      ) : (
        <div className="list">
          {leaves.map((item) => (
            <div key={item.id} className="list-row">
              <div>
                <div className="list-title">
                  {new Date(item.startDate).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(item.endDate).toLocaleDateString("vi-VN")}
                </div>
                <div className="list-sub">{item.reason}</div>
              </div>
              <span className={`badge ${statusClass[item.status]}`}>{statusLabel[item.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
