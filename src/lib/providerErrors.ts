// Mensaje claro y accionable cuando el proveedor gratuito (OpenRouter)
// devuelve 429 (limite de peticiones agotado), en vez de mostrar el codigo
// de error crudo como si la app hubiera fallado.
export const RATE_LIMIT_MESSAGE =
  "Limite gratuito alcanzado temporalmente. Espera unos minutos o usa una consulta mas corta (modo Quick).";

export function isRateLimitError(err: unknown): boolean {
  return err instanceof Error && err.message === "RATE_LIMIT";
}

export function friendlyProviderErrorMessage(err: unknown): string {
  if (isRateLimitError(err)) return RATE_LIMIT_MESSAGE;
  return err instanceof Error ? err.message : "Error desconocido al consultar al proveedor.";
}
