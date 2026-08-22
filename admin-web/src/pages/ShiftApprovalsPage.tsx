import { useEffect, useState } from "react";
import { api } from "@/api/client";
import type { ShiftRegistration } from "@/api/types";

export default function ShiftApprovalsPage() {
  const [items, setItems] = useState<ShiftRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get<ShiftRegistration[]>("/shifts/registrations", {
      params: { status: "PENDING" },
    });
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    await api.patch(`/shifts/registrations/${id}`, { status });
    await load();
  }

  return (
    <div>
      <h2>Duyệt đăng ký ca làm</h2>
      {loading ? (
        <p>Đang tải...</p>
      ) : items.length === 0 ? (
        <p>Không có đăng ký nào đang chờ duyệt.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Ca</th>
              <th>Ngày</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td>{r.user.fullName}</td>
                <td>
                  {r.shift.name} ({r.shift.startTime} - {r.shift.endTime})
                </td>
                <td>{new Date(r.date).toLocaleDateString("vi-VN")}</td>
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
