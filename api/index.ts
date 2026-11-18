// Única Vercel Function da API v1. As rotas /api/v1/* chegam aqui por
// rewrite (vercel.json); o roteamento fica em packages/api.
import { createHandler, depsFromEnv } from '@mariners-compass/api'

const handle = createHandler(depsFromEnv(process.env))

export default {
  fetch(request: Request): Promise<Response> {
    return handle(request)
  },
}
