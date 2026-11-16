import { http, HttpResponse, type JsonBodyType } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { api } from "./api";

const url = (path: string) => `http://localhost:3000${path}`;

async function mensagemDe(corpo: JsonBodyType) {
  server.use(http.get(url("/x"), () => HttpResponse.json(corpo, { status: 422 })));
  const erro = await api.get("/x").catch((e: unknown) => e);
  return (erro as Error).message;
}

describe("mensagem de erro da API", () => {
  it("usa o campo error", async () => {
    expect(await mensagemDe({ error: "Invalid email or password." })).toBe(
      "Invalid email or password.",
    );
  });

  it("junta a lista errors (estilo Rails)", async () => {
    expect(await mensagemDe({ errors: ["Name can't be blank", "Email is invalid"] })).toBe(
      "Name can't be blank. Email is invalid",
    );
  });

  it("junta errors por campo", async () => {
    expect(await mensagemDe({ errors: { email: ["has already been taken"] } })).toBe(
      "email has already been taken",
    );
  });

  it("usa a mensagem padrão quando o corpo não tem texto útil", async () => {
    expect(await mensagemDe({ foo: 1 })).toBe("Ocorreu um erro inesperado.");
  });
});
