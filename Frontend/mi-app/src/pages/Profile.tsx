import ProfileModeResolver from "../features/profile/ProfileModeResolver"

export default function Profile({ viewUserId }: { viewUserId?: number } = {}) {
  return <ProfileModeResolver viewUserId={viewUserId} />
}
