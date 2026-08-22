import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/api/client";
import type { OfficeSetting } from "@/api/types";

export default function OfficeSettingsPage() {
  const [form, setForm] = useState({
    name: "Văn phòng chính",
    latitude: "",
    longitude: "",
    radiusMeters: "150",
    allowedIps: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<OfficeSetting | null>("/office").then(({ data }) => {
      if (data) {
        setForm({
          name: data.name,
          latitude: String(data.latitude),
          longitude: String(data.longitude),
          radiusMeters: String(data.radiusMeters),
          allowedIps: data.allowedIps.join(", "),
        });
      }
    });
  }, []);

  function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
      },
      () => setError("Không lấy được vị trí hiện tại từ trình duyệt")
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.put("/office", {
        name: form.name,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radiusMeters: Number(form.radiusMeters),
        allowedIps: form.allowedIps
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Lưu cấu hình thất bại");
    }
  }

  return (
    <div>
      <h2>Cấu hình văn phòng</h2>
      <p className="subtitle">
        Agent chỉ chấm công được khi GPS nằm trong bán kính bên dưới, và (nếu có khai báo) IP mạng
        đang dùng phải nằm trong danh sách IP WiFi công ty.
      </p>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label>
          Tên văn phòng
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>

        <div className="form-row">
          <label>
            Vĩ độ (latitude)
            <input
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              required
            />
          </label>
          <label>
            Kinh độ (longitude)
            <input
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              required
            />
          </label>
          <button type="button" onClick={useCurrentLocation}>
            Lấy vị trí hiện tại
          </button>
        </div>

        <label>
          Bán kính cho phép (mét)
          <input
            type="number"
            value={form.radiusMeters}
            onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
            required
          />
        </label>

        <label>
          Danh sách IP WiFi công ty (cách nhau bởi dấu phẩy, để trống nếu chưa cần kiểm tra IP)
          <input
            placeholder="VD: 14.169.23.10, 118.70.1.5"
            value={form.allowedIps}
            onChange={(e) => setForm({ ...form, allowedIps: e.target.value })}
          />
        </label>

        <button type="submit">Lưu cấu hình</button>
        {saved && <div className="success-text">Đã lưu cấu hình.</div>}
        {error && <div className="error-text">{error}</div>}
      </form>
    </div>
  );
}
