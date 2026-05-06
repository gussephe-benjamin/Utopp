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

export async function acceptTerms(documentId: number): Promise<{
  ok: boolean
  legal_document_id: number
  accepted_at: string
}> {
  const { data } = await api.post("/legal/accept", { document_id: documentId })
  return data
}
