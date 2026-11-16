import type { ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "@/domains/auth/components/AuthProvider";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { ToastProvider } from "@/ui/toast/ToastProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <AuthProvider>{children}</AuthProvider>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
