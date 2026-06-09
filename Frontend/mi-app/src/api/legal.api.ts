import api from "./axios"

export interface TermsCurrent {
  id: number
  slug: string
  version: string
  title: string | null
  effective_at: string
  published_at: string
  content: string
  content_sha256: string | null
}

export async function getCurrentTerms(): Promise<TermsCurrent> {
  const { data } = await api.get<TermsCurrent>("/legal/terms/current")
  return data
}

export async function getCurrentPrivacy(): Promise<TermsCurrent> {
  const { data } = await api.get<TermsCurrent>("/legal/privacy/current")
  return data
}

export interface AcceptLegalPart {
  legal_document_id: number
  accepted_at: string
}

export interface AcceptLegalResponse {
  ok: boolean
  terms?: AcceptLegalPart
  privacy?: AcceptLegalPart
}

export async function acceptLegal(params: {
  termsDocumentId?: number | null
  privacyDocumentId?: number | null
  /** Alias compatible con el backend (solo términos) */
  documentId?: number | null
}): Promise<AcceptLegalResponse> {
  const body: Record<string, number> = {}
  if (params.termsDocumentId != null) body.terms_document_id = params.termsDocumentId
  if (params.privacyDocumentId != null) body.privacy_document_id = params.privacyDocumentId
  if (params.documentId != null) body.document_id = params.documentId
  const { data } = await api.post<AcceptLegalResponse>("/legal/accept", body)
  return data
}

export async function acceptTerms(documentId: number): Promise<AcceptLegalResponse> {
  return acceptLegal({ documentId })
}

// ─── Edición (admin/root) ────────────────────────────────

/**
 * PUT /legal/terms
 * Actualiza en sitio el contenido de los Términos vigentes. Auth: admin/root.
 */
export async function updateTerms(params: { content: string; title?: string | null }): Promise<TermsCurrent> {
  const body: Record<string, string> = { content: params.content }
  if (params.title != null) body.title = params.title
  const { data } = await api.put<TermsCurrent>("/legal/terms", body)
  return data
}

/**
 * PUT /legal/privacy
 * Actualiza en sitio el contenido de la Política de privacidad vigente. Auth: admin/root.
 */
export async function updatePrivacy(params: { content: string; title?: string | null }): Promise<TermsCurrent> {
  const body: Record<string, string> = { content: params.content }
  if (params.title != null) body.title = params.title
  const { data } = await api.put<TermsCurrent>("/legal/privacy", body)
  return data
}
