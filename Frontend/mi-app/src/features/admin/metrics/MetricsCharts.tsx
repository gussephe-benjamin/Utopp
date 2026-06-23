import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ActivityTimeseriesPoint, EngagementTimeseriesPoint, OrganizationActivity } from "../../../api/adminAnalytics.api"

export function ActivityLineChart({ data }: { data: ActivityTimeseriesPoint[] }) {
  if (!data.length) return <ChartEmpty />
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="activeStudents" name="Alumnos activos" stroke="#6D5DFC" strokeWidth={2} />
          <Line type="monotone" dataKey="sessions" name="Sesiones" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SessionDurationChart({ data }: { data: ActivityTimeseriesPoint[] }) {
  const chartData = data.map((d) => ({
    date: d.date,
    minutes: Math.round(d.averageSessionDurationSeconds / 60),
  }))
  if (!chartData.length) return <ChartEmpty />
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="minutes" name="Minutos promedio" stroke="#8B5CF6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EngagementStackedBarChart({ data }: { data: EngagementTimeseriesPoint[] }) {
  if (!data.length) return <ChartEmpty />
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="postsCreated" name="Publicaciones" stackId="a" fill="#6D5DFC" />
          <Bar dataKey="commentsCreated" name="Comentarios" stackId="a" fill="#3B82F6" />
          <Bar dataKey="reactionsCreated" name="Reacciones" stackId="a" fill="#A78BFA" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OrganizationActivityChart({ data }: { data: OrganizationActivity[] }) {
  if (!data.length) return <ChartEmpty message="No hay organizaciones disponibles." />
  const top = data.slice(0, 10)
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="organizationName" tick={{ fontSize: 10 }} width={75} />
          <Tooltip />
          <Bar dataKey="activeStudents" name="Alumnos activos" fill="#6D5DFC" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartEmpty({ message = "Todavía no hay actividad registrada para el período seleccionado." }: { message?: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500">
      {message}
    </div>
  )
}
