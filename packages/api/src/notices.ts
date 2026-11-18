// GET /api/v1/notices (B7, B3.3): avisos válidos registrados à mão, com
// crédito, link oficial e datas do último registro e da última conferência.
import { formatUtc } from '@mariners-compass/core'
import type { BaseContext } from './context.ts'
import { ATTRIBUTION_NAVY, cachePublic, json, NAVY_BULLETIN_URL } from './http.ts'

export async function handleNotices(ctx: BaseContext): Promise<Response> {
  const nowIso = formatUtc(ctx.now())
  const [notices, lastRegistered, lastChecked] = await Promise.all([
    ctx.store.validNotices(nowIso),
    ctx.store.lastRegisteredAt(),
    ctx.store.lastCheckedAt(),
  ])
  return json(
    {
      meta: {
        source: 'Marinha do Brasil, CHM/DHN',
        attribution: [ATTRIBUTION_NAVY],
        bulletin_url: NAVY_BULLETIN_URL,
        last_registered_at: lastRegistered,
        last_checked_at: lastChecked,
        updated_at: nowIso,
      },
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        issued_at: n.issued_at,
        valid_until: n.valid_until,
        source_url: n.source_url,
        registered_at: n.registered_at,
      })),
    },
    { headers: cachePublic(ctx.cfg.noticesCacheS) },
  )
}
