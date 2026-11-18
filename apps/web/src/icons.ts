// Ícones próprios (B10). A rosa dos ventos é o elemento marcante do app:
// 4 pontas cardeais longas, 4 colaterais curtas, metade cheia e metade vazada,
// como nas cartas náuticas. Cores por currentColor e --accent.

function point(len: number, half: number, angle: number, cls: string): string {
  return (
    `<g transform="rotate(${angle})" class="${cls}">` +
    `<polygon points="0,${-len} ${half},${-half} 0,0" class="rose-fill"/>` +
    `<polygon points="0,${-len} ${-half},${-half} 0,0" class="rose-hollow"/>` +
    `</g>`
  )
}

export function compassRoseSvg(): string {
  const cardinals = [0, 90, 180, 270].map((a) => point(44, 8, a, a === 0 ? 'rose-north' : 'rose-cardinal')).join('')
  const intercardinals = [45, 135, 225, 315].map((a) => point(28, 6, a, 'rose-inter')).join('')
  return (
    `<svg class="rose" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">` +
    `<circle r="47" class="rose-ring"/>` +
    `<circle r="40" class="rose-ticks"/>` +
    intercardinals +
    cardinals +
    `<circle r="3" class="rose-hub"/>` +
    `</svg>`
  )
}

export const ICONS = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wind: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  waves: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 9c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-1.7 5-1M2 15c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-1.7 5-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>',
} as const
