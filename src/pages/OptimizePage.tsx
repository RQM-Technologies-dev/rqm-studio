import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudioStore } from '../store'
import { gateStepsToRqmCircuit } from '../api/optimizationApi'
import type { RqmCircuit } from '../types/optimization'
import { DEFAULT_CIRCUIT } from '../data/defaultCircuit'

const EXAMPLE_CIRCUIT_JSON = JSON.stringify(
  {
    schema_version: '1.0',
    num_qubits: 1,
    name: 'example',
    instructions: [
      { gate: 'H', targets: [0] },
      { gate: 'T', targets: [0] },
      { gate: 'H', targets: [0] },
      { gate: 'X', targets: [0] },
      { gate: 'X', targets: [0] },
      { gate: 'Z', targets: [0] },
      { gate: 'S', targets: [0] },
    ],
  },
  null,
  2,
)

const ERROR_GUIDANCE: Record<string, string> = {
  BAD_REQUEST: 'The request body was malformed. Ensure your JSON is valid and matches the rqm-circuits schema.',
  INVALID_JSON: 'The circuit JSON could not be parsed. Check for missing commas, brackets, or quotes.',
  CIRCUIT_VALIDATION_ERROR:
    'The circuit failed validation. Make sure every instruction has a "gate" (string) and "targets" (array of integers) field.',
  CIRCUIT_ANALYSIS_ERROR: 'Circuit analysis failed. Verify that gate names are supported and qubit indices are valid.',
  UNKNOWN: 'An unexpected error occurred. Please try again or check the console for details.',
}

function getErrorGuidance(code: string | null): string {
  if (!code) return ERROR_GUIDANCE.UNKNOWN
  return ERROR_GUIDANCE[code] ?? ERROR_GUIDANCE.UNKNOWN
}

