// Quadros da rodada e cache dos arquivos de grade, com pré-carga dos próximos
// quadros (B11: 3 à frente). Arquivos de rodada fechada são imutáveis.
import { getFrames, getGrid, type FramesResponse, type GridRecord, type LayerId, type RegionInfo } from './api.ts'

export const PRELOAD_AHEAD = 3

export class Forecast {
  frames: FramesResponse | null = null
  private readonly cache = new Map<string, Promise<GridRecord[]>>()
  private readonly ready = new Set<string>()

  async loadFrames(layer: LayerId): Promise<FramesResponse> {
    const frames = await getFrames(layer)
    if (this.frames?.meta.run_time !== frames.meta.run_time) {
      this.cache.clear()
      this.ready.clear()
    }
    this.frames = frames
    return frames
  }

  private key(layer: LayerId, region: RegionInfo, time: string): string {
    return `${this.frames?.meta.run_time}|${layer}|${region.id}|${time}`
  }

  grid(layer: LayerId, region: RegionInfo, index: number): Promise<GridRecord[]> {
    const frames = this.frames
    if (!frames) return Promise.reject(new Error('frames not loaded'))
    const time = frames.times[index]
    const key = this.key(layer, region, time)
    let p = this.cache.get(key)
    if (!p) {
      p = getGrid(layer, frames.meta.run_time, time, region)
      this.cache.set(key, p)
      p.then(
        () => this.ready.add(key),
        () => this.cache.delete(key),
      )
    }
    return p
  }

  isReady(layer: LayerId, region: RegionInfo, index: number): boolean {
    const time = this.frames?.times[index]
    return time !== undefined && this.ready.has(this.key(layer, region, time))
  }

  /** Pede os próximos quadros em segundo plano; falhas aqui não aparecem para o usuário. */
  preload(layer: LayerId, region: RegionInfo, index: number, ahead = PRELOAD_AHEAD): void {
    const last = (this.frames?.times.length ?? 0) - 1
    for (let i = index + 1; i <= Math.min(index + ahead, last); i++) {
      this.grid(layer, region, i).catch(() => undefined)
    }
  }
}
