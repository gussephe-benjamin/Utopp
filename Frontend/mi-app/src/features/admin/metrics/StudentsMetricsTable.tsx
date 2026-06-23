import type { StudentMetricsRow } from "../../../api/adminAnalytics.api"
import { formatDuration, STATUS_BADGE } from "./metricsUtils"

interface Props {
  rows: StudentMetricsRow[]
  search: string
  onSearchChange: (v: string) => void
  sort: string
  onSortChange: (v: string) => void
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}

export function StudentsMetricsTable({
  rows,
  search,
  onSearchChange,
  sort,
  onSortChange,
  page,
  totalPages,
  onPageChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Alumnos</h3>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Buscar nombre o email"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          >
            <option value="activityScore">Activity Score</option>
            <option value="lastActivityAt">Último acceso</option>
            <option value="sessions">Sesiones</option>
            <option value="totalDurationSeconds">Tiempo total</option>
            <option value="totalInteractions">Interacciones</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Organización</th>
              <th className="px-4 py-3">Sesiones</th>
              <th className="px-4 py-3">Tiempo total</th>
              <th className="px-4 py-3">Interacciones</th>
              <th className="px-4 py-3">Último acceso</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No hay alumnos registrados para los filtros seleccionados.
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
                  <td className="px-4 py-3">{r.sessions}</td>
                  <td className="px-4 py-3">{formatDuration(r.totalDurationSeconds)}</td>
                  <td className="px-4 py-3">{r.totalInteractions}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.lastActivityAt
                      ? new Date(r.lastActivityAt).toLocaleDateString("es-PE")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.activityScore}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 p-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  )
}
