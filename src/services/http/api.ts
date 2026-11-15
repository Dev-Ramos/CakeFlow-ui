import axios from "axios";
import { env } from "@/config/env";
import { setupInterceptors } from "./interceptors";

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

setupInterceptors(api);
