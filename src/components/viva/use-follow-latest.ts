import { useEffect, useRef } from 'react'

const NEAR_BOTTOM_PX = 160

/**
 * Keeps the newest transcript line in view while the viva is live, but only if the trainee is
 * already at the bottom: scrolling up to reread something is never interrupted.
 */
export function useFollowLatest(active: boolean, contentKey: string) {
  const anchor = useRef<HTMLDivElement>(null)
  const following = useRef(true)

  useEffect(() => {
    const onScroll = () => {
      const fromBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight)
      following.current = fromBottom < NEAR_BOTTOM_PX
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (active && following.current) anchor.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [active, contentKey])

  return anchor
}
