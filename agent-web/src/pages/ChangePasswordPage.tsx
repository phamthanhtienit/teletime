import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch("/users/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Đã đổi mật khẩu thành công");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Đổi mật khẩu thất bại, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="section-title">Đổi mật khẩu</h2>
        <button className="link-button" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>

      <form className="form" onSubmit={submit}>
        <label>
          Mật khẩu hiện tại
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label>
          Xác nhận mật khẩu mới
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {message && <div className="success-text">{message}</div>}
        {error && <div className="error-text">{error}</div>}

        <button className="big-button" type="submit" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}
