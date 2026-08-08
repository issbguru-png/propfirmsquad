'use client'

/**
 * The promo code, shown as plain selectable text with a copy button beside it.
 *
 * Deliberately NOT a reveal-gate: the code is in the HTML on first paint, so it
 * works with JS off, for screen readers, and for anyone who would rather select
 * it by hand. The button is a convenience, never the only way through.
 *
 * Copy path degrades: async Clipboard API → execCommand('copy') on a hidden
 * textarea → an honest "select it above" message. It never claims success it
 * did not achieve.
 *
 * Shared by /deals and /prop-firms/[slug]/promo-code. Deliberately NOT
 * re-exported from ./index.ts: that barrel is server-component-only, and
 * pulling a 'use client' module into it would drag the boundary into every
 * page that imports any component. Import it directly from
 * '@/components/CopyCode'.
 */
import { useEffect, useRef, useState } from 'react'

type State = 'idle' | 'copied' | 'failed'

/** Legacy fallback for non-secure contexts, where navigator.clipboard is undefined. */
function execCommandCopy(text: string): boolean {
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.top = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export function CopyCode({ code, size = 'lg' }: { code: string; size?: 'lg' | 'sm' }) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  const flash = (next: State) => {
    setState(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2500)
  }

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
        flash('copied')
        return
      }
    } catch {
      // fall through to the legacy path
    }
    flash(execCommandCopy(code) ? 'copied' : 'failed')
  }

  const big = size === 'lg'

  return (
    <div>
      <div
        className={`inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border-2 border-dashed border-accent bg-accent-pale ${
          big ? 'px-5 py-3' : 'px-4 py-2'
        }`}
      >
        <span>
          <span
            className={`block font-bold tracking-widest text-accent-dark uppercase ${
              big ? 'text-[11px]' : 'text-[10px]'
            }`}
          >
            Code
          </span>
          <code
            className={`block font-black tracking-wider text-ink select-all ${
              big ? 'text-2xl sm:text-3xl' : 'text-lg'
            }`}
          >
            {code}
          </code>
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy promo code ${code}`}
          className={`inline-flex items-center gap-1.5 rounded-sm border border-accent/40 bg-card font-bold text-accent-dark transition-colors hover:bg-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            big ? 'px-4 py-3 text-sm sm:py-2' : 'px-3 py-3 text-xs sm:py-1.5'
          }`}
        >
          {state === 'copied' ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <p
        aria-live="polite"
        className={`mt-1.5 text-xs ${state === 'failed' ? 'text-negative' : 'text-ink-2'}`}
      >
        {state === 'copied'
          ? `Copied ${code} to your clipboard.`
          : state === 'failed'
            ? 'Could not reach your clipboard. Select the code above and copy it by hand.'
            : ''}
      </p>
    </div>
  )
}
