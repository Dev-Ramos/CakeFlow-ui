import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { iniciais } from "../lib/iniciais";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("gera as iniciais dos dois primeiros nomes", () => {
    expect(iniciais("maria clara souza")).toBe("MC");
    expect(iniciais("  Ana ")).toBe("A");
  });

  it("mostra as iniciais sem foto e a foto quando há URL", () => {
    const { rerender } = render(<Avatar nome="Ana Lima" />);
    expect(screen.getByRole("img", { name: "Foto de Ana Lima" })).toHaveTextContent("AL");

    rerender(<Avatar nome="Ana Lima" src="https://x.test/a.png" />);
    expect(screen.getByRole("img", { name: "Foto de Ana Lima" }).querySelector("img")).toHaveAttribute(
      "src",
      "https://x.test/a.png",
    );
  });

  it("volta para as iniciais se a foto falhar ao carregar", () => {
    render(<Avatar nome="Ana Lima" src="https://x.test/quebrada.png" />);
    fireEvent.error(screen.getByRole("img", { name: "Foto de Ana Lima" }).querySelector("img")!);

    expect(screen.getByRole("img", { name: "Foto de Ana Lima" })).toHaveTextContent("AL");
  });

  it("decorativo some para leitores de tela", () => {
    render(<Avatar nome="Ana Lima" decorativo />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
