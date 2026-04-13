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
      // #region agent log
      fetch("http://127.0.0.1:7676/ingest/d2d9894a-c4b8-455f-81ec-2cb81c2d7279", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "a7216d",
        },
        body: JSON.stringify({
          sessionId: "a7216d",
          location: "AuthContext.jsx:refresh",
          message: "me_ok",
          data: { hasSub: Boolean(data?.user?.sub || data?.user?.id) },
          timestamp: Date.now(),
          hypothesisId: "H2",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      return data.user;
    } catch (e) {
      // #region agent log
      fetch("http://127.0.0.1:7676/ingest/d2d9894a-c4b8-455f-81ec-2cb81c2d7279", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "a7216d",
        },
        body: JSON.stringify({
          sessionId: "a7216d",
          location: "AuthContext.jsx:refresh",
          message: "me_fail",
          data: { status: e?.response?.status ?? null },
          timestamp: Date.now(),
          hypothesisId: "H2",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      setUser(null);
      try {
        localStorage.removeItem("token");
      } catch {
        /* ignore */
      }
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
        try {
          localStorage.removeItem("token");
        } catch {
          /* ignore */
        }
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
