import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn com os tokens do design", () => {
  it("mantém o tamanho de fonte do design junto da cor", () => {
    expect(cn("text-body-md text-on-surface")).toBe("text-body-md text-on-surface");
    expect(cn("text-label-md", "text-tertiary uppercase")).toBe("text-label-md text-tertiary uppercase");
  });

  it("o último tamanho de fonte da mesma família vence", () => {
    expect(cn("text-body-md text-on-surface", "text-label-md")).toBe("text-on-surface text-label-md");
    expect(cn("text-sm", "text-headline-sm")).toBe("text-headline-sm");
  });

  it("cor e tamanho não se anulam entre si", () => {
    expect(cn("text-primary", "text-label-sm")).toBe("text-primary text-label-sm");
  });

  it("sombras do design competem entre si, não com cores", () => {
    expect(cn("shadow-warm", "shadow-modal")).toBe("shadow-modal");
    expect(cn("shadow-sm", "shadow-warm")).toBe("shadow-warm");
  });

  it("continua resolvendo conflitos comuns do Tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("p-2", undefined, "hidden")).toBe("p-2 hidden");
  });
});
