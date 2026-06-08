import { Trophy } from "lucide-react"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { ProfileLink } from "../../profile/components/ProfileLink"
import type { OrganizationSummary } from "../../../api/users.api"
import { getOrgAvatarStyle } from "../lib/weeklyHighlightUtils"
import { WEEKLY_ORGS_TITLE } from "../constants/weeklyHighlights"
import { resolveOrgImageUrl } from "../../../shared/lib/cloudinaryUrl"

type WeeklyOrgsWidgetProps = {
  organizations: OrganizationSummary[]
  loading: boolean
  followedIds: Set<number>
  isStudent: boolean
  currentUserId: number | null
  actionLoadingId: number | null
  onFollowToggle: (orgId: number) => void
  compact?: boolean
}

function VerifiedBadge() {
  return (
    <svg className="h-3 w-3 shrink-0 fill-current text-blue-500" viewBox="0 0 24 24" aria-hidden>
      <title>Verificado</title>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  )
}

export function WeeklyOrgsWidget({
  organizations,
  loading,
  followedIds,
  isStudent,
  currentUserId,
  actionLoadingId,
  onFollowToggle,
  compact = false,
}: WeeklyOrgsWidgetProps) {
  return (
    <div className={compact ? "h-full" : "rounded-xl border border-gray-100 bg-white p-4 shadow-sm"}>
      <div className={`flex items-center gap-2 ${compact ? "mb-3 px-1" : "mb-3.5"}`}>
        <Trophy className="h-4 w-4 text-yellow-500" />
        <h4 className="text-sm font-bold text-gray-800">{WEEKLY_ORGS_TITLE}</h4>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-2.5">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100" />
              <div className="h-3 flex-1 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <p className="py-2 text-center text-xs text-gray-400">No hay organizaciones disponibles</p>
      ) : (
        <div className={`flex flex-col gap-3.5 ${compact ? "max-h-[220px] overflow-y-auto no-scrollbar" : ""}`}>
          {organizations.map((org) => {
            const initial = (org.full_name ?? "O").charAt(0).toUpperCase()
            const isFollowing = followedIds.has(org.id)
            const postText =
              org.posts_count === 1
                ? "1 publicación"
                : `${org.posts_count ?? 0} publicaciones`

            return (
              <div key={org.id} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <ProfileLink
                    userId={org.id}
                    currentUserId={currentUserId}
                    className="shrink-0 transition-transform hover:scale-105"
                  >
                    {org.profile_image_url ? (
                      <img
                        src={resolveOrgImageUrl(org.profile_image_url) ?? org.profile_image_url}
                        alt={org.full_name ?? "Organización"}
                        className="h-9 w-9 rounded-full border border-gray-100 object-cover shadow-sm"
                      />
                    ) : (
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${getOrgAvatarStyle(org.id)}`}
                      >
                        {initial}
                      </div>
                    )}
                  </ProfileLink>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <ProfileLink
                        userId={org.id}
                        currentUserId={currentUserId}
                        className="truncate text-xs font-bold text-gray-900 hover:text-[#2563EB]"
                      >
                        {org.full_name}
                      </ProfileLink>
                      <VerifiedBadge />
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-400">{postText}</p>
                  </div>
                </div>
                {isStudent ? (
                  <button
                    type="button"
                    onClick={() => onFollowToggle(org.id)}
                    disabled={actionLoadingId === org.id}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-bold shadow-sm transition-all active:scale-95 ${
                      isFollowing
                        ? "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        : `${TW_UTOPP_GRADIENT_R} text-white hover:brightness-105`
                    }`}
                  >
                    {actionLoadingId === org.id ? "..." : isFollowing ? "Siguiendo" : "Seguir"}
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
