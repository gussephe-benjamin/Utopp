import { Link, type LinkProps } from "react-router-dom"
import { profilePath } from "../lib/profileNavigation"

export type ProfileLinkProps = Omit<LinkProps, "to"> & {
  userId: number
  currentUserId: number | null | undefined
  /** Abre el perfil con el modal/detalle de esta publicación. */
  postId?: number
}

/**
 * Enlace SPA a perfil propio o ajeno. Compatible con clic central, Ctrl+clic y menú «Abrir en nueva pestaña».
 */
export function ProfileLink({ userId, currentUserId, postId, ...props }: ProfileLinkProps) {
  const base = profilePath(userId, currentUserId)
  const to = postId != null ? `${base}?postId=${postId}` : base
  return <Link to={to} {...props} />
}
