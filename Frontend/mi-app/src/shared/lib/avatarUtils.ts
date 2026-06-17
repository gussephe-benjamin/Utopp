const USER_AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-violet-500 to-indigo-600",
  "bg-gradient-to-br from-blue-500 to-cyan-500",
  "bg-gradient-to-br from-fuchsia-500 to-violet-600",
  "bg-gradient-to-br from-indigo-500 to-blue-600",
  "bg-gradient-to-br from-purple-500 to-pink-500",
  "bg-gradient-to-br from-sky-500 to-indigo-500",
] as const

export function getAvatarInitial(name?: string | null): string {
  const trimmed = name?.trim()
  if (!trimmed) return "U"
  return trimmed.charAt(0).toUpperCase()
}

export function getUserAvatarGradient(userId?: number | null): string {
  const index = Math.abs(userId ?? 0) % USER_AVATAR_GRADIENTS.length
  return USER_AVATAR_GRADIENTS[index]
}

export function parseObjectPositionPercent(value: string | undefined, fallback = 50): number {
  if (!value) return fallback
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
