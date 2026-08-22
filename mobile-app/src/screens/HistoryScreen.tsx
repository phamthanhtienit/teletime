import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import type { Attendance } from "../api/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}
function formatTime(value: string | null) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      api.get<Attendance[]>("/attendance/history").then(({ data }) => {
        if (active) {
          setRecords(data);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={records}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>Chưa có lịch sử chấm công</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
          <Text style={styles.time}>
            Vào {formatTime(item.checkInAt)} · Ra {formatTime(item.checkOutAt)}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 40 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e4e9",
  },
  date: { fontWeight: "700", marginBottom: 4 },
  time: { color: "#6b7280" },
});
