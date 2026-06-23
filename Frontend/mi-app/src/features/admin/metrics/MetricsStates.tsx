export function MetricsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-2xl bg-gray-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-80 rounded-2xl bg-gray-100" />
        <div className="h-80 rounded-2xl bg-gray-100" />
      </div>
      <div className="h-64 rounded-2xl bg-gray-100" />
    </div>
  )
}

export function MetricsEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center text-sm text-gray-500">
      Todavía no hay actividad registrada para el período seleccionado.
    </div>
  )
}

export function MetricsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center">
      <p className="text-sm text-red-700">No pudimos cargar las métricas. Intenta nuevamente.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </div>
  )
}
