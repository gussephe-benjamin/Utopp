import { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className={`
      fixed inset-0 z-40 flex items-center justify-center
      transition-all duration-300 ease-in-out
      ${isVisible ? 'opacity-100' : 'opacity-0'}
      ${className}
    `}>
      {children}
    </div>
  )
}
