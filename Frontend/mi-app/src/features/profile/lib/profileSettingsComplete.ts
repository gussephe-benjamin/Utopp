import {
  countSelectedSlots,
  type WeeklyAvailabilityPayload,
} from "../../onboarding/lib/weeklyAvailability"

const MIN_INTERESTS = 3

export function isProfileSettingsIncomplete(input: {
  interests?: string[] | null
  availability?: number | null
  weekly_availability?: WeeklyAvailabilityPayload | null
}): boolean {
  const interests = input.interests ?? []
  const hasInterests = interests.length >= MIN_INTERESTS
  const hasAvailability = input.availability !== null && input.availability !== undefined
  const hasWeeklySlots =
    input.weekly_availability != null &&
    countSelectedSlots(input.weekly_availability) > 0

  return !hasInterests || !hasAvailability || !hasWeeklySlots
}
