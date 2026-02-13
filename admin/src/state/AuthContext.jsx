import { createContext, useContext, useEffect, useState } from "react";
import { getMe, login as apiLogin, logout as apiLogout } from "../lib/auth";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  async function refresh() {
    try {
      const data = await getMe();

      // backend might return { user: {...} } OR just {...}
      const u = data.user || data;
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setBooting(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email, password) {
    await apiLogin(email, password);
    await refresh();
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, booting, login, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
