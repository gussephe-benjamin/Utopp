import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getActivityTimeseries,
  getAnalyticsSummary,
  getAtRiskStudents,
  getEngagementTimeseries,
  getOrganizationsActivity,
  getStudentsMetrics,
  type AnalyticsSummary,
  type ActivityTimeseriesPoint,
  type AtRiskStudent,
  type EngagementTimeseriesPoint,
  type OrganizationActivity,
  type StudentMetricsRow,
} from "../../../api/adminAnalytics.api"
import { getAdminUsers } from "../../../api/admin.api"
import { ROLE_ORGANIZACION } from "../../../hooks/useRole"
import type { DatePreset } from "./metricsUtils"
import { getDateRange } from "./metricsUtils"

export function useAdminMetrics() {
  const [preset, setPreset] = useState<DatePreset>("last30")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [organizationId, setOrganizationId] = useState<number | "">("")
  const [status, setStatus] = useState("")
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("activityScore")
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([])

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [activity, setActivity] = useState<ActivityTimeseriesPoint[]>([])
  const [engagement, setEngagement] = useState<EngagementTimeseriesPoint[]>([])
  const [orgsActivity, setOrgsActivity] = useState<OrganizationActivity[]>([])
  const [students, setStudents] = useState<StudentMetricsRow[]>([])
  const [studentsPages, setStudentsPages] = useState(1)
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([])

  const range = useMemo(
    () => getDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  )

  const queryBase = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      organizationId: organizationId === "" ? undefined : organizationId,
      status: status || undefined,
      groupBy,
    }),
    [range, organizationId, status, groupBy],
  )

  useEffect(() => {
    void getAdminUsers({ role: ROLE_ORGANIZACION, page: 1, size: 100 })
      .then((res) =>
        setOrganizations(
          res.items.map((o) => ({
            id: o.id,
            name: o.full_name || o.email,
          })),
        ),
      )
      .catch(() => setOrganizations([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [s, a, e, o, st, risk] = await Promise.all([
        getAnalyticsSummary(queryBase),
        getActivityTimeseries(queryBase),
        getEngagementTimeseries(queryBase),
        getOrganizationsActivity({ from: queryBase.from, to: queryBase.to }),
        getStudentsMetrics({
          ...queryBase,
          search: search || undefined,
          sort,
          page,
          limit: 20,
        }),
        getAtRiskStudents({
          organizationId: queryBase.organizationId,
          inactiveDays: 7,
        }),
      ])
      setSummary(s)
      setActivity(a)
      setEngagement(e)
      setOrgsActivity(o)
      setStudents(st.data)
      setStudentsPages(st.pagination.totalPages || 1)
      setAtRisk(risk)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [queryBase, search, sort, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [preset, organizationId, status, search, sort])

  const isEmpty =
    !loading &&
    !error &&
    summary &&
    summary.totalSessions === 0 &&
    summary.totalInteractions === 0 &&
    activity.length === 0

  return {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    organizationId,
    setOrganizationId,
    organizations,
    status,
    setStatus,
    groupBy,
    setGroupBy,
    search,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
    loading,
    error,
    isEmpty,
    summary,
    activity,
    engagement,
    orgsActivity,
    students,
    studentsPages,
    atRisk,
    refetch: load,
  }
}
