import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'
import { BENCHMARK_CORPUS } from '../../data/benchmarkCorpus'
import { isLiveApiEnabled } from '../../api/optimizationApi'
import { SectionHeader } from '../ui/SectionHeader'
import { MetricsTable } from '../metrics/MetricsTable'
import { TraceTimeline } from '../trace/TraceTimeline'
import type { BenchmarkCircuitDefinition } from '../../types/optimization'

export function TruthModePanel() {
  const {
    truthModeLoading,
    truthModeError,
    truthModeReport,
    runTruthMode,
    clearTruthMode,
  } = useStudioStore()

  const [selectedId, setSelectedId] = useState<string>(BENCHMARK_CORPUS[0].circuitId)
  const [showTrace, setShowTrace] = useState(false)

  const selected: BenchmarkCircuitDefinition | undefined = BENCHMARK_CORPUS.find(
    (c) => c.circuitId === selectedId,
  )

  const liveApi = isLiveApiEnabled()

  function handleRun() {
    if (selected) {
      runTruthMode(selected)
      setShowTrace(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin"
    >
      {/* Header */}
      <div className="panel-card p-4 border-cyan-600/30">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">
            Truth Mode
          </h2>
          <span
            className={`text-xs px-2 py-0.5 rounded font-mono ${
              liveApi
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {liveApi ? 'Live API' : 'Mock Adapter'}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Run the RQM Optimization API on a circuit and inspect the evidence —
          original vs optimized metrics, invariant checks, and full pass trace.
          {!liveApi && (
            <span className="block mt-1 text-amber-400/80">
              Set <code className="font-mono">VITE_RQM_API_URL</code> to connect to the live API.
            </span>
          )}
        </p>
      </div>

      {/* Circuit selector */}
      <div className="panel-card p-4">
        <SectionHeader title="Select Circuit" />
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value)
            clearTruthMode()
          }}
          className="w-full mt-2 bg-slate-800 border border-slate-600/60 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-cyan-500/60"
        >
          {BENCHMARK_CORPUS.map((c) => (
            <option key={c.circuitId} value={c.circuitId}>
              [{c.category}] {c.name}
            </option>
          ))}
        </select>

        {selected && (
          <div className="mt-3 flex flex-col gap-1.5">
            <p className="text-xs text-slate-400 leading-relaxed">{selected.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Qubits: {selected.qubitCount}</span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500">Backend: {selected.backend}</span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500">Gates: {selected.gateSequence.length}</span>
            </div>
            <div className="flex gap-1 flex-wrap mt-1">
              {selected.gateSequence.map((g, i) => (
                <span
                  key={i}
                  className="text-xs font-mono px-1.5 py-0.5 bg-slate-700/60 rounded text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={truthModeLoading || !selected}
          className="mt-4 w-full py-2 rounded text-sm font-semibold transition-all border
            bg-cyan-700/30 text-cyan-300 border-cyan-600/50
            hover:bg-cyan-600/40 hover:border-cyan-500/70
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {truthModeLoading ? '⏳ Running optimizer…' : '▶ Run Truth Mode'}
        </button>
      </div>

      {/* Error state */}
      {truthModeError && (
        <div className="panel-card p-4 border-red-500/30">
          <p className="text-sm text-red-400">Error: {truthModeError}</p>
        </div>
      )}

      {/* Results */}
      {truthModeReport && !truthModeLoading && (
        <>
          {/* Metrics */}
          <div className="panel-card p-4">
            <SectionHeader
              title="Optimization Metrics"
              subtitle={`${truthModeReport.baseline} · ${truthModeReport.backend}`}
            />
            <div className="mt-3">
              <MetricsTable
                original={truthModeReport.original}
                optimized={truthModeReport.optimized}
                delta={truthModeReport.delta}
              />
            </div>
          </div>

          {/* Invariants */}
          <div className="panel-card p-4">
            <SectionHeader title="Invariant Verification" />
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    truthModeReport.invariants.equivalent
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                  }`}
                >
                  {truthModeReport.invariants.equivalent ? '✓' : '✗'}
                </span>
                <span className="text-sm text-slate-300">
                  Unitary equivalence:{' '}
                  <span
                    className={
                      truthModeReport.invariants.equivalent ? 'text-teal-400' : 'text-red-400'
                    }
                  >
                    {truthModeReport.invariants.equivalent ? 'PRESERVED' : 'VIOLATED'}
                  </span>
                </span>
              </div>
              {truthModeReport.invariants.fidelity !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5" />
                  <span className="text-sm text-slate-400">
                    Fidelity:{' '}
                    <span className="font-mono text-cyan-300">
                      {truthModeReport.invariants.fidelity.toFixed(7)}
                    </span>
                  </span>
                </div>
              )}
              {truthModeReport.invariants.notes?.map((n, i) => (
                <p key={i} className="text-xs text-slate-500 italic pl-7">{n}</p>
              ))}
            </div>
          </div>

          {/* Transform trace */}
          <div className="panel-card p-4">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Transform Trace" />
              <button
                onClick={() => setShowTrace((v) => !v)}
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {showTrace ? 'Hide' : 'Show'}
              </button>
            </div>
            {showTrace && <TraceTimeline trace={truthModeReport.trace} />}
            {!showTrace && (
              <p className="text-xs text-slate-500">
                {truthModeReport.trace.filter((t) => t.applied).length} of{' '}
                {truthModeReport.trace.length} passes applied.
              </p>
            )}
          </div>

          {/* Notes */}
          {truthModeReport.notes && (
            <div className="panel-card p-4">
              <SectionHeader title="Notes" />
              <p className="text-sm text-slate-400 leading-relaxed mt-1">{truthModeReport.notes}</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
