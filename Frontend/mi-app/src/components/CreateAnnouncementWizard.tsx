import { useState } from 'react'
import { X } from 'lucide-react'
import { createAnnouncement } from '../api/apiFunctions/announcements'
import type { AnnouncementCreate } from '../api/apiFunctions/announcements'

interface CreateAnnouncementWizardProps {
  onClose: () => void;
}

export default function CreateAnnouncementWizard({ onClose }: CreateAnnouncementWizardProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[]
  });

  const handleSubmit = async () => {
    try {
      // Llamar a API de announcements
      await createAnnouncement(formData as AnnouncementCreate);
      // Disparar evento para actualizar feed
      window.dispatchEvent(new CustomEvent('postCreated', { 
        detail: {
          type: 'announcement',
          data: formData
        }
      }));
      onClose();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Error al crear anuncio');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Crear Anuncio</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Título del anuncio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenido *
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Escribe el contenido del anuncio..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (separados por comas)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
              placeholder="académico, tecnología, eventos"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.content}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Anuncio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
