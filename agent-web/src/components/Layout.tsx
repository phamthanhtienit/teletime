import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Chấm công", end: true, icon: "⏱" },
  { to: "/shifts", label: "Ca làm", icon: "📅" },
  { to: "/leave", label: "Nghỉ phép", icon: "📝" },
  { to: "/history", label: "Lịch sử", icon: "📖" },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <nav className="tab-bar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "tab-item active" : "tab-item")}
          >
            <span className="tab-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
