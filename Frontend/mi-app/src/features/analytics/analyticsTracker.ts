import { trackActivityEvent, type AnalyticsEventType } from "../../api/analytics.api"

let enabled = false

export function setAnalyticsEnabled(value: boolean) {
  enabled = value
}

export function trackEvent(
  event_type: AnalyticsEventType,
  metadata?: Record<string, unknown>,
) {
  if (!enabled) return
  void trackActivityEvent(event_type, metadata)
}

const postViewedAt = new Map<number, number>()
const eventViewedAt = new Map<string, number>()

export function trackPostViewedThrottled(postId: number) {
  if (!enabled) return
  const now = Date.now()
  const last = postViewedAt.get(postId) ?? 0
  if (now - last < 5000) return
  postViewedAt.set(postId, now)
  window.setTimeout(() => {
    trackEvent("post_viewed", { post_id: postId })
  }, 2000)
}

const ONE_HOUR_MS = 60 * 60 * 1000

export function trackEventViewedThrottled(eventId: string) {
  if (!enabled || !eventId) return
  const now = Date.now()
  const last = eventViewedAt.get(eventId) ?? 0
  if (now - last < ONE_HOUR_MS) return
  eventViewedAt.set(eventId, now)
  trackEvent("event_viewed", { event_id: eventId })
}
