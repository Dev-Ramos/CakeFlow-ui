import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("desabilita Anterior na primeira página e navega para a próxima", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={10} total={35} onPageChange={onPageChange} />);

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByText("1–10 de 35")).toBeInTheDocument();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("mostra 0–0 de 0 sem registros e desabilita os dois lados", () => {
    render(<Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />);
    expect(screen.getByText("0–0 de 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("limita a página ao intervalo válido", () => {
    render(<Pagination page={99} pageSize={10} total={25} onPageChange={() => {}} />);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("modo rico (size) exibe Primeira/Última e 'Mostrando'", () => {
    render(<Pagination page={2} pageSize={10} size={10} total={35} onPageChange={() => {}} />);
    expect(screen.getByText(/Mostrando 11–20 de 35/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Primeira" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Última" })).toBeEnabled();
  });
});
