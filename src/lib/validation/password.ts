// Validación de contraseñas (punto 9 de la auditoría):
// política mínima: >= 10 caracteres. Se evalúa server-side en las
// rutas admin (creación y cambio de contraseña).
const MIN_LENGTH = 10;

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'La contraseña es obligatoria.';
  }
  if (password.length < MIN_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`;
  }
  return null;
}