// Utilidad para subir imágenes a Cloudinary desde el cliente (frontend).
// Usa un upload preset "unsigned" para no exponer el API secret.
// El preset debe estar configurado en Cloudinary → Settings → Upload → Add upload preset → Signing Mode: Unsigned.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

/** Resultado de una subida exitosa a Cloudinary. */
export interface CloudinaryUploadResult {
  /** ID público de la imagen en Cloudinary (usado para eliminar/transformar). */
  public_id: string
  /** URL segura (HTTPS) de la imagen lista para usar. */
  secure_url: string
}

/**
 * Sube un archivo de imagen a Cloudinary usando el preset unsigned configurado.
 * @param file - Archivo de imagen a subir (File proveniente de input o drag-drop).
 * @returns Promise con { public_id, secure_url } de la imagen subida.
 * @throws Error con mensaje descriptivo si la subida falla.
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Error al subir imagen a Cloudinary')
  }

  const data = await response.json()
  return {
    public_id: data.public_id,
    secure_url: data.secure_url,
  }
}
