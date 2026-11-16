import { Cake } from "lucide-react";
import { Outlet } from "react-router";
import { Badge } from "@/ui/components/Badge";
import { Card } from "@/ui/components/Card";

/** Shell das telas públicas (login etc.): marca centralizada e um card sobre o canvas. */
export function AuthLayout() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Badge dot className="uppercase">
            Cozinha &amp; Atelier em operação
          </Badge>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-primary shadow-sm">
              <Cake size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-headline-md leading-tight tracking-tight text-primary">Cakeflow</p>
              <p className="text-body-sm text-tertiary">Atelier Confeitaria</p>
            </div>
          </div>
        </div>
        <Card className="p-6">
          <Outlet />
        </Card>
      </div>
    </div>
  );
}
