import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/api/client";
import type { User } from "@/api/types";

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "AGENT" as "AGENT" | "ADMIN",
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    role: "AGENT" as "AGENT" | "ADMIN",
    newPassword: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaved, setEditSaved] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await api.get<User[]>("/users");
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/users", form);
      setForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "AGENT",
      });
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Tạo nhân viên thất bại");
    }
  }

  async function toggleActive(user: User) {
    await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
    await load();
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      phone: user.phone ?? "",
      role: user.role,
      newPassword: "",
    });
    setEditError(null);
    setEditSaved(false);
  }

  function closeEdit() {
    setEditingUser(null);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setEditSaved(false);
    try {
      await api.patch(`/users/${editingUser.id}`, {
        fullName: editForm.fullName,
        phone: editForm.phone || undefined,
        role: editForm.role,
        ...(editForm.newPassword ? { password: editForm.newPassword } : {}),
      });
      setEditSaved(true);
      setEditForm((f) => ({ ...f, newPassword: "" }));
      await load();
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? "Cập nhật thất bại");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Quản lý nhân viên</h2>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Đóng" : "+ Thêm nhân viên"}
        </button>
      </div>

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <input
            placeholder="Họ tên"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            type="password"
            placeholder="Mật khẩu tạm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as "AGENT" | "ADMIN" })
            }
          >
            <option value="AGENT">Agent</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit">Lưu</button>
          {error && <div className="error-text">{error}</div>}
        </form>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Email</th>
              <th>SĐT</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.phone ?? "-"}</td>
                <td>{u.role === "ADMIN" ? "Admin" : "Agent"}</td>
                <td>
                  <span
                    className={
                      u.isActive ? "badge badge-ok" : "badge badge-off"
                    }
                  >
                    {u.isActive ? "Đang hoạt động" : "Đã khóa"}
                  </span>
                </td>
                <td className="action-cell">
                  <button className="link-button" onClick={() => openEdit(u)}>
                    Sửa
                  </button>
                  <button
                    className="link-button"
                    onClick={() => toggleActive(u)}
                  >
                    {u.isActive ? "Khóa" : "Mở lại"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingUser && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleEditSubmit}
          >
            <h3>Sửa nhân viên</h3>
            <p className="subtitle">{editingUser.email}</p>

            <label>
              Họ tên
              <input
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fullName: e.target.value })
                }
                required
              />
            </label>

            <label>
              Số điện thoại
              <input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </label>

            <label>
              Vai trò
              <select
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    role: e.target.value as "AGENT" | "ADMIN",
                  })
                }
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>

            <label>
              Đặt lại mật khẩu (để trống nếu không đổi)
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={editForm.newPassword}
                onChange={(e) =>
                  setEditForm({ ...editForm, newPassword: e.target.value })
                }
                minLength={6}
              />
            </label>

            {editError && <div className="error-text">{editError}</div>}
            {editSaved && <div className="success-text">Đã lưu thay đổi.</div>}

            <div className="modal-actions">
              <button type="button" className="link-button" onClick={closeEdit}>
                Đóng
              </button>
              <button type="submit">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
