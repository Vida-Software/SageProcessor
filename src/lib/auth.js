/**
 * Middleware de autenticación simplificado
 * Este middleware pasa directamente las peticiones sin validación de autenticación
 * para permitir el funcionamiento de la aplicación de demostración
 */
export function authMiddleware(handler) {
  return async (req, res) => {
    // En un entorno de producción, aquí verificaríamos tokens, roles, etc.
    // Por ahora, simplemente pasamos la petición al handler original
    return handler(req, res);
  };
}