import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("começa com o valor inicial e só atualiza depois do atraso", () => {
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 300), {
      initialProps: { valor: "a" },
    });
    expect(result.current).toBe("a");

    rerender({ valor: "ab" });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("ab");
  });

  it("reinicia o atraso a cada mudança e usa só o último valor", () => {
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 300), {
      initialProps: { valor: "" },
    });

    rerender({ valor: "b" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ valor: "bo" });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("");

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("bo");
  });
});
