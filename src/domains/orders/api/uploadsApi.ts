import { api } from "@/services/http/api";

export interface ArquivoEnviado {
  signedId: string;
  url: string;
}

/**
 * `POST /uploads` (multipart, campo `file`): a API guarda no bucket e devolve o `signed_id`,
 * que o pedido usa para anexar a imagem. O front nunca fala com o storage.
 */
export async function enviarImagem(arquivo: File): Promise<ArquivoEnviado> {
  const corpo = new FormData();
  corpo.append("file", arquivo);
  const { data } = await api.post<{ signed_id: string; url: string }>("/uploads", corpo);
  return { signedId: data.signed_id, url: data.url };
}
