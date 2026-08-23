import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import AttendancePage from "@/pages/AttendancePage";
import EmployeesPage from "@/pages/EmployeesPage";
import ShiftsPage from "@/pages/ShiftsPage";
import ShiftApprovalsPage from "@/pages/ShiftApprovalsPage";
import LeaveApprovalsPage from "@/pages/LeaveApprovalsPage";
import OfficeSettingsPage from "@/pages/OfficeSettingsPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AttendancePage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="shift-approvals" element={<ShiftApprovalsPage />} />
            <Route path="leave-approvals" element={<LeaveApprovalsPage />} />
            <Route path="office-settings" element={<OfficeSettingsPage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
