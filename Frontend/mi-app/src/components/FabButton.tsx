import { Plus } from 'lucide-react'

interface FabButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export default function FabButton({ onClick, isOpen = false }: FabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-50 ${
        isOpen ? 'rotate-45' : ''
      }`}
    >
      <Plus className="w-6 h-6" />
    </button>
  )
}
