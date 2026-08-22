import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import type { LeaveRequest } from "../api/types";

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function LeaveRequestScreen() {
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  const load = useCallback(async () => {
    const { data } = await api.get<LeaveRequest[]>("/leave-requests");
    setLeaves(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function submit() {
    if (!reason.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập lý do nghỉ phép");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/leave-requests", { startDate, endDate, reason: reason.trim() });
      setReason("");
      await load();
      Alert.alert("Đã gửi đơn", "Chờ Admin duyệt đơn nghỉ phép");
    } catch (err: any) {
      Alert.alert("Gửi đơn thất bại", err?.response?.data?.message ?? "Vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Xin nghỉ phép</Text>

      <Text style={styles.label}>Từ ngày (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} />

      <Text style={styles.label}>Đến ngày (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} />

      <Text style={styles.label}>Lý do</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={reason}
        onChangeText={setReason}
        multiline
        placeholder="VD: Việc gia đình"
      />

      <Pressable style={styles.button} onPress={submit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Đang gửi..." : "Gửi đơn"}</Text>
      </Pressable>

      <Text style={styles.section}>Đơn đã gửi</Text>
      <FlatList
        data={leaves}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có đơn nghỉ phép nào</Text>}
        renderItem={({ item }) => (
          <View style={styles.leaveRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.leaveDate}>
                {new Date(item.startDate).toLocaleDateString("vi-VN")} -{" "}
                {new Date(item.endDate).toLocaleDateString("vi-VN")}
              </Text>
              <Text style={styles.leaveReason}>{item.reason}</Text>
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
  section: { fontWeight: "700", fontSize: 16, marginTop: 16, marginBottom: 8 },
  label: { color: "#6b7280", marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e4e9",
    borderRadius: 8,
    padding: 10,
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 12 },
  leaveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e4e9",
  },
  leaveDate: { fontWeight: "600" },
  leaveReason: { color: "#6b7280", marginTop: 2 },
});
