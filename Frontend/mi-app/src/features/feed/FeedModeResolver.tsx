import { useEffect, useState } from "react"
import { getMyRoles } from "../../api/roles.api"
import StudentFeedPage from "../../pages/StudentFeedPage"
import OrganizationFeedPage from "../../pages/OrganizationFeedPage"
import type { FeedRoleName, FeedViewProps } from "./types"

/**
 * Dispatcher de feed por rol actual.
 * Mantiene StudentFeed como default y enruta a OrganizationFeed cuando aplique.
 */
export default function FeedModeResolver(props: FeedViewProps) {
  const [role, setRole] = useState<FeedRoleName>("unknown")
  const [resolving, setResolving] = useState(true)

  useEffect(() => {
    let mounted = true
    setResolving(true)

    ;(async () => {
      try {
        const roles = await getMyRoles().catch(() => [])
        if (!mounted) return
        setRole(((roles[0]?.name as FeedRoleName) ?? "unknown") as FeedRoleName)
      } finally {
        if (mounted) setResolving(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  if (resolving) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-600">Cargando feed...</p>
      </div>
    )
  }

  if (role === "organización estudiantil") {
    return <OrganizationFeedPage {...props} />
  }

  return <StudentFeedPage {...props} />
}
