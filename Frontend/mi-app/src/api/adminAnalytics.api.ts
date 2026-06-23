import api from "./axios"

export interface AnalyticsSummary {
  activeToday: number
  activeLast7Days: number
  activeLast30Days: number
  totalSessions: number
  averageSessionDurationSeconds: number
  sessionsPerActiveStudent: number
  inactiveStudents: number
  postsCreated: number
  commentsCreated: number
  reactionsCreated: number
  totalInteractions: number
  trends?: Record<string, { percent: number; direction: string } | null>
}

export interface ActivityTimeseriesPoint {
  date: string
  activeStudents: number
  sessions: number
  averageSessionDurationSeconds: number
}

export interface EngagementTimeseriesPoint {
  date: string
  postsCreated: number
  commentsCreated: number
  reactionsCreated: number
  totalInteractions: number
}

export interface OrganizationActivity {
  organizationId: number
  organizationName: string
  activeStudents: number
  totalStudents: number
  activationRate: number
  sessions: number
  averageSessionDurationSeconds: number
  totalInteractions: number
}

export interface StudentMetricsRow {
  studentId: number
  name: string
  email: string
  organization: string | null
  sessions: number
  totalDurationSeconds: number
  averageSessionDurationSeconds: number
  postsCreated: number
  commentsCreated: number
  reactionsCreated: number
  totalInteractions: number
  lastActivityAt: string | null
  status: string
  activityScore: number
}

export interface AtRiskStudent {
  studentId: number
  name: string
  email: string
  organization: string | null
  lastActivityAt: string | null
  inactiveDays: number | null
  previousSessions: number
  riskLevel: string
}

export interface MetricsQueryParams {
  from?: string
  to?: string
  organizationId?: number
  status?: string
  groupBy?: "day" | "week" | "month"
  search?: string
  page?: number
  limit?: number
  sort?: string
  inactiveDays?: number
}

function buildParams(params: MetricsQueryParams) {
  const q: Record<string, string | number> = {}
  if (params.from) q.from = params.from
  if (params.to) q.to = params.to
  if (params.organizationId != null) q.organizationId = params.organizationId
  if (params.status) q.status = params.status
  if (params.groupBy) q.groupBy = params.groupBy
  if (params.search) q.search = params.search
  if (params.page) q.page = params.page
  if (params.limit) q.limit = params.limit
  if (params.sort) q.sort = params.sort
  if (params.inactiveDays) q.inactiveDays = params.inactiveDays
  return q
}

export async function getAnalyticsSummary(params: MetricsQueryParams) {
  const { data } = await api.get<AnalyticsSummary>("/admin/analytics/summary", {
    params: buildParams(params),
  })
  return data
}

export async function getActivityTimeseries(params: MetricsQueryParams) {
  const { data } = await api.get<ActivityTimeseriesPoint[]>(
    "/admin/analytics/activity-timeseries",
    { params: buildParams(params) },
  )
  return data
}

export async function getEngagementTimeseries(params: MetricsQueryParams) {
  const { data } = await api.get<EngagementTimeseriesPoint[]>(
    "/admin/analytics/engagement-timeseries",
    { params: buildParams(params) },
  )
  return data
}

export async function getOrganizationsActivity(params: MetricsQueryParams) {
  const { data } = await api.get<OrganizationActivity[]>(
    "/admin/analytics/organizations",
    { params: buildParams(params) },
  )
  return data
}

export async function getStudentsMetrics(params: MetricsQueryParams) {
  const { data } = await api.get<{
    data: StudentMetricsRow[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>("/admin/analytics/students", { params: buildParams(params) })
  return data
}

export async function getAtRiskStudents(params: MetricsQueryParams) {
  const { data } = await api.get<AtRiskStudent[]>("/admin/analytics/at-risk-students", {
    params: buildParams(params),
  })
  return data
}
