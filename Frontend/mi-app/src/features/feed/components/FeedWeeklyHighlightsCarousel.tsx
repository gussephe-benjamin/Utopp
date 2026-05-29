import { useWeeklyFeedHighlights } from "../hooks/useWeeklyFeedHighlights"
import { getOrgAvatarStyle, formatDeadlineBadge } from "../lib/weeklyHighlightUtils"
import { useNavigate } from "react-router-dom"
import { Trophy, Calendar as CalendarIcon } from "lucide-react"
import { profilePath } from "../../profile/lib/profileNavigation"
import { TW_UTOPP_GRADIENT_R } from "../../../shared/constants/brand"
import { WEEKLY_ORGS_TITLE } from "../constants/weeklyHighlights"

/** Carrusel desactivado en feed principal móvil, trasladado a la pestaña Explorar. */
export function FeedWeeklyHighlightsCarousel() {
  return null
}
