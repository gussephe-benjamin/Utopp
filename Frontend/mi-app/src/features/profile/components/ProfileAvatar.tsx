import { useEffect, useState } from "react"
import { resolveAvatarUrl } from "../../../shared/lib/cloudinaryUrl"
import { getAvatarInitial, getUserAvatarGradient } from "../../../shared/lib/avatarUtils"

const SIZE_CLASS = {
  xs: "h-8 w-8 text-sm",
  sm: "h-9 w-9 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-28 w-28 text-4xl md:h-32 md:w-32",
} as const

type ProfileAvatarSize = keyof typeof SIZE_CLASS

type ProfileAvatarProps = {
  name?: string | null
  userId?: number | null
  imageUrl?: string | null
  size?: ProfileAvatarSize
  className?: string
  fallbackClassName?: string
  imageClassName?: string
}

export function ProfileAvatar({
  name,
  userId,
  imageUrl,
  size = "xs",
  className = "",
  fallbackClassName,
  imageClassName = "",
}: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const resolvedUrl = resolveAvatarUrl(imageUrl)
  const initial = getAvatarInitial(name)
  const gradient = fallbackClassName ?? getUserAvatarGradient(userId)
  const sizeClass = SIZE_CLASS[size]

  useEffect(() => {
    setImageFailed(false)
  }, [imageUrl])

  const showImage = Boolean(resolvedUrl) && !imageFailed

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${sizeClass} ${className}`}
      aria-hidden={!name}
    >
      {showImage ? (
        <img
          src={resolvedUrl!}
          alt=""
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-bold text-white select-none ${gradient}`}
        >
          {initial}
        </div>
      )}
    </div>
  )
}
