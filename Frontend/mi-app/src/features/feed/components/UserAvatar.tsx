// ─── Avatar feed: Cloudinary / localStorage / iniciales con gradiente ─────

import { ProfileLink } from "../../profile/components/ProfileLink";
import { ProfileAvatar } from "../../profile/components/ProfileAvatar";
import { TW_UTOPP_GRADIENT_BR } from "../../../shared/constants/brand";

type UserAvatarProps = {
  userName?: string;
  userId?: number;
  gradient: string;
  profileImageUrl?: string;
  currentUserId: number | null;
};

const avatarRingClass =
  "shrink-0 focus:outline-none relative p-[2px] rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm";

/** Avatar: foto en localStorage/Cloudinary o iniciales con gradiente */
export function UserAvatar({
  userName,
  userId,
  gradient,
  profileImageUrl,
  currentUserId,
}: UserAvatarProps) {
  const rawAvatarUrl = profileImageUrl ?? (userId ? localStorage.getItem(`avatar_${userId}`) : null);

  const avatarNode = (
    <div className="rounded-full bg-white p-[1.5px] flex items-center justify-center">
      <ProfileAvatar
        name={userName}
        userId={userId}
        imageUrl={rawAvatarUrl}
        size="xs"
        fallbackClassName={gradient || TW_UTOPP_GRADIENT_BR}
      />
    </div>
  );

  if (!userId) {
    return (
      <div className={`${avatarRingClass} ${TW_UTOPP_GRADIENT_BR}`}>
        {avatarNode}
      </div>
    );
  }

  return (
    <ProfileLink
      userId={userId}
      currentUserId={currentUserId}
      className={`${avatarRingClass} ${TW_UTOPP_GRADIENT_BR}`}
      aria-label={`Ver perfil de ${userName ?? "usuario"}`}
    >
      {avatarNode}
    </ProfileLink>
  );
}
