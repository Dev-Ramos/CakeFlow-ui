import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * O tailwind-merge só conhece os tamanhos de fonte padrão do Tailwind. Sem
 * declarar os do design (`text-body-md`, `text-label-md`...), ele os trata como
 * cor e descarta o tamanho quando a mesma lista traz uma cor (`text-on-surface`).
 * Mantenha estas listas alinhadas com `design-system/tokens.css`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "headline-xl",
            "headline-xl-mobile",
            "headline-lg",
            "headline-lg-mobile",
            "headline-md",
            "headline-sm",
            "body-lg",
            "body-md",
            "body-sm",
            "label-lg",
            "label-md",
            "label-sm",
          ],
        },
      ],
      shadow: [{ shadow: ["warm", "lift", "modal"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
