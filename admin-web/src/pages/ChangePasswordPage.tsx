import { useState, type FormEvent } from "react";
import { api } from "@/api/client";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (form.newPassword.length < 6) {
      setError("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch("/users/me/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Đổi mật khẩu thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Đổi mật khẩu</h2>
      <p className="subtitle">Đổi mật khẩu đăng nhập của chính tài khoản bạn đang dùng.</p>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label>
          Mật khẩu hiện tại
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
          />
        </label>

        <label>
          Mật khẩu mới
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
            minLength={6}
          />
        </label>

        <label>
          Xác nhận mật khẩu mới
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            minLength={6}
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
        {saved && <div className="success-text">Đã đổi mật khẩu thành công.</div>}
        {error && <div className="error-text">{error}</div>}
      </form>
    </div>
  );
}
