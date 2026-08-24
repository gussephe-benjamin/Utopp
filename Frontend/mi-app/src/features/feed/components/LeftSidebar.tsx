import { useMemo, useState } from "react";
import { INTERESTS } from "../../../constants/interests";
import { AppLink } from "../../../shared/navigation/AppLink";
import { ProfileAvatar } from "../../profile/components/ProfileAvatar";
import { useResetOnChange } from "../../../hooks/useResetOnChange";

/** Referencia estable: evita bucle infinito cuando `interests` no se pasa como prop. */
const EMPTY_INTERESTS: string[] = []

type LeftSidebarProps = {
  userName?: string;
  avatarUrl?: string | null;
  userId?: number | null;
  career?: string | null;
  cycle?: number | null;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  interests?: string[];
  interestsSaving?: boolean;
  interestsError?: string | null;
  onSaveInterests?: (interests: string[]) => Promise<void>;
  /** "student" (por defecto) muestra carrera + intereses; "organization" muestra subtítulo de org y oculta intereses. */
  variant?: "student" | "organization";
};

export function LeftSidebar({
  userName,
  avatarUrl,
  userId,
  career,
  cycle,
  interests,
  interestsSaving = false,
  interestsError = null,
  onSaveInterests,
  variant = "student",
}: LeftSidebarProps) {
  const interestsList = interests ?? EMPTY_INTERESTS
  const [editingInterests, setEditingInterests] = useState(false)
  const [draftInterests, setDraftInterests] = useState<string[]>(interestsList)

  const isOrganization = variant === "organization";
  const displayName = userName ?? (isOrganization ? "Organización" : "Usuario");
  const academicLine = isOrganization
    ? "Organización estudiantil"
    : [career, cycle ? `Ciclo ${cycle}` : null].filter(Boolean).join(" · ");
  const selectedInterests = useMemo(
    () => INTERESTS.filter((interest) => interestsList.includes(interest.id)),
    [interestsList],
  )

  useResetOnChange([editingInterests, interestsList], () => {
    if (editingInterests) return
    setDraftInterests((prev) => {
      if (
        prev.length === interestsList.length &&
        prev.every((id, i) => id === interestsList[i])
      ) {
        return prev
      }
      return [...interestsList]
    })
  })

  const toggleInterest = (interestId: string) => {
    setDraftInterests((prev) =>
      prev.includes(interestId) ? prev.filter((id) => id !== interestId) : [...prev, interestId],
    )
  }

  const handleSaveInterests = async () => {
    if (!onSaveInterests) return
    await onSaveInterests(draftInterests)
    setEditingInterests(false)
  }

  return (
    <aside className="hidden xl:flex w-72 flex-col gap-4 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto pb-6 no-scrollbar">
      
      {/* Widget Perfil */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="h-24 bg-gradient-to-br from-blue-600 via-indigo-500 to-fuchsia-500 w-full relative">
           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full border-4 border-white bg-white p-0.5 shadow-sm">
             <ProfileAvatar
               name={displayName}
               userId={userId}
               imageUrl={avatarUrl}
               size="md"
             />
           </div>
        </div>
        <div className="pt-10 pb-5 px-4 text-center flex flex-col items-center">
          <h3 className="font-bold text-gray-900 text-lg">{displayName}</h3>
          {academicLine ? (
            <p className="text-xs text-gray-500 mt-0.5">{academicLine}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5 italic">Sin carrera registrada</p>
          )}
          
          <AppLink
            to="/app/perfil"
            className="mt-4 block w-full rounded-full border border-violet-200 px-3 py-2.5 text-center text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50"
          >
            Ver perfil completo
          </AppLink>
        </div>
      </div>

      {/* Widget Mis intereses (solo para estudiantes) */}
      {!isOrganization && (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h4 className="font-bold text-gray-800 text-sm mb-3">Mis intereses</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedInterests.length > 0 ? (
            selectedInterests.map((interest, idx) => (
              <span
                key={interest.id}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  idx % 2 === 0 ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"
                }`}
              >
                #{interest.label}
              </span>
            ))
          ) : (
            <p className="text-xs text-gray-500">Aún no tienes intereses seleccionados.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditingInterests((prev) => !prev)}
          className="text-violet-600 text-xs font-semibold hover:underline"
        >
          {editingInterests ? "Cerrar edición" : "Editar intereses"}
        </button>
        {editingInterests ? (
          <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Selecciona tus intereses
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const active = draftInterests.includes(interest.id)
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {interest.label}
                  </button>
                )
              })}
            </div>
            {interestsError ? <p className="mt-2 text-[11px] text-rose-600">{interestsError}</p> : null}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftInterests([...interestsList])
                  setEditingInterests(false)
                }}
                className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600 hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={interestsSaving}
                onClick={handleSaveInterests}
                className="rounded-full bg-violet-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {interestsSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      )}

    </aside>
  );
}
