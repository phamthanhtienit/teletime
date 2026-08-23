import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import type { Shift, ShiftRegistration } from "../api/types";
import { vnTimeToUsEastern } from "../utils/usTime";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const statusLabel: Record<string, string> = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
};

const statusColor: Record<string, string> = {
  PENDING: "#d97706",
  APPROVED: "#16a34a",
  REJECTED: "#dc2626",
};

export default function ShiftRegistrationScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Shift[]>("/shifts").then(({ data }) => setShifts(data));
  }, []);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get<ShiftRegistration[]>("/shifts/registrations");
    setRegistrations(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRegistrations();
    }, [loadRegistrations])
  );

  async function register(shiftId: string) {
    setSubmittingId(shiftId);
    try {
      await api.post("/shifts/registrations", { shiftId, date: todayISO() });
      await loadRegistrations();
      Alert.alert("Đã gửi đăng ký", "Chờ Admin duyệt ca làm hôm nay");
    } catch (err: any) {
      Alert.alert("Không đăng ký được", err?.response?.data?.message ?? "Vui lòng thử lại");
    } finally {
      setSubmittingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Đăng ký ca hôm nay</Text>
      {shifts.map((shift) => (
        <Pressable
          key={shift.id}
          style={styles.shiftButton}
          onPress={() => register(shift.id)}
          disabled={submittingId === shift.id}
        >
          <Text style={styles.shiftName}>{shift.name}</Text>
          <Text style={styles.shiftTime}>
            {shift.startTime} - {shift.endTime} (VN)
          </Text>
          <Text style={styles.shiftTimeUs}>
            {vnTimeToUsEastern(shift.startTime)} - {vnTimeToUsEastern(shift.endTime)} (Mỹ - PA)
          </Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Đã đăng ký</Text>
      <FlatList
        data={registrations}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Chưa đăng ký ca nào</Text>}
        renderItem={({ item }) => (
          <View style={styles.regRow}>
            <View>
              <Text style={styles.shiftName}>{item.shift.name}</Text>
              <Text style={styles.shiftTime}>
                {new Date(item.date).toLocaleDateString("vi-VN")}
              </Text>
            </View>
            <Text style={{ color: statusColor[item.status], fontWeight: "600" }}>
              {statusLabel[item.status]}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  section: { fontWeight: "700", fontSize: 16, marginTop: 16, marginBottom: 8 },
  shiftButton: {
    backgroundColor: "#f4f5f7",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  shiftName: { fontWeight: "600" },
  shiftTime: { color: "#6b7280", marginTop: 2 },
  shiftTimeUs: { color: "#9ca3af", marginTop: 2, fontSize: 12 },
  regRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e4e9",
  },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 12 },
});
