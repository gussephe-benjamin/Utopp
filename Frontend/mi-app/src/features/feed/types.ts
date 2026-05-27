import type { Dispatch, SetStateAction } from "react"

export type FeedViewProps = {
  filtersSheetOpen?: boolean
  onCloseFiltersSheet?: () => void
  filterPopoverAnchor?: import("../dashboard/popoverAnchor").MenuPopoverAnchor | null
  onCategoryFiltersActiveChange?: (active: boolean) => void
  onOpenCreate?: () => void
}

export type FeedFiltersPanelProps = {
  statusFilter: string | undefined
  setStatusFilter: (v: string | undefined) => void
  sortOrder: "urgency" | "recent"
  setSortOrder: (v: "urgency" | "recent") => void
  selectedTags: string[]
  setSelectedTags: Dispatch<SetStateAction<string[]>>
}

export type FeedRoleName =
  | "estudiante"
  | "organización estudiantil"
  | "oficina"
  | "administrador"
  | "root"
  | "unknown"
