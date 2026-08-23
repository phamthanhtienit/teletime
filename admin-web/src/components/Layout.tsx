import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/", label: "Bảng chấm công", end: true },
  { to: "/employees", label: "Nhân viên" },
  { to: "/shifts", label: "Ca làm" },
  { to: "/shift-approvals", label: "Duyệt ca làm" },
  { to: "/leave-approvals", label: "Duyệt nghỉ phép" },
  { to: "/office-settings", label: "Cấu hình văn phòng" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">TeleTime</div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-name">{user?.fullName}</div>
          <button className="link-button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
