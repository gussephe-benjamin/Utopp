import React from "react"

const ModernStepper: React.FC<{
  currentStep: number
  totalSteps?: number
  onStepClick: (step: number) => void
}> = ({ currentStep, totalSteps = 5 }) => {

  return (
    <div className="w-full flex justify-center items-center py-3">
      <div className="flex items-center gap-2 bg-gradient-to-r from-[#fdfdfd] to-[#ffffff] px-3 py-2 rounded-full">

        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep

          return (
            <div
              key={stepNumber}
              className={`
                transition-all duration-500 ease-in-out
                ${isActive 
                  ? "w-12 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"
                  : "w-3 h-3 rounded-full bg-blue-500/70 hover:bg-blue-400"
                }
              `}
            />
          )
        })}

      </div>
    </div>
  )
}

export default ModernStepper
