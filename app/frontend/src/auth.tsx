import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export type Me = {
  id: string;
  name: string;
  email: string;
  roleKey: "designer" | "leader" | "educator" | "admin" | "owner";
  roleName: string;
  branchId: string | null;
  levelId: string | null;
};

type AuthCtx = {
  me: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Me>("/api/auth/me")
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const user = await api.post<Me>("/api/auth/login", { email, password });
    setMe(user);
  }
  async function logout() {
    await api.post("/api/auth/logout");
    setMe(null);
  }

  return <Ctx.Provider value={{ me, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

// Which roles see the admin/management area.
export const isManager = (role?: string) => role === "admin" || role === "educator" || role === "leader";
