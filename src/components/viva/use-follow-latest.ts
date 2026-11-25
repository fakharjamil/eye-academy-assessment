import { useEffect, useRef } from 'react'

const NEAR_BOTTOM_PX = 80

/**
 * For a scrolling box (transcript, findings): when new content arrives, scroll the box to its
 * newest line, like a chat. If the trainee has scrolled up inside the box to reread, leave it alone.
 */
export function useFollowLatest<T extends HTMLElement>(contentKey: string) {
  const box = useRef<T>(null)
  const following = useRef(true)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const onScroll = () => {
      following.current = el.scrollHeight - (el.scrollTop + el.clientHeight) < NEAR_BOTTOM_PX
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = box.current
    if (el && following.current) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [contentKey])

  return box
}
