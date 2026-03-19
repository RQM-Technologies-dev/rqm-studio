import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'

export function OptimizationDemo() {
  const { circuit, optimizedCircuit, optimizationNotes, mode } = useStudioStore()

  if (mode !== 'optimize') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4"
    >
      <div className="panel-card p-4 border-teal-600/30 shadow-glow-teal">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-teal-400">
            Compiler Optimization Demo
          </h3>
          <span className="text-xs text-slate-500">
            {optimizationNotes.length} rule(s) fired
          </span>
        </div>

        {/* Input circuit */}
        <div className="mb-2">
          <p className="text-xs text-slate-500 mb-1">Input circuit ({circuit.length} gates):</p>
          <div className="flex items-center gap-1 flex-wrap">
            {circuit.map((g, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded font-mono text-xs border"
                style={{ color: g.color, borderColor: `${g.color}55`, backgroundColor: `${g.color}15` }}
              >
                {g.label}
              </span>
            ))}
          </div>
        </div>

        {/* Optimized circuit */}
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1">
            Optimized circuit ({optimizedCircuit.length} gates):
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            {optimizedCircuit.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Empty circuit (all gates cancelled)</span>
            ) : (
              optimizedCircuit.map((g, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded font-mono text-xs border"
                  style={{ color: g.color, borderColor: `${g.color}55`, backgroundColor: `${g.color}15` }}
                >
                  {g.label}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Notes */}
        {optimizationNotes.length > 0 && (
          <div className="border-t border-slate-700/50 pt-3">
            <p className="text-xs text-slate-500 mb-1.5">Compiler passes:</p>
            <div className="flex flex-col gap-1">
              {optimizationNotes.map((note, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-teal-400 text-xs">✓</span>
                  <p className="text-xs text-slate-300">{note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {optimizationNotes.length === 0 && (
          <p className="text-xs text-slate-500 italic border-t border-slate-700/50 pt-3">
            No optimizations applicable — circuit is already in canonical form.
          </p>
        )}
      </div>
    </motion.div>
  )
}
