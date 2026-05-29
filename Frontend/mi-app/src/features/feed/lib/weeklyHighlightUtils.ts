export const ORG_AVATAR_STYLES = [
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-purple-100 text-purple-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-fuchsia-100 text-fuchsia-700",
] as const

export function getOrgAvatarStyle(id: number): string {
  return ORG_AVATAR_STYLES[id % ORG_AVATAR_STYLES.length]
}

export function formatDeadlineBadge(dateStr: string) {
  const date = new Date(dateStr)
  const daysOfWeek = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"]
  return {
    dayName: daysOfWeek[date.getDay()],
    dayNumber: date.getDate(),
  }
}
