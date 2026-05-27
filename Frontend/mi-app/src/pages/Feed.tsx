import StudentFeedPage from "./StudentFeedPage"
import type { FeedViewProps } from "../features/feed/types"

/**
 * Compatibilidad temporal: `Feed` ahora delega a la página de feed de estudiantes.
 */
export default function Feed(props: FeedViewProps) {
  return <StudentFeedPage {...props} />
}

export type FeedProps = FeedViewProps
