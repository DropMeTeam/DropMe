import api from "./api";

const isAdminApp =
  import.meta.env.VITE_APP_KIND === "admin" ||
  window.location.port === "5174"; // admin dev port

const ME_ENDPOINT = isAdminApp ? "/api/admin/me" : "/api/auth/me";

export async function getMe() {
  const res = await api.get(ME_ENDPOINT);
  return res.data;
}

export async function login(email, password) {
  // login can stay the same
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
}

export async function logout() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}
