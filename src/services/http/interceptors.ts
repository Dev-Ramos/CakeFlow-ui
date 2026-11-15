import type { AxiosInstance } from "axios";
import { normalizeError } from "./errors";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Não dispara o handler global de 401 (ex.: tentativa de login). */
    skipUnauthorizedHandler?: boolean;
  }
}

type AccessTokenGetter = () => string | null;

let getAccessToken: AccessTokenGetter = () => null;
let onUnauthorized: (() => void) | null = null;

/** Registrado pelo AuthProvider: informa o token atual sem acoplar ao React. */
export function setAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter;
}

/** Registrado pelo AuthProvider: chamado quando a API responde 401. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = normalizeError(error);
      const skip =
        (error as { config?: { skipUnauthorizedHandler?: boolean } }).config
          ?.skipUnauthorizedHandler === true;
      if (apiError.status === 401 && !skip) {
        onUnauthorized?.();
      }
      return Promise.reject(apiError);
    },
  );
}
