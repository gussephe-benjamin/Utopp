import type { AtRiskStudent } from "../../../api/adminAnalytics.api"
import { RISK_BADGE } from "./metricsUtils"

export function AtRiskStudentsTable({ rows }: { rows: AtRiskStudent[] }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white shadow-sm">
      <div className="border-b border-red-50 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Alumnos en riesgo</h3>
        <p className="mt-1 text-xs text-gray-500">
          Alumnos con baja o nula actividad reciente.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Organización</th>
              <th className="px-4 py-3">Último acceso</th>
              <th className="px-4 py-3">Días inactivo</th>
              <th className="px-4 py-3">Sesiones previas</th>
              <th className="px-4 py-3">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No hay alumnos en riesgo para los filtros actuales.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.studentId} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.organization ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.lastActivityAt
                      ? new Date(r.lastActivityAt).toLocaleDateString("es-PE")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{r.inactiveDays ?? "—"}</td>
                  <td className="px-4 py-3">{r.previousSessions}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RISK_BADGE[r.riskLevel] ?? "bg-gray-100"}`}
                    >
                      {r.riskLevel}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
