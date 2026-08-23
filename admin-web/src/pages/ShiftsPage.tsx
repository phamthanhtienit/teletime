import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/api/client";
import type { Shift } from "@/api/types";

const emptyForm = { name: "", startTime: "", endTime: "" };

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await api.get<Shift[]>("/shifts");
    setShifts(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await api.post("/shifts", createForm);
      setCreateForm(emptyForm);
      await load();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? "Không tạo được ca làm");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(shift: Shift) {
    setEditingShift(shift);
    setEditForm({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
    setEditError(null);
  }

  function closeEdit() {
    setEditingShift(null);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingShift) return;
    setEditError(null);
    setSavingEdit(true);
    try {
      await api.patch(`/shifts/${editingShift.id}`, editForm);
      closeEdit();
      await load();
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? "Không lưu được thay đổi");
    } finally {
      setSavingEdit(false);
    }
  }

  async function toggleActive(shift: Shift) {
    await api.patch(`/shifts/${shift.id}`, { isActive: !shift.isActive });
    await load();
  }

  async function handleDelete(shift: Shift) {
    if (!window.confirm(`Xoá hẳn ca "${shift.name}"? Các đăng ký ca liên quan cũng sẽ bị xoá.`)) {
      return;
    }
    await api.delete(`/shifts/${shift.id}`);
    await load();
  }

  return (
    <div>
      <h2>Quản lý ca làm</h2>

      <form className="inline-form" onSubmit={handleCreate}>
        <label>
          Tên ca
          <input
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="VD: Ca 1"
            required
          />
        </label>
        <label>
          Giờ bắt đầu
          <input
            type="time"
            value={createForm.startTime}
            onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
            required
          />
        </label>
        <label>
          Giờ kết thúc
          <input
            type="time"
            value={createForm.endTime}
            onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
            required
          />
        </label>
        <button type="submit" disabled={creating}>
          {creating ? "Đang thêm..." : "Thêm ca"}
        </button>
      </form>
      {createError && <div className="error-text">{createError}</div>}

      {loading ? (
        <p className="page-loading">Đang tải...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên ca</th>
              <th>Giờ làm</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td>{shift.name}</td>
                <td>
                  {shift.startTime} - {shift.endTime}
                </td>
                <td>
                  <span className={shift.isActive ? "badge badge-ok" : "badge badge-off"}>
                    {shift.isActive ? "Đang bật" : "Đã tắt"}
                  </span>
                </td>
                <td className="action-cell">
                  <button onClick={() => openEdit(shift)}>Sửa</button>
                  <button onClick={() => toggleActive(shift)}>
                    {shift.isActive ? "Tắt" : "Bật"}
                  </button>
                  <button className="danger" onClick={() => handleDelete(shift)}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={4}>Chưa có ca làm nào, thêm mới ở form trên.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {editingShift && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handleEditSubmit}>
            <h3>Sửa ca làm</h3>
            <label>
              Tên ca
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </label>
            <label>
              Giờ bắt đầu
              <input
                type="time"
                value={editForm.startTime}
                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                required
              />
            </label>
            <label>
              Giờ kết thúc
              <input
                type="time"
                value={editForm.endTime}
                onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                required
              />
            </label>
            {editError && <div className="error-text">{editError}</div>}
            <div className="modal-actions">
              <button type="button" onClick={closeEdit}>
                Huỷ
              </button>
              <button type="submit" disabled={savingEdit}>
                {savingEdit ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
