// Rate limiter en memoria simple (punto 9):
// mitiga fuerza bruta sobre rutas sensibles (login de admin,
// cambio de contraseña) por IP. Nota: en entornos serverless
// multi-instancia no es perfecto; se complementa con la validación
// de contraseña y, a futuro, con limitación del proveedor/auth.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS = 10; // 10 intentos por minuto por IP

export function rateLimit(key: string): {
  allowed: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}