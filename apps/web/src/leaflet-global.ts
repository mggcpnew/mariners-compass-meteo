// O leaflet-velocity 2.1.4 é um script que usa o `L` global (T-11). Este módulo
// expõe o Leaflet em globalThis antes de o plugin ser importado.
import L from 'leaflet'

;(globalThis as { L?: typeof L }).L = L

export default L
