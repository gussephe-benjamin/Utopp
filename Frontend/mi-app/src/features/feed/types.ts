import type { Dispatch, SetStateAction } from "react"

export type FeedViewProps = {
  filtersSheetOpen?: boolean
  onCloseFiltersSheet?: () => void
  filterPopoverAnchor?: import("../dashboard/popoverAnchor").MenuPopoverAnchor | null
  onCategoryFiltersActiveChange?: (active: boolean) => void
  onOpenCreate?: () => void
}

export type FeedSortOrder = "urgency" | "recent" | "recommended"

export type FeedFiltersPanelProps = {
  statusFilter: string | undefined
  setStatusFilter: (v: string | undefined) => void
  sortOrder: FeedSortOrder
  setSortOrder: (v: FeedSortOrder) => void
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
