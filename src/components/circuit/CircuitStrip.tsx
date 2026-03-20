import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'

export function CircuitStrip() {
  const { circuit, currentStep, stepForward, stepBackward, resetCircuit, jumpToStep } =
    useStudioStore()

  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  // Auto-advance: step forward every 3 seconds while playing, looping continuously
  useEffect(() => {
    if (!isAutoPlaying) return

    const timer = setTimeout(() => {
      if (currentStep >= circuit.length - 1) {
        // Loop: reset to start and continue playing
        resetCircuit()
      } else {
        stepForward()
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [isAutoPlaying, currentStep, circuit.length, stepForward, resetCircuit])

  const handlePlayPause = useCallback(() => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false)
    } else {
      setIsAutoPlaying(true)
    }
  }, [isAutoPlaying])

  const handleReset = useCallback(() => {
    setIsAutoPlaying(false)
    resetCircuit()
  }, [resetCircuit])

  const handleBack = useCallback(() => {
    setIsAutoPlaying(false)
    stepBackward()
  }, [stepBackward])

  const handleNext = useCallback(() => {
    setIsAutoPlaying(false)
    stepForward()
  }, [stepForward])

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="panel-card mx-4 mb-4 p-4 flex flex-col gap-4"
    >
      {/* Circuit label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-500">
          Circuit
        </span>
        <span className="text-sm text-slate-500 font-mono">
          {circuit.length} gates
        </span>
      </div>

      {/* Gate lane */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
        {/* Initial state marker */}
        <div
          className={`
            flex-shrink-0 px-3 py-2 rounded text-sm font-mono border transition-all duration-200
            ${currentStep === -1
              ? 'border-cyan-500/60 text-cyan-400 bg-cyan-500/10'
              : 'border-slate-700/50 text-slate-600'
            }
          `}
        >
          |0⟩
        </div>

        <div className="w-4 h-px bg-slate-700 flex-shrink-0" />

        {/* Gate badges */}
        {circuit.map((gate, index) => (
          <div key={gate.id} className="flex items-center gap-0 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { setIsAutoPlaying(false); jumpToStep(index) }}
              className={`
                px-3 py-2 rounded font-mono text-base font-bold border transition-all duration-200
                ${index === currentStep
                  ? 'shadow-glow-sm'
                  : index < currentStep
                  ? 'opacity-50'
                  : 'opacity-30 hover:opacity-70'
                }
              `}
              style={{
                color: gate.color,
                borderColor: index === currentStep ? gate.color : '#334155',
                backgroundColor: index === currentStep ? `${gate.color}22` : 'transparent',
              }}
            >
              {gate.label}
            </motion.button>
            {index < circuit.length - 1 && (
              <div className="w-3 h-px bg-slate-700" />
            )}
          </div>
        ))}

        <div className="w-4 h-px bg-slate-700 flex-shrink-0" />
        <div className="flex-shrink-0 px-2 py-1.5 rounded text-xs font-mono border border-slate-700/50 text-slate-600">
          out
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-all"
        >
          ↺ Reset
        </button>
        <button
          onClick={handleBack}
          disabled={currentStep < 0}
          className="px-4 py-2 text-sm rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          onClick={handlePlayPause}
          className={`
            px-4 py-2 text-sm rounded border transition-all font-medium
            ${isAutoPlaying
              ? 'bg-amber-700/30 text-amber-400 border-amber-700/50 hover:bg-amber-600/30 hover:border-amber-500/60'
              : 'bg-cyan-700/30 text-cyan-400 border-cyan-700/50 hover:bg-cyan-600/30 hover:border-cyan-500/60'
            }
          `}
        >
          {isAutoPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={handleNext}
          disabled={currentStep >= circuit.length - 1}
          className="px-4 py-2 text-sm rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>

        <div className="ml-auto text-sm text-slate-500 font-mono">
          {currentStep >= 0 ? circuit[currentStep]?.label : '|0⟩'} @ step {currentStep + 1}
        </div>
      </div>
    </motion.div>
  )
}
