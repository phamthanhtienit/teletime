import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { LeaveRequest } from "@/api/types";

export default function LeaveApprovalsPage() {
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get<LeaveRequest[]>("/leave-requests", {
      params: { status: "PENDING" },
    });
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    await api.patch(`/leave-requests/${id}`, { status });
    await load();
  }

  return (
    <div>
      <h2>Duyệt đơn nghỉ phép</h2>
      {loading ? (
        <p>Đang tải...</p>
      ) : items.length === 0 ? (
        <p>Không có đơn nào đang chờ duyệt.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Từ ngày</th>
              <th>Đến ngày</th>
              <th>Lý do</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td>{r.user.fullName}</td>
                <td>{new Date(r.startDate).toLocaleDateString("vi-VN")}</td>
                <td>{new Date(r.endDate).toLocaleDateString("vi-VN")}</td>
                <td>{r.reason}</td>
                <td className="action-cell">
                  <button onClick={() => review(r.id, "APPROVED")}>Duyệt</button>
                  <button className="danger" onClick={() => review(r.id, "REJECTED")}>
                    Từ chối
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
