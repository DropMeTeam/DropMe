import api from "./api";

export async function getMe() {
  const res = await api.get("/api/auth/me");
  return res.data; // expect { user: ... } or user object depending your backend
}

export async function login(email, password) {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
}

export async function logout() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}
