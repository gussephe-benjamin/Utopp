import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { getMyProfile, getProfile as apiGetProfile, follow, unfollow, updateInterests } from "../api/apiFunctions/profile"
import { Edit2, Users, Calendar, BookOpen, Clock } from "lucide-react"

interface ProfileData {
  id: number
  email: string
  full_name?: string
  interests?: string[]
  career?: string
  cycle?: number
  availability?: number
  followers_count: number
  following_count: number
  posts_count: number
  saved_event_ids: number[]
  attending_event_ids: number[]
}

const availabilityOptions = [
  { id: 0, label: 'Poco tiempo', emoji: '☕', description: '1-3 horas/semana' },
  { id: 1, label: 'Moderado', emoji: '⚖️', description: '4-6 horas/semana' },
  { id: 2, label: 'Disponible', emoji: '⚡', description: '7-10 horas/semana' },
  { id: 3, label: 'Muy flexible', emoji: '🚀', description: '11-15 horas/semana' },
  { id: 4, label: 'Máxima disponibilidad', emoji: '🌟', description: '15+ horas/semana' },
]

export default function Profile() {
  const params = useParams()
  const [data, setData] = useState<ProfileData | null>(null)
  const [editing, setEditing] = useState(false)
  const [interests, setInterests] = useState("")

  const isMe = useMemo(() => !params.id, [params.id])

  useEffect(() => {
    (async () => {
      if (isMe) {
        const d = await getMyProfile()
        setData(d)
        setInterests((d?.interests || []).join(", "))
      } else {
        const d = await apiGetProfile(Number(params.id))
        setData(d)
        setInterests((d?.interests || []).join(", "))
      }
    })()
  }, [isMe, params.id])

  if (!data) return <div className="p-4">Cargando...</div>

  async function saveInterests() {
    const arr = interests.split(",").map(s => s.trim()).filter(Boolean)
    const d = await updateInterests(arr)
    setData(d)
    setEditing(false)
  }

  async function doFollow() {
    if (!params.id) return
    await follow(Number(params.id))
    const d = await apiGetProfile(Number(params.id))
    setData(d)
  }

  async function doUnfollow() {
    if (!params.id) return
    await unfollow(Number(params.id))
    const d = await apiGetProfile(Number(params.id))
    setData(d)
  }

  const getAvailabilityInfo = (availabilityId?: number) => {
    return availabilityOptions.find(opt => opt.id === availabilityId) || availabilityOptions[0]
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Profile - Centrado */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col items-center text-center">
            {/* Foto de perfil */}
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-5xl font-bold mb-4 shadow-lg">
              {data.full_name?.charAt(0).toUpperCase() || data.email.charAt(0).toUpperCase()}
            </div>

            {/* Nombre */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {data.full_name || "Usuario"}
            </h1>

            {/* Email */}
            <p className="text-gray-600 mb-6">{data.email}</p>

            {/* Botones de seguir/dejar de seguir */}
            {!isMe && (
              <div className="flex gap-3">
                <button 
                  onClick={doFollow} 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Seguir
                </button>
                <button 
                  onClick={doUnfollow} 
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  Dejar de seguir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Contadores */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Estadísticas</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Publicaciones</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{data.posts_count}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Seguidores</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{data.followers_count}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Seguidos</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{data.following_count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Central - Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intereses */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Intereses</h2>
                {isMe && !editing && (
                  <button 
                    onClick={() => setEditing(true)} 
                    className="text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="flex flex-wrap gap-2">
                  {(data.interests || []).length > 0 ? (
                    data.interests!.map((interest, idx) => (
                      <span 
                        key={idx} 
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        #{interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Sin intereses registrados</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    value={interests}
                    onChange={e => setInterests(e.target.value)}
                    placeholder="Escribe tus intereses separados por coma..."
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={saveInterests} 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                    >
                      Guardar
                    </button>
                    <button 
                      onClick={() => setEditing(false)} 
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Carrera y Ciclo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Carrera */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Carrera</h3>
                </div>
                <p className="text-gray-700 font-medium">
                  {data.career || "No especificada"}
                </p>
              </div>

              {/* Ciclo */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Ciclo</h3>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {data.cycle || "No especificado"}
                </div>
              </div>
            </div>

            {/* Disponibilidad */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Disponibilidad</h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl">
                  {getAvailabilityInfo(data.availability).emoji}
                </span>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getAvailabilityInfo(data.availability).label}
                  </p>
                  <p className="text-gray-600">
                    {getAvailabilityInfo(data.availability).description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
