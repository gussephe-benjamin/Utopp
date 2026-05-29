import ReactDOM from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      {/* Modal Container */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 z-10"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-yellow-500'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
