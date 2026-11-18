// Identificação do cliente para o limite por cliente (T-02). A Vercel
// sobrescreve x-forwarded-for e x-vercel-forwarded-for com o IP público do
// cliente (não aceita valor externo). O IP bruto nunca é gravado: só o HMAC.
import { createHmac } from 'node:crypto'

export function clientIp(headers: Headers): string {
  const raw =
    headers.get('x-vercel-forwarded-for') ?? headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? 'unknown'
  return raw.split(',')[0].trim() || 'unknown'
}

/** HMAC-SHA256 do IP com o segredo, 32 caracteres hex (formato aceito pela tabela). */
export function clientHash(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32)
}
