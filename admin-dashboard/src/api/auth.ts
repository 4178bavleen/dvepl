import axiosInstance from "./axios";

export const login = (email: string, password: string) => {
  return axiosInstance.post("/admin/auth/login", {
    email,
    password,
  });
};