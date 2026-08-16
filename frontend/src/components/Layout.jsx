import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

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
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div />
          <div className="user-chip">
            <span>{user?.full_name || user?.username}</span>
            <span className="role-badge">{user?.role}</span>
            <button className="btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
