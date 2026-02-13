import { useState } from 'react'

interface Step4GeneralInfoProps {
  title: string
  content: string
  deadline?: Date
  onChange: (data: { title: string; content: string; deadline?: Date }) => void
}

export default function Step4GeneralInfo({ title, content, deadline, onChange }: Step4GeneralInfoProps) {
  const handleTitleChange = (newTitle: string) => {
    onChange({ title: newTitle, content, deadline })
  }

  const handleContentChange = (newContent: string) => {
    onChange({ title, content: newContent, deadline })
  }

  const handleDeadlineChange = (newDeadline: string) => {
    const deadlineDate = newDeadline ? new Date(newDeadline) : undefined
    onChange({ title, content, deadline: deadlineDate })
  }

  const getCharacterCount = (text: string) => {
    return text.length
  }

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Título de la publicación"
        />
        <div className="text-xs text-gray-500 mt-1">
          {getCharacterCount(title)} caracteres
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contenido <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Describe tu publicación..."
        />
        <div className="text-xs text-gray-500 mt-1">
          {getCharacterCount(content)} caracteres • {getWordCount(content)} palabras
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha Límite <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={deadline ? deadline.toISOString().split('T')[0] : ''}
          onChange={(e) => handleDeadlineChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <div className="text-xs text-gray-500 mt-1">
          Fecha máxima para aplicar a esta oportunidad
        </div>
      </div>
    </div>
  )
}
