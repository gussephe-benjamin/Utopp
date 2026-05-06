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
  if (avatarUrl) {
    return (
      <button type="button" onClick={handleClick} className="shrink-0 rounded-full focus:outline-none">
        <img
          src={avatarUrl}
          alt={userName ?? "Usuario"}
          className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
        />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-10 h-10 ${gradient} rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 hover:opacity-90 transition-opacity focus:outline-none`}
    >
      {initial}
    </button>
  );
}