export function OptimizePage() {
  const { runOptimize, runQuickstart, clearOptimize, optimizeLoading, optimizeError, optimizeErrorCode, optimizeResult, optimizeMeta } = useStudioStore()
  const [circuitJson, setCircuitJson] = useState(EXAMPLE_CIRCUIT_JSON)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleLoadExample = useCallback(() => {
    setCircuitJson(EXAMPLE_CIRCUIT_JSON)
    setParseError(null)
    clearOptimize()
  }, [clearOptimize])

  const handleLoadFromEditor = useCallback(() => {
    const gates = DEFAULT_CIRCUIT
    const circuit = gateStepsToRqmCircuit(gates, 'studio-circuit')
    setCircuitJson(JSON.stringify(circuit, null, 2))
    setParseError(null)
    clearOptimize()
  }, [clearOptimize])

  const handleOptimize = useCallback(async () => {
    setParseError(null)
    let circuit: RqmCircuit
    try {
      circuit = JSON.parse(circuitJson) as RqmCircuit
    } catch {
      setParseError('Invalid JSON — could not parse circuit. Check for syntax errors.')
      return
    }
    await runOptimize(circuit)
  }, [circuitJson, runOptimize])

  const handleQuickstart = useCallback(async () => {
    setParseError(null)
    await runQuickstart()
  }, [runQuickstart])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top quickstart banner */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-teal-900/20 border-b border-cyan-700/20 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs text-cyan-300 font-medium">
            🚀 <span className="font-semibold">Quickstart:</span> Try the optimizer in seconds
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Loads an example circuit and runs optimization automatically.
          </p>
        </div>
        <button
          onClick={handleQuickstart}
          disabled={optimizeLoading}
          className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-glow-cyan flex-shrink-0"
        >
          {optimizeLoading ? 'Optimizing…' : 'Try Optimization →'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Input panel */}
        <div className="w-[420px] flex-shrink-0 border-r border-slate-700/50 flex flex-col">
          <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
            <h2 className="text-sm font-semibold text-slate-200 mb-1">Circuit Input</h2>
            <p className="text-xs text-slate-400">
              Paste an <code className="text-cyan-400">rqm-circuits</code> JSON or load an example.
            </p>
          </div>
          <div className="flex gap-2 p-3 border-b border-slate-700/30 flex-shrink-0">
            <button
              onClick={handleLoadExample}
              className="px-3 py-1 rounded text-xs font-medium border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-colors"
            >
              Load Example
            </button>
            <button
              onClick={handleLoadFromEditor}
              className="px-3 py-1 rounded text-xs font-medium border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-colors"
            >
              From Visualizer
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-3">
            <textarea
              value={circuitJson}
              onChange={(e) => { setCircuitJson(e.target.value); setParseError(null) }}
              className="w-full h-full bg-slate-900/50 border border-slate-700 rounded p-3 text-xs font-mono text-slate-200 resize-none focus:outline-none focus:border-cyan-500/50 transition-colors"
              spellCheck={false}
              placeholder="Paste rqm-circuits JSON here…"
            />
          </div>
          {parseError && (
            <div className="p-3 border-t border-red-800/40">
              <p className="text-xs text-red-400">{parseError}</p>
            </div>
          )}
          <div className="p-3 border-t border-slate-700/50 flex gap-2 flex-shrink-0">
            <button
              onClick={handleOptimize}
              disabled={optimizeLoading}
              className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              {optimizeLoading ? 'Optimizing…' : '⚡ Optimize'}
            </button>
            <button
              onClick={() => { clearOptimize(); setParseError(null) }}
              className="px-3 py-2 rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Right: Results panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {!optimizeLoading && !optimizeResult && !optimizeError && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="text-5xl mb-4">⚛</div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Optimize</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Load a circuit on the left and click <strong className="text-slate-300">Optimize</strong>, or use the{' '}
                  <strong className="text-cyan-400">Try Optimization</strong> button above for a 30-second demo.
                </p>
              </motion.div>
            )}

            {optimizeLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mb-4" />
                <p className="text-sm text-slate-400">Running optimizer…</p>
              </motion.div>
            )}

            {!optimizeLoading && optimizeError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="panel-card border-red-800/40 p-6"
              >
                <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <span>⚠</span> Optimization Failed
                  {optimizeErrorCode && (
                    <span className="font-mono text-xs bg-red-900/30 px-2 py-0.5 rounded">{optimizeErrorCode}</span>
                  )}
                </h3>
                <p className="text-xs text-slate-300 mb-3">{optimizeError}</p>
                <p className="text-xs text-slate-400 bg-slate-800/50 rounded p-3">
                  💡 <strong>How to fix:</strong> {getErrorGuidance(optimizeErrorCode)}
                </p>
              </motion.div>
            )}

            {!optimizeLoading && optimizeResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div className="panel-card p-4 border-teal-600/30">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-2">Summary</h3>
                  <p className="text-sm text-slate-200">{optimizeResult.summary}</p>
                </div>

                {/* Before vs After metrics */}
                <div className="panel-card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Before vs After</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Gate Count</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-base font-mono text-slate-300">{optimizeResult.report.original_gate_count}</span>
                        <span className="text-xs text-slate-500">→</span>
                        <span className="text-base font-mono text-teal-400">{optimizeResult.report.optimized_gate_count}</span>
                      </div>
                      <p className="text-xs text-teal-400 mt-0.5">
                        -{optimizeResult.report.gate_count_delta} gates
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Depth</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-base font-mono text-slate-300">{optimizeResult.report.original_depth}</span>
                        <span className="text-xs text-slate-500">→</span>
                        <span className="text-base font-mono text-teal-400">{optimizeResult.report.optimized_depth}</span>
                      </div>
                      <p className="text-xs text-teal-400 mt-0.5">
                        -{optimizeResult.report.depth_delta} levels
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Equivalence</p>
                      <span className={`text-sm font-semibold ${optimizeResult.report.equivalence_verified ? 'text-teal-400' : 'text-red-400'}`}>
                        {optimizeResult.report.equivalence_verified ? '✓ Verified' : '✗ Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compiler passes */}
                {optimizeResult.report.passes_applied.length > 0 && (
                  <div className="panel-card p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Compiler Passes Applied</h3>
                    <div className="flex flex-col gap-1.5">
                      {optimizeResult.report.passes_applied.map((pass, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-teal-400 text-xs mt-0.5 flex-shrink-0">✓</span>
                          <p className="text-xs text-slate-300 font-mono">{pass}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimized circuit */}
                <div className="panel-card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Optimized Circuit</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {optimizeResult.optimized_circuit.instructions.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">Empty circuit (all gates cancelled)</span>
                    ) : (
                      optimizeResult.optimized_circuit.instructions.map((inst, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded font-mono text-xs border border-teal-600/30 text-teal-300 bg-teal-900/20"
                        >
                          {inst.gate}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Metadata */}
                {optimizeMeta && (
                  <div className="panel-card p-4 border-slate-700/30">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Request Metadata</h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Request ID</span>
                        <span className="text-xs font-mono text-slate-400">{optimizeMeta.request_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Processing time</span>
                        <span className="text-xs font-mono text-slate-400">{Math.round(optimizeMeta.processing_time_ms)}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">API version</span>
                        <span className="text-xs font-mono text-slate-400">{optimizeMeta.version}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
