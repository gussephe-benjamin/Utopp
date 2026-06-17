import { parseObjectPositionPercent } from "../../../shared/lib/avatarUtils"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"))
    img.src = src
  })
}

export type AvatarCropState = {
  objectPosition: string
  scale: number
}

/** Exporta un recorte cuadrado (object-fit: cover + posición + zoom) como JPEG. */
export async function exportCroppedAvatar(
  imageSource: string,
  crop: AvatarCropState,
  outputSize = 512,
): Promise<File> {
  const img = await loadImage(imageSource)
  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo preparar el recorte")

  const [rawX = "50%", rawY = "50%"] = crop.objectPosition.split(" ")
  const posX = parseObjectPositionPercent(rawX) / 100
  const posY = parseObjectPositionPercent(rawY) / 100
  const scale = Math.max(1, crop.scale)

  const coverScale = Math.max(outputSize / img.naturalWidth, outputSize / img.naturalHeight) * scale
  const drawW = img.naturalWidth * coverScale
  const drawH = img.naturalHeight * coverScale
  const offsetX = (outputSize - drawW) * posX
  const offsetY = (outputSize - drawH) * posY

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, outputSize, outputSize)
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("No se pudo exportar la imagen"))),
      "image/jpeg",
      0.92,
    )
  })

  return new File([blob], "avatar.jpg", { type: "image/jpeg" })
}
