import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("mantém o fundo primary ao marcar (o tailwind-merge não pode descartá-lo)", () => {
    render(<Checkbox aria-label="x" />);
    const classes = screen.getByRole("checkbox").className.split(" ");

    expect(classes).toContain("checked:bg-primary");
    expect(classes).toContain("checked:border-primary");
    expect(classes).toContain("indeterminate:bg-primary");
    expect(classes).toContain("checked:[background-image:var(--checkbox-check)]");
  });
});
