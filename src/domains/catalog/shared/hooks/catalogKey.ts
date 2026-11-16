/**
 * Raiz das chaves de cache do catálogo. Toda mutação invalida a raiz inteira, porque os
 * recursos se referenciam (fichas e tipos de bolo mostram nomes de formas, massas e recheios).
 */
export const CATALOG_KEY = ["catalog"] as const;
