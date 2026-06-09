import { AdminUsersManager } from "../../features/admin/components/AdminUsersManager"
import { ROLE_ESTUDIANTE } from "../../hooks/useRole"

export default function AdminStudentsPage() {
  return (
    <AdminUsersManager
      roleFilter={ROLE_ESTUDIANTE}
      createRoleName={ROLE_ESTUDIANTE}
      title="Alumnos"
      subtitle="Estudiantes registrados"
      entityLabel="alumno"
      showAcademicFields
    />
  )
}
