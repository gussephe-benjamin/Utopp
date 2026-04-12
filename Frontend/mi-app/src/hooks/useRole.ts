import { useState, useEffect } from 'react'
import { getMyRoles } from '../api/roles.api'
import { type PostType } from '../types/post.types'

/** Nombres canónicos de roles del sistema (deben coincidir con el backend). */
export const ROLE_ESTUDIANTE  = 'estudiante'
export const ROLE_ORGANIZACION = 'organización estudiantil'
export const ROLE_OFICINA     = 'oficina'
export const ROLE_ADMIN       = 'administrador'
export const ROLE_ROOT        = 'root'

/** Tipos de publicación permitidos por rol. */
export const ALLOWED_TYPES_BY_ROLE: Record<string, PostType[]> = {
  [ROLE_ORGANIZACION]: ['event', 'announcement'],
  [ROLE_OFICINA]:      ['event', 'international_opportunity', 'announcement'],
  [ROLE_ADMIN]:        ['international_opportunity', 'event', 'academic_project', 'announcement', 'simple_post'],
  [ROLE_ROOT]:         ['international_opportunity', 'event', 'academic_project', 'announcement', 'simple_post'],
}

interface UseRoleResult {
  /** Nombre del rol del usuario autenticado (null mientras carga o si no tiene rol). */
  roleName: string | null
  /** true mientras se está fetching el rol. */
  loading: boolean
  /** Tipos de publicación que puede crear el usuario (vacío = no puede crear nada). */
  allowedTypes: PostType[]
  /** true si el usuario puede abrir el wizard de creación. */
  canCreate: boolean
}

/**
 * Hook que obtiene el rol del usuario autenticado desde GET /roles/me
 * y deriva los permisos de creación de publicaciones.
 */
export function useRole(): UseRoleResult {
  const [roleName, setRoleName] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    getMyRoles()
      .then(roles => {
        if (cancelled) return
        setRoleName(roles[0]?.name ?? null)
      })
      .catch(() => {
        if (!cancelled) setRoleName(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const allowedTypes = roleName ? (ALLOWED_TYPES_BY_ROLE[roleName] ?? []) : []
  const canCreate    = allowedTypes.length > 0

  return { roleName, loading, allowedTypes, canCreate }
}
