import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'

export function CircuitStrip() {
  const { circuit, currentStep, stepForward, stepBackward, resetCircuit, jumpToStep } =
    useStudioStore()

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="panel-card mx-4 mb-4 p-3 flex flex-col gap-3"
    >
      {/* Circuit label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-cyan-500">
          Circuit
        </span>
        <span className="text-xs text-slate-500 font-mono">
          {circuit.length} gates
        </span>
      </div>

      {/* Gate lane */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
        {/* Initial state marker */}
        <div
          className={`
            flex-shrink-0 px-2 py-1.5 rounded text-xs font-mono border transition-all duration-200
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
              onClick={() => jumpToStep(index)}
              className={`
                px-2.5 py-1.5 rounded font-mono text-sm font-bold border transition-all duration-200
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
          onClick={resetCircuit}
          className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-all"
        >
          ↺ Reset
        </button>
        <button
          onClick={stepBackward}
          disabled={currentStep < 0}
          className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          onClick={stepForward}
          disabled={currentStep >= circuit.length - 1}
          className="px-3 py-1.5 text-xs rounded bg-cyan-700/30 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-700/50 hover:border-cyan-500/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium"
        >
          Next →
        </button>

        <div className="ml-auto text-xs text-slate-500 font-mono">
          {currentStep >= 0 ? circuit[currentStep]?.label : '|0⟩'} @ step {currentStep + 1}
        </div>
      </div>
    </motion.div>
  )
}
