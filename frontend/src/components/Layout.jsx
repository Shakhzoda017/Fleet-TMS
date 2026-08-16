import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";
import api from "../api";

const NAV = [
  { to: "/loads", label: "Load Board" },
  { to: "/main-board", label: "Main Board" },
  { to: "/drivers", label: "Drivers" },
  { to: "/trucks", label: "Trucks" },
  { to: "/dispatchers", label: "Dispatchers" },
  { to: "/archive", label: "Archive" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [counts, setCounts] = useState({ drivers: 0, trucks: 0, dispatchers: 0, loads: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/drivers"), api.get("/trucks"), api.get("/dispatchers"), api.get("/loads")]).then(
      ([d, t, disp, l]) =>
        setCounts({ drivers: d.data.length, trucks: t.data.length, dispatchers: disp.data.length, loads: l.data.length })
    );
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">TMS</div>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/users" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              Users
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="summary-bar">
            <span className="summary-item">
              <b>{counts.drivers}</b> Drivers
            </span>
            <span className="summary-item">
              <b>{counts.trucks}</b> Trucks
            </span>
            <span className="summary-item">
              <b>{counts.dispatchers}</b> Dispatchers
            </span>
            <span className="summary-item">
              <b>{counts.loads}</b> Loads
            </span>
          </div>
          <div className="topbar-right">
            <button className="btn-icon theme-toggle" title="Toggle theme" onClick={toggleTheme}>
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <div className="user-menu-wrap">
              <button className="user-chip" onClick={() => setMenuOpen((o) => !o)}>
                <span>{user?.full_name || user?.username}</span>
                <span className="role-badge">{user?.role}</span>
              </button>
              {menuOpen && (
                <div className="user-menu" onMouseLeave={() => setMenuOpen(false)}>
                  <Link to="/profile" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  {user?.role === "admin" && (
                    <Link to="/users" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                      Users
                    </Link>
                  )}
                  <button className="user-menu-item" onClick={logout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
