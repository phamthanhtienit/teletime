import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import type { Attendance } from "@/api/types";
import { useAuth } from "@/context/AuthContext";
import { nowUsEasternTime, nowVnTime } from "@/utils/usTime";

function formatTime(value: string | null) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function getLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Trình duyệt không hỗ trợ định vị GPS"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Cần cho phép truy cập vị trí để chấm công"));
        } else {
          reject(new Error("Không lấy được vị trí GPS, vui lòng thử lại"));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function CheckInPage() {
  const { user, logout } = useAuth();
  const [today, setToday] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(() => ({ vn: nowVnTime(), us: nowUsEasternTime() }));

  useEffect(() => {
    const timer = setInterval(() => {
      setClock({ vn: nowVnTime(), us: nowUsEasternTime() });
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Attendance | null>("/attendance/today");
      setToday(data);
    } catch {
      // im lang, coi nhu chua cham cong
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCheckIn() {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const location = await getLocation();
      await api.post("/attendance/check-in", location);
      await load();
      setMessage("Đã chấm công vào thành công");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message ?? "Không thể chấm công");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOut() {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const location = await getLocation();
      await api.post("/attendance/check-out", location);
      await load();
      setMessage("Đã chấm công ra thành công");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message ?? "Không thể chấm công");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">Đang tải...</div>;

  const canCheckIn = !today?.checkInAt;
  const canCheckOut = !!today?.checkInAt && !today?.checkOutAt;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="hello">Xin chào, {user?.fullName}</h1>
          <p className="subtitle">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
        </div>
        <button className="link-button" onClick={logout}>
          Đăng xuất
        </button>
      </div>

      <div className="card time-card">
        <div className="time-row">
          <span className="time-label">Giờ vào</span>
          <span className="time-value">{formatTime(today?.checkInAt ?? null)}</span>
        </div>
        <div className="time-row">
          <span className="time-label">Giờ ra</span>
          <span className="time-value">{formatTime(today?.checkOutAt ?? null)}</span>
        </div>
      </div>

      <div className="card time-card">
        <div className="time-row">
          <span className="time-label">Giờ Việt Nam (bây giờ)</span>
          <span className="time-value">{clock.vn}</span>
        </div>
        <div className="time-row">
          <span className="time-label">Giờ Mỹ - PA (bây giờ)</span>
          <span className="time-value">{clock.us}</span>
        </div>
      </div>

      {message && <div className="success-text">{message}</div>}
      {error && <div className="error-text">{error}</div>}

      <button className="big-button" onClick={handleCheckIn} disabled={!canCheckIn || submitting}>
        {submitting ? "Đang xử lý..." : "Chấm công VÀO"}
      </button>

      <button
        className="big-button outline"
        onClick={handleCheckOut}
        disabled={!canCheckOut || submitting}
      >
        {submitting ? "Đang xử lý..." : "Chấm công RA"}
      </button>
    </div>
  );
}
