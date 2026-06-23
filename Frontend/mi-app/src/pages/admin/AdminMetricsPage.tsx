import {
  Activity,
  Clock,
  Heart,
  MessageCircle,
  MousePointerClick,
  TrendingUp,
  UserMinus,
  Users,
  Zap,
} from "lucide-react"
import { AtRiskStudentsTable } from "../../features/admin/metrics/AtRiskStudentsTable"
import {
  ActivityLineChart,
  EngagementStackedBarChart,
  OrganizationActivityChart,
  SessionDurationChart,
} from "../../features/admin/metrics/MetricsCharts"
import { MetricsFilters } from "../../features/admin/metrics/MetricsFilters"
import { MetricsKpiCard } from "../../features/admin/metrics/MetricsKpiCard"
import {
  MetricsEmptyState,
  MetricsErrorState,
  MetricsSkeleton,
} from "../../features/admin/metrics/MetricsStates"
import { StudentsMetricsTable } from "../../features/admin/metrics/StudentsMetricsTable"
import { formatDuration } from "../../features/admin/metrics/metricsUtils"
import { useAdminMetrics } from "../../features/admin/metrics/useAdminMetrics"

export default function AdminMetricsPage() {
  const m = useAdminMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Analiza la actividad, permanencia e interacción de los alumnos en Utopp.
        </p>
      </div>

      <MetricsFilters
        preset={m.preset}
        onPresetChange={m.setPreset}
        customFrom={m.customFrom}
        customTo={m.customTo}
        onCustomFromChange={m.setCustomFrom}
        onCustomToChange={m.setCustomTo}
        organizationId={m.organizationId}
        onOrganizationChange={m.setOrganizationId}
        organizations={m.organizations}
        status={m.status}
        onStatusChange={m.setStatus}
        groupBy={m.groupBy}
        onGroupByChange={m.setGroupBy}
      />

      {m.loading ? <MetricsSkeleton /> : null}
      {m.error ? <MetricsErrorState onRetry={() => void m.refetch()} /> : null}
      {!m.loading && !m.error && m.isEmpty ? <MetricsEmptyState /> : null}

      {!m.loading && !m.error && m.summary && !m.isEmpty ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricsKpiCard title="Alumnos activos hoy" value={m.summary.activeToday} icon={Users} />
            <MetricsKpiCard title="Activos últimos 7 días" value={m.summary.activeLast7Days} icon={TrendingUp} />
            <MetricsKpiCard title="Activos últimos 30 días" value={m.summary.activeLast30Days} icon={Activity} />
            <MetricsKpiCard
              title="Tiempo promedio de sesión"
              value={formatDuration(Math.round(m.summary.averageSessionDurationSeconds))}
              icon={Clock}
            />
            <MetricsKpiCard title="Sesiones totales" value={m.summary.totalSessions} icon={Zap} trend={m.summary.trends?.totalSessions ?? null} trendLabel="vs período anterior" />
            <MetricsKpiCard
              title="Promedio sesiones / alumno"
              value={m.summary.sessionsPerActiveStudent}
              icon={MousePointerClick}
            />
            <MetricsKpiCard title="Alumnos inactivos" value={m.summary.inactiveStudents} icon={UserMinus} />
            <MetricsKpiCard title="Publicaciones creadas" value={m.summary.postsCreated} icon={TrendingUp} />
            <MetricsKpiCard title="Comentarios" value={m.summary.commentsCreated} icon={MessageCircle} />
            <MetricsKpiCard title="Reacciones" value={m.summary.reactionsCreated} icon={Heart} />
            <MetricsKpiCard title="Interacciones totales" value={m.summary.totalInteractions} icon={Activity} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Actividad de alumnos</h3>
              <ActivityLineChart data={m.activity} />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Tiempo promedio de permanencia</h3>
              <SessionDurationChart data={m.activity} />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Engagement</h3>
              <EngagementStackedBarChart data={m.engagement} />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Actividad por organización</h3>
              <OrganizationActivityChart data={m.orgsActivity} />
            </div>
          </div>

          <StudentsMetricsTable
            rows={m.students}
            search={m.search}
            onSearchChange={m.setSearch}
            sort={m.sort}
            onSortChange={m.setSort}
            page={m.page}
            totalPages={m.studentsPages}
            onPageChange={m.setPage}
          />

          <AtRiskStudentsTable rows={m.atRisk} />
        </>
      ) : null}
    </div>
  )
}
