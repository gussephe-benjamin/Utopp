interface CreateTypePanelProps {
  isOpen: boolean;
  onSelect: (type: 'community_post' | 'event' | 'announcement') => void;
}

export default function CreateTypePanel({ isOpen, onSelect }: CreateTypePanelProps) {
  const types = [
    { 
      type: 'community_post', 
      label: 'Publicación', 
      icon: '📝',
      desc: 'Compartir oportunidades, proyectos, etc.'
    },
    { 
      type: 'event', 
      label: 'Evento', 
      icon: '📅',
      desc: 'Crear eventos, talleres, conferencias'
    },
    { 
      type: 'announcement', 
      label: 'Anuncio', 
      icon: '📢',
      desc: 'Comunicados oficiales y noticias'
    }
  ];

  return (
    <div className={`fixed bottom-24 right-6 bg-white rounded-lg shadow-xl p-2 w-64 transition-all duration-300 z-40 ${
      isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}>
      {types.map((type) => (
        <button
          key={type.type}
          onClick={() => onSelect(type.type as 'community_post' | 'event' | 'announcement')}
          className="w-full p-3 hover:bg-gray-50 rounded-lg flex items-center space-x-3 transition-colors"
        >
          <span className="text-2xl">{type.icon}</span>
          <div className="text-left">
            <div className="font-medium text-gray-900">{type.label}</div>
            <div className="text-xs text-gray-500">{type.desc}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
