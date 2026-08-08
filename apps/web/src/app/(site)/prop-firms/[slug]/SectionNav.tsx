'use client'

/**
 * Sticky in-page section nav for firm profiles.
 * - Highlights the section currently in view (IntersectionObserver).
 * - Gains a subtle shadow only once it is actually stuck (sentinel trick).
 * - Optionally shows a compact promo chip on the right end of the bar.
 */
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export type SectionNavItem = { id: string; label: string }

export type SectionNavPromo = {
  code: string
  discountPct?: number | null
  href: string
}

export function SectionNav({
  sections,
  promo,
}: {
  sections: SectionNavItem[]
  promo?: SectionNavPromo | null
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [stuck, setStuck] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Active-section tracking: a section is "active" while its box crosses the
  // upper reading band of the viewport.
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)
    if (els.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-15% 0px -75% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  // Stuck detection: the 1px sentinel above the bar leaves the viewport
  // exactly when the sticky bar pins to the top.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <nav
        aria-label="On this page"
        className={`sticky top-0 z-10 -mx-4 mb-8 border-y border-line bg-page/95 px-4 backdrop-blur transition-shadow ${
          stuck ? 'shadow-md shadow-ink/10' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          {/*
            The bar's vertical padding lives on each <li>, not on the <ul>, so
            the full 46px bar height is part of every link's hit area: the
            anchors themselves are only ~21px tall, which is a hard target to
            hit on a phone in a bar that also scrolls sideways. The ::before
            overlay stretches the touch area to the <li> box while the visible
            underline stays tucked under the text, so nothing moves visually.
          */}
          <ul className="flex min-w-0 flex-1 gap-x-5 overflow-x-auto text-sm font-semibold whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((s) => (
              <li key={s.id} className="relative flex items-center py-3">
                <a
                  href={`#${s.id}`}
                  aria-current={activeId === s.id ? 'true' : undefined}
                  className={`border-b-2 pb-0.5 transition-colors before:absolute before:inset-0 before:content-[''] ${
                    activeId === s.id
                      ? 'border-accent text-accent-dark'
                      : 'border-transparent text-ink-2 hover:text-accent-dark'
                  }`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          {promo ? (
            <Link
              href={promo.href}
              className="my-1.5 shrink-0 rounded-sm border border-accent/30 bg-accent-pale px-2.5 py-3 text-xs font-bold whitespace-nowrap text-accent-dark transition-colors hover:border-accent sm:py-1"
            >
              {promo.code}
              {promo.discountPct != null ? `: ${promo.discountPct}% off` : ''} →
            </Link>
          ) : null}
        </div>
      </nav>
    </>
  )
}
