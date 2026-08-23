import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import CheckInPage from "@/pages/CheckInPage";
import ShiftsPage from "@/pages/ShiftsPage";
import LeavePage from "@/pages/LeavePage";
import HistoryPage from "@/pages/HistoryPage";

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
            <Route index element={<CheckInPage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
