import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { api } from "../api/client";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (newPassword.length < 6) {
      Alert.alert("Không thể đổi", "Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Không thể đổi", "Xác nhận mật khẩu mới không khớp");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch("/users/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Thành công", "Đã đổi mật khẩu");
    } catch (err: any) {
      Alert.alert(
        "Đổi mật khẩu thất bại",
        err?.response?.data?.message ?? err.message ?? "Vui lòng thử lại"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mật khẩu hiện tại</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />

      <Text style={styles.label}>Mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? "Đang lưu..." : "Đổi mật khẩu"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  label: { color: "#6b7280", marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e4e9",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
