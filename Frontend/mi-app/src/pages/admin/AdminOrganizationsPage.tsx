import { AdminUsersManager } from "../../features/admin/components/AdminUsersManager"
import { ROLE_ORGANIZACION } from "../../hooks/useRole"

export default function AdminOrganizationsPage() {
  return (
    <AdminUsersManager
      roleFilter={ROLE_ORGANIZACION}
      createRoleName={ROLE_ORGANIZACION}
      title="Organizaciones"
      subtitle="Organizaciones estudiantiles"
      entityLabel="organización"
      showDescription
    />
  )
}
