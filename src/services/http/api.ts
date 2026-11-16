import axios from "axios";
import { env } from "@/config/env";
import { setupInterceptors } from "./interceptors";

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 15000,
  // Sem Content-Type fixo de propósito: o Axios põe `application/json` para objetos e
  // deixa o `multipart/form-data; boundary=...` para o navegador quando o corpo é FormData.
});

setupInterceptors(api);
