import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";

/** Renderiza com os providers de UI exigidos por FormDialog (confirm). */
export function renderWithProviders(ui: ReactElement) {
  return render(<ConfirmProvider>{ui}</ConfirmProvider>);
}
