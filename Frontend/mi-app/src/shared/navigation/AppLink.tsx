import { forwardRef } from "react"
import { Link, type LinkProps } from "react-router-dom"

/**
 * Enlace interno de la app. Compatible con clic central y «Abrir en nueva pestaña».
 */
export const AppLink = forwardRef<HTMLAnchorElement, LinkProps>(function AppLink(props, ref) {
  return <Link ref={ref} {...props} />
})
