import api from "./axios"

export type AnalyticsEventType =
  | "app_opened"
  | "login"
  | "logout"
  | "page_view"
  | "feed_viewed"
  | "post_created"
  | "post_viewed"
  | "post_liked"
  | "post_commented"
  | "profile_viewed"
  | "organization_viewed"
  | "notification_opened"
  | "search_performed"
  | "event_viewed"
  | "session_started"
  | "session_ended"

export async function trackActivityEvent(
  event_type: AnalyticsEventType,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await api.post("/analytics/events", { event_type, metadata })
  } catch {
    /* fire-and-forget */
  }
}
