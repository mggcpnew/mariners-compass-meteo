// Conversões de unidade (B12, casos h, i e j). 1 nó = 1852 m / 3600 s.

export const KNOT_IN_MS = 1852 / 3600
export const MS_IN_KMH = 3.6
export const KNOT_IN_KMH = 1.852

export const knotsToMs = (kn: number): number => kn * KNOT_IN_MS
export const msToKnots = (ms: number): number => ms / KNOT_IN_MS
export const msToKmh = (ms: number): number => ms * MS_IN_KMH
export const kmhToMs = (kmh: number): number => kmh / MS_IN_KMH
export const knotsToKmh = (kn: number): number => kn * KNOT_IN_KMH
export const kmhToKnots = (kmh: number): number => kmh / KNOT_IN_KMH
