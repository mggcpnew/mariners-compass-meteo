// Preferências do aparelho (localStorage). Só preferências: nada de dado pessoal.
// Navegação privada ou armazenamento bloqueado: segue com o padrão, sem erro.

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(`mc.${key}`)
  } catch {
    return null
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(`mc.${key}`, value)
  } catch {
    // sem armazenamento: a escolha vale só nesta sessão
  }
}
