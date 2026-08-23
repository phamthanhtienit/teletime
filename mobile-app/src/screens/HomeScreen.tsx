import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { api } from "../api/client";
import type { Attendance } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { nowUsEasternTime, nowVnTime } from "../utils/usTime";

function formatTime(value: string | null) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [today, setToday] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function getLocationOrThrow() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Cần cấp quyền vị trí để chấm công");
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  }

  async function handleCheckIn() {
    setSubmitting(true);
    try {
      const location = await getLocationOrThrow();
      await api.post("/attendance/check-in", location);
      await load();
      Alert.alert("Thành công", "Đã chấm công vào");
    } catch (err: any) {
      Alert.alert("Không thể chấm công", err?.response?.data?.message ?? err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOut() {
    setSubmitting(true);
    try {
      const location = await getLocationOrThrow();
      await api.post("/attendance/check-out", location);
      await load();
      Alert.alert("Thành công", "Đã chấm công ra");
    } catch (err: any) {
      Alert.alert("Không thể chấm công", err?.response?.data?.message ?? err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const canCheckIn = !today?.checkInAt;
  const canCheckOut = !!today?.checkInAt && !today?.checkOutAt;

  return (
    <View style={styles.container}>
      <Text style={styles.hello}>Xin chào, {user?.fullName}</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Giờ vào</Text>
          <Text style={styles.value}>{formatTime(today?.checkInAt ?? null)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Giờ ra</Text>
          <Text style={styles.value}>{formatTime(today?.checkOutAt ?? null)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Giờ Việt Nam (bây giờ)</Text>
          <Text style={styles.value}>{clock.vn}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Giờ Mỹ - PA (bây giờ)</Text>
          <Text style={styles.value}>{clock.us}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.button, !canCheckIn && styles.buttonDisabled]}
        onPress={handleCheckIn}
        disabled={!canCheckIn || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? "Đang xử lý..." : "Chấm công VÀO"}</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.buttonOutline, !canCheckOut && styles.buttonDisabled]}
        onPress={handleCheckOut}
        disabled={!canCheckOut || submitting}
      >
        <Text style={[styles.buttonText, styles.buttonOutlineText]}>
          {submitting ? "Đang xử lý..." : "Chấm công RA"}
        </Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={() => navigation.navigate("ChangePassword")}>
        <Text style={styles.linkText}>Đổi mật khẩu</Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hello: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  card: {
    backgroundColor: "#f4f5f7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  label: { color: "#6b7280" },
  value: { fontWeight: "600", fontSize: 16 },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  buttonOutlineText: { color: "#2563eb" },
  logout: { marginTop: 12, alignItems: "center" },
  logoutText: { color: "#dc2626" },
  linkText: { color: "#6b7280" },
});
