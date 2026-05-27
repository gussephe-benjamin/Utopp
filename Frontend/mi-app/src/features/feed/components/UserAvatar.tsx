// ─── Avatar feed: Cloudinary / localStorage / iniciales con gradiente ─────
// Mantiene hover opacity + transition como en el feed monolítico.

import { useNavigate } from "react-router-dom";

type UserAvatarProps = {
  userName?: string;
  userId?: number;
  gradient: string;
  profileImageUrl?: string;
  currentUserId: number | null;
};

/** Avatar: foto en localStorage/Cloudinary o iniciales con gradiente */
export function UserAvatar({
  userName,
  userId,
  gradient,
  profileImageUrl,
  currentUserId,
}: UserAvatarProps) {
  const navigate = useNavigate();
  const avatarUrl = profileImageUrl ?? (userId ? localStorage.getItem(`avatar_${userId}`) : null);
  const initial = (userName ?? "U").charAt(0).toUpperCase();
  const handleClick = () => {
    if (!userId) return;
    navigate(userId === currentUserId ? "/app/perfil" : `/app/perfil/${userId}`);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="shrink-0 focus:outline-none relative p-[2px] rounded-full bg-gradient-to-tr from-[#2f55f6] to-[#ba4ef8] hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm"
    >
      <div className="rounded-full bg-white p-[1.5px] flex items-center justify-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName ?? "Usuario"}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className={`w-8 h-8 ${gradient} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
            {initial}
          </div>
        )}
      </div>
    </button>
  );
}

