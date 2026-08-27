import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth, isManager } from "../auth";

export function Layout({ children }: { children: ReactNode }) {
  const { me, logout } = useAuth();
  const loc = useLocation();
  const manager = isManager(me?.roleKey);
  const inAdmin = loc.pathname.startsWith("/admin");

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="wordmark">Merci Momong</span>
          <div className="meta">
            <span>
              {me?.name} · {me?.roleName}
            </span>
            {manager && (
              <NavLink to={inAdmin ? "/" : "/admin"} className="small">
                {inAdmin ? "디자이너 화면" : "관리자 화면"}
              </NavLink>
            )}
            <a className="small" onClick={() => logout()} style={{ cursor: "pointer" }}>
              로그아웃
            </a>
          </div>
        </div>
      </header>

      <main className="container">{children}</main>

      {/* Bottom tabs: designer flow (always), admin gets extra manager tabs) */}
      {!inAdmin ? (
        <nav className="tabbar">
          <Tab to="/" label="홈" end />
          <Tab to="/curriculum" label="교육" />
          <Tab to="/practice" label="실습" />
          <Tab to="/feedback" label="피드백" />
          <Tab to="/growth" label="성장" />
        </nav>
      ) : (
        <nav className="tabbar">
          <Tab to="/admin" label="대시보드" end />
          <Tab to="/admin/designers" label="디자이너" />
          <Tab to="/admin/evaluation" label="평가" />
          <Tab to="/admin/curriculum" label="커리큘럼" />
        </nav>
      )}
    </div>
  );
}

function Tab({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
      {label}
    </NavLink>
  );
}
