import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return;
    }
    socket.connect();
    socket.emit("auth:identify", { role: user.role, userId: user.sub || user.id });
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      refresh,
      async logout() {
        await api.post("/api/auth/logout");
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
