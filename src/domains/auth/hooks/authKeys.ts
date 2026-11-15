export const authKeys = {
  all: ["auth"] as const,
  convites: () => [...authKeys.all, "convite"] as const,
  convite: (token: string) => [...authKeys.convites(), token] as const,
};
