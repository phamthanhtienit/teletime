import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
});

// Tu dong gan token vao moi request neu da dang nhap
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("teletime_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Neu token het han / khong hop le -> dang xuat va ve trang login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("teletime_token");
      localStorage.removeItem("teletime_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
