// True quando o arquivo é o script executado (node scripts/ci/x.ts).
// No Windows a letra do drive pode vir com caixa diferente; compara sem caixa.
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function isMain(importMetaUrl: string): boolean {
  const argv1 = process.argv[1]
  if (!argv1) return false
  const a = resolve(argv1)
  const b = fileURLToPath(importMetaUrl)
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
}
