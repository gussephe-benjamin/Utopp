// ─── Avatar feed: Cloudinary / localStorage / iniciales con gradiente ─────

import { ProfileLink } from "../../profile/components/ProfileLink";
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

function AvatarContent({
  userName,
  gradient,
  avatarUrl,
  initial,
}: {
  userName?: string;
  gradient: string;
  avatarUrl: string | null;
  initial: string;
}) {
  return (
    <div className="rounded-full bg-white p-[1.5px] flex items-center justify-center">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={userName ?? "Usuario"}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div
          className={`w-8 h-8 ${gradient} rounded-full flex items-center justify-center text-white font-bold text-sm`}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

/** Avatar: foto en localStorage/Cloudinary o iniciales con gradiente */
export function UserAvatar({
  userName,
  userId,
  gradient,
  profileImageUrl,
  currentUserId,
}: UserAvatarProps) {
  const avatarUrl = profileImageUrl ?? (userId ? localStorage.getItem(`avatar_${userId}`) : null);
  const initial = (userName ?? "U").charAt(0).toUpperCase();

  if (!userId) {
    return (
      <div className={`${avatarRingClass} ${TW_UTOPP_GRADIENT_BR}`}>
        <AvatarContent userName={userName} gradient={gradient} avatarUrl={avatarUrl} initial={initial} />
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
      <AvatarContent userName={userName} gradient={gradient} avatarUrl={avatarUrl} initial={initial} />
    </ProfileLink>
  );
}
