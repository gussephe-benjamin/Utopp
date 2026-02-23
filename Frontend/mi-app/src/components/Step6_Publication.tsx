import { useState, useEffect } from 'react'
import { getMyProfile } from '../api/apiFunctions/profile'

interface UserProfile {
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

interface Step6PublicationProps {
  publicationType: string
  subtype: string
  title: string
  content: string
  deadline?: Date
  ctas: Array<{ id: string; label: string; url: string }>
  onPublish: () => void
  onBack: () => void
  isLoading?: boolean
  images?: string[]
}

export default function Step6Publication({
  publicationType,
  subtype,
  title,
  content,
  deadline,
  ctas,
  images = [
    "https://www1.utec.edu.pe/sites/default/files/styles/noticias_slider/public/noticias/sin_titulo-1_8.jpg",
    "https://cdn.aicad.es/asset/img/3/practicas-profecionales.png",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
    "https://www.oit.org.pe/wp-content/uploads/2024/10/Practicas-Profesionales-en-Peru.jpg"
  ]
}: Step6PublicationProps) {

  const [currentImage, setCurrentImage] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getMyProfile()
        setUserProfile(profile)
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    fetchUserProfile()
  }, [])

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToImage = (index: number) => {
    setCurrentImage(index)
  }

  const getTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      oportunidad_internacional: "Oportunidad Internacional",
      evento: "Evento",
      proyecto_academico: "Proyecto Académico",
      anuncio: "Anuncio"
    }
    return typeLabels[type] || type
  }

  const getSubtypeLabel = (type: string, subtype: string) => {
    const labels: Record<string, Record<string, string>> = {
      oportunidad_internacional: {
        intercambio: "Intercambio Estudiantil",
        pasantia: "Pasantía Profesional",
        investigacion: "Oportunidad de Investigación",
        "4+1": "Programa 4+1"
      },
      evento: {
        conferencia: "Conferencia",
        taller: "Taller",
        seminario: "Seminario",
        competencia: "Competencia"
      },
      proyecto_academico: {
        tesis: "Tesis",
        proyecto_investigacion: "Proyecto de Investigación",
        proyecto_extension: "Proyecto de Extensión"
      },
      anuncio: {
        general: "Anuncio General",
        beca: "Beca",
        convocatoria: "Convocatoria"
      }
    }

    return labels[type]?.[subtype] || subtype
  }

  const formatDate = (date?: Date) => {
    if (!date) return ""

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(date)
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between">
        {/* Perfil usuario */}
        <div className="flex items-center gap-3">
          {userProfile ? (
            <>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userProfile.full_name?.charAt(0).toUpperCase() || userProfile.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {userProfile.full_name || `Usuario ${userProfile.id}`}
                </p>
                <p className="text-sm text-gray-500">{userProfile.email}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold">
                U
              </div>
              <div>
                <p className="font-semibold text-gray-900">Cargando...</p>
                <p className="text-sm text-gray-500">Obteniendo datos</p>
              </div>
            </>
          )}
        </div>
        
        {/* Botón menú */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Chips de categoría */}
      <div className="px-4 pb-3 flex gap-2">
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
          {getTypeLabel(publicationType)}
        </span>
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
          {getSubtypeLabel(publicationType, subtype)}
        </span>
      </div>

      {/* IMAGE CAROUSEL */}
      <div className="relative h-80 bg-gray-200">
        <img 
          src={images[currentImage]} 
          alt={`Publication image ${currentImage + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Flechas de navegación */}
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white/90 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white/90 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Indicadores (puntitos) */}
      <div className="flex justify-center gap-2 py-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentImage 
                ? 'bg-gray-800 w-6' 
                : 'bg-gray-400 hover:bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {content}
        </p>
        
        <div className="border-t pt-3">
          {deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Fecha Límite: {formatDate(deadline)}</span>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER - Botones CTA */}
      <div className="p-4 border-t">
        {ctas.length > 0 && (
          <div className="flex gap-3">
            {ctas.map((cta, index) => (
              <a
                key={cta.id}
                href={cta.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-center ${
                  index === 0
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                    : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                {cta.label}
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}


